import { useEffect, useRef, useState, type ReactNode } from 'react'
import { PlayerContext } from './player'
import type { Track } from '../lib/types'

// Time lives outside React state (see player.ts): mutating this store and
// notifying listeners re-renders only the subscribed time displays, not
// every context consumer.
type TimeStore = {
  time: number
  duration: number | null
  scrubbing: boolean
  listeners: Set<() => void>
}

const VOLUME_KEY = 'player-volume'

function getInitialVolume() {
  const raw = localStorage.getItem(VOLUME_KEY)
  if (raw === null) return 1
  const parsed = Number(raw)
  return Number.isFinite(parsed) && parsed >= 0 && parsed <= 1 ? parsed : 1
}

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const storeRef = useRef<TimeStore>({
    time: 0,
    duration: null,
    scrubbing: false,
    listeners: new Set(),
  })
  const analyserRef = useRef<AnalyserNode | null>(null)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [queue, setQueue] = useState<Track[]>([])
  const [volume, setVolumeState] = useState(getInitialVolume)

  // The <audio> element mounts after the first render, so the persisted
  // volume can't be applied inline where state initializes.
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume
  }, [volume])

  function emit() {
    for (const listener of storeRef.current.listeners) listener()
  }

  function subscribeTime(listener: () => void) {
    storeRef.current.listeners.add(listener)
    return () => {
      storeRef.current.listeners.delete(listener)
    }
  }

  function getTime() {
    return storeRef.current.time
  }

  function getDuration() {
    return storeRef.current.duration
  }

  function ensureAnalyser() {
    const audio = audioRef.current
    if (!audio || analyserRef.current) return
    // createMediaElementSource throws InvalidStateError if called twice on
    // the same element, so this only ever runs once, on the first play() —
    // which is guaranteed to follow a user gesture, satisfying the
    // AudioContext autoplay-suspend policy too.
    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext
    // Absent in test environments (jsdom has no Web Audio API) and very old
    // browsers — playback itself never depends on this, only the
    // visualizer's analyser does, so skip quietly rather than throw.
    if (!AudioContextCtor) return
    const ctx = new AudioContextCtor()
    // Safari can still hand back a suspended context despite the gesture;
    // a suspended graph captures the element's audio and plays nothing.
    if (ctx.state === 'suspended') void ctx.resume()
    const source = ctx.createMediaElementSource(audio)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyser.connect(ctx.destination)
    analyserRef.current = analyser
  }

  function play(track: Track) {
    const audio = audioRef.current
    if (!audio) return
    ensureAnalyser()
    // Only reassign `src` when it's actually a different track — this is
    // the fix for the reload-on-resume bug: reassigning unconditionally
    // triggers the media-element loading algorithm from scratch even when
    // resuming the exact same track that was just paused.
    if (audio.src !== track.audioUrl) {
      audio.src = track.audioUrl
      storeRef.current.time = 0
      storeRef.current.duration = null
      emit()
    }
    void audio.play()
    setCurrentTrack(track)
    setIsPlaying(true)
  }

  function getAnalyser() {
    return analyserRef.current
  }

  function toggle(track: Track, newQueue?: Track[]) {
    if (newQueue) setQueue(newQueue)
    if (currentTrack?.id === track.id && isPlaying) {
      audioRef.current?.pause()
      setIsPlaying(false)
      return
    }
    play(track)
  }

  function currentIndex() {
    return queue.findIndex((t) => t.id === currentTrack?.id)
  }

  function next() {
    const i = currentIndex()
    if (i === -1) return
    // Wraps last → first: one-artist catalog, keep the music going.
    play(queue[(i + 1) % queue.length])
  }

  function seekCommit(value: number) {
    const audio = audioRef.current
    if (audio) audio.currentTime = value
    storeRef.current.scrubbing = false
    storeRef.current.time = value
    emit()
  }

  function prev() {
    const audio = audioRef.current
    if (!audio) return
    const i = currentIndex()
    // Standard transport behavior: more than a few seconds into a song,
    // prev restarts it; only near the start does it go back a track.
    // seekCommit is declared above because React Compiler bails out on the
    // whole component when a hoisted function is referenced before its
    // declaration ("[PruneHoistedContexts]" Todo) — and that bailout
    // un-memoizes getAnalyser, which VisualizerOverlay's scene effect keys
    // on, so every play/pause rebuilt the WebGL scene on a dead context.
    if (audio.currentTime > 3 || i === -1) {
      seekCommit(0)
      return
    }
    play(queue[(i - 1 + queue.length) % queue.length])
  }

  function stop() {
    audioRef.current?.pause()
    setCurrentTrack(null)
    setIsPlaying(false)
  }

  function seekChange(value: number) {
    storeRef.current.scrubbing = true
    storeRef.current.time = value
    emit()
  }

  function setVolume(value: number) {
    const clamped = Math.min(1, Math.max(0, value))
    if (audioRef.current) audioRef.current.volume = clamped
    setVolumeState(clamped)
    localStorage.setItem(VOLUME_KEY, String(clamped))
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        toggle,
        prev,
        next,
        stop,
        seekChange,
        seekCommit,
        volume,
        setVolume,
        subscribeTime,
        getTime,
        getDuration,
        getAnalyser,
      }}
    >
      {/* One shared player: swapping `src` here avoids multiple audio
          elements playing simultaneously, since there's no browser-level
          exclusivity between separate <audio> tags. crossOrigin is set
          before any src is ever assigned so the visualizer's AnalyserNode
          isn't fed a CORS-tainted (silent) source once ensureAnalyser wires
          this element into the Web Audio graph. */}
      <audio
        ref={audioRef}
        crossOrigin="anonymous"
        onEnded={() => {
          // Auto-advance through the queue (wrapping); a queue-less track
          // just stops like before.
          const i = currentIndex()
          if (i === -1) {
            setIsPlaying(false)
            return
          }
          play(queue[(i + 1) % queue.length])
        }}
        onTimeUpdate={() => {
          // A drag in progress owns the time until release — otherwise
          // the ~4x/second timeupdate tick yanks the slider thumb back to
          // the playback position mid-drag.
          if (storeRef.current.scrubbing) return
          storeRef.current.time = audioRef.current?.currentTime ?? 0
          emit()
        }}
        onLoadedMetadata={() => {
          storeRef.current.duration = audioRef.current?.duration ?? null
          emit()
        }}
        className="hidden"
      />
      {children}
    </PlayerContext.Provider>
  )
}
