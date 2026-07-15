import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerProvider } from './PlayerContext'
import { usePlayer } from './player'
import type { Track } from '../lib/types'

function track(overrides: Partial<Track> = {}): Track {
  return {
    id: 't1',
    title: 'A Track',
    description: '',
    durationSeconds: 125,
    albumId: null,
    trackNumber: null,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
    metadata: {},
    audioUrl: 'https://example.com/t1.mp3',
    coverUrl: null,
    ...overrides,
  }
}

// Minimal consumer exposing the context's state and actions as plain
// elements — the real UI (TrackRow, NowPlayingBar) is covered by its own
// component tests; this file tests the player logic itself.
function Probe({ tracks }: { tracks: Track[] }) {
  const { currentTrack, isPlaying, toggle, stop, seekCommit } = usePlayer()
  return (
    <div>
      <p>current: {currentTrack ? currentTrack.title : 'none'}</p>
      <p>playing: {String(isPlaying)}</p>
      {tracks.map((t) => (
        <button key={t.id} onClick={() => toggle(t)}>
          toggle {t.title}
        </button>
      ))}
      <button onClick={() => stop()}>stop</button>
      <button onClick={() => seekCommit(60)}>seek to 60</button>
    </div>
  )
}

function renderPlayer(tracks: Track[]) {
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  return render(
    <PlayerProvider>
      <Probe tracks={tracks} />
    </PlayerProvider>,
  )
}

afterEach(() => {
  Reflect.deleteProperty(HTMLMediaElement.prototype, 'src')
})

describe('PlayerContext', () => {
  it('starts playback on toggle and keeps the current track when paused', async () => {
    const user = userEvent.setup()
    renderPlayer([track({ title: 'One' })])

    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    expect(screen.getByText('current: One')).toBeInTheDocument()
    expect(screen.getByText('playing: true')).toBeInTheDocument()
    expect(HTMLMediaElement.prototype.play).toHaveBeenCalled()

    // pausing must not clear the current track — the mini-player bar stays
    // visible in a paused state rather than disappearing
    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    expect(screen.getByText('current: One')).toBeInTheDocument()
    expect(screen.getByText('playing: false')).toBeInTheDocument()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('does not reassign audio.src when resuming a paused track, and does when switching', async () => {
    const user = userEvent.setup()

    let currentSrc = ''
    const srcSetter = vi.fn((v: string) => {
      currentSrc = v
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      configurable: true,
      get: () => currentSrc,
      set: srcSetter,
    })

    renderPlayer([
      track({ id: 't1', title: 'One', audioUrl: 'https://x/1.mp3' }),
      track({ id: 't2', title: 'Two', audioUrl: 'https://x/2.mp3' }),
    ])

    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    expect(srcSetter).toHaveBeenCalledTimes(1)

    // pause, then resume the same track — must not reload
    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    expect(srcSetter).toHaveBeenCalledTimes(1)

    // switching to a genuinely different track still reloads
    await user.click(screen.getByRole('button', { name: 'toggle Two' }))
    expect(srcSetter).toHaveBeenCalledTimes(2)
  })

  it('seekCommit sets the audio element currentTime', async () => {
    const user = userEvent.setup()
    renderPlayer([track({ title: 'One' })])

    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    await user.click(screen.getByRole('button', { name: 'seek to 60' }))

    expect(document.querySelector('audio')?.currentTime).toBe(60)
  })

  it('stop pauses playback and clears the current track', async () => {
    const user = userEvent.setup()
    renderPlayer([track({ title: 'One' })])

    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    await user.click(screen.getByRole('button', { name: 'stop' }))

    expect(screen.getByText('current: none')).toBeInTheDocument()
    expect(screen.getByText('playing: false')).toBeInTheDocument()
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('usePlayer throws outside a PlayerProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe tracks={[]} />)).toThrow(
      'usePlayer must be used within a PlayerProvider',
    )
    spy.mockRestore()
  })
})
