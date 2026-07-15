import { createContext, useContext } from 'react'
import type { Track } from '../lib/types'

export type PlayerContextValue = {
  currentTrack: Track | null
  isPlaying: boolean
  currentTime: number
  duration: number | null
  toggle: (track: Track) => void
  stop: () => void
  seekChange: (value: number) => void
  seekCommit: (value: number) => void
}

export const PlayerContext = createContext<PlayerContextValue | null>(null)

export function usePlayer() {
  const context = useContext(PlayerContext)
  if (!context) {
    throw new Error('usePlayer must be used within a PlayerProvider')
  }
  return context
}
