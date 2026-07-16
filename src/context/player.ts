import { createContext, useContext } from 'react'
import type { Track } from '../lib/types'

export type PlayerContextValue = {
  currentTrack: Track | null
  isPlaying: boolean
  // Passing a queue tells the player what prev/next/auto-advance walk
  // through; playing without one leaves the previous queue in place.
  toggle: (track: Track, queue?: Track[]) => void
  prev: () => void
  next: () => void
  stop: () => void
  seekChange: (value: number) => void
  seekCommit: (value: number) => void
  volume: number
  setVolume: (value: number) => void
  // Playback time ticks ~4x/second — exposing it as React state here would
  // re-render every consumer (Footer, the whole Music track list) on each
  // tick for the entire listening session. Instead it lives in a plain
  // subscription store; only components that actually display time
  // subscribe, via useSyncExternalStore.
  subscribeTime: (listener: () => void) => () => void
  getTime: () => number
  getDuration: () => number | null
  // Lazily created on first play() (guaranteed to follow a user gesture) and
  // cached for the life of the shared <audio> element — createMediaElementSource
  // throws if called twice on the same element, so this must never be
  // recreated per visualizer-open.
  getAnalyser: () => AnalyserNode | null
}

export const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
