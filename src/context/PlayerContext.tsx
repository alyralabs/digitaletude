import { useRef, useState, type ReactNode } from 'react'
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

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const storeRef = useRef<TimeStore>({
    time: 0,
    duration: null,
    scrubbing: false,
    listeners: new Set(),
  })
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)

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

  function toggle(track: Track) {
    const audio = audioRef.current
    if (!audio) return
    if (currentTrack?.id === track.id && isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }
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

  function seekCommit(value: number) {
    const audio = audioRef.current
    if (audio) audio.currentTime = value
    storeRef.current.scrubbing = false
    storeRef.current.time = value
    emit()
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        toggle,
        stop,
        seekChange,
        seekCommit,
        subscribeTime,
        getTime,
        getDuration,
      }}
    >
      {/* One shared player: swapping `src` here avoids multiple audio
          elements playing simultaneously, since there's no browser-level
          exclusivity between separate <audio> tags. */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
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
