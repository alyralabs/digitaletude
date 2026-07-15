import { useRef, useState, type ReactNode } from 'react'
import { PlayerContext } from './player'
import type { Track } from '../lib/types'

export function PlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState<number | null>(null)
  const [scrubbing, setScrubbing] = useState(false)

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
      setCurrentTime(0)
      setDuration(null)
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
    setScrubbing(true)
    setCurrentTime(value)
  }

  function seekCommit(value: number) {
    const audio = audioRef.current
    if (audio) audio.currentTime = value
    setCurrentTime(value)
    setScrubbing(false)
  }

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        toggle,
        stop,
        seekChange,
        seekCommit,
      }}
    >
      {/* One shared player: swapping `src` here avoids multiple audio
          elements playing simultaneously, since there's no browser-level
          exclusivity between separate <audio> tags. */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          // A drag in progress owns `currentTime` until release — otherwise
          // the ~4x/second timeupdate tick yanks the slider thumb back to
          // the playback position mid-drag.
          if (scrubbing) return
          setCurrentTime(audioRef.current?.currentTime ?? 0)
        }}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration ?? null)
        }}
        className="hidden"
      />
      {children}
    </PlayerContext.Provider>
  )
}
