import { createContext, useContext } from 'react'
import type { Track } from '../lib/types'

export type PlayerContextValue = {
  currentTrack: Track | null
  isPlaying: boolean
  toggle: (track: Track) => void
  stop: () => void
  seekChange: (value: number) => void
  seekCommit: (value: number) => void
  // Playback time ticks ~4x/second — exposing it as React state here would
  // re-render every consumer (Footer, the whole Music track list) on each
  // tick for the entire listening session. Instead it lives in a plain
  // subscription store; only components that actually display time
  // subscribe, via useSyncExternalStore.
  subscribeTime: (listener: () => void) => () => void
  getTime: () => number
  getDuration: () => number | null
}

export const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
