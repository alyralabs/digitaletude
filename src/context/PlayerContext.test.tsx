import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSyncExternalStore } from 'react'
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
  const {
    currentTrack,
    isPlaying,
    toggle,
    prev,
    next,
    stop,
    seekCommit,
    volume,
    setVolume,
  } = usePlayer()
  return (
    <div>
      <p>current: {currentTrack ? currentTrack.title : 'none'}</p>
      <p>playing: {String(isPlaying)}</p>
      <p>volume: {volume}</p>
      {tracks.map((t) => (
        <button key={t.id} onClick={() => toggle(t, tracks)}>
          toggle {t.title}
        </button>
      ))}
      <button onClick={() => prev()}>prev</button>
      <button onClick={() => next()}>next</button>
      <button onClick={() => stop()}>stop</button>
      <button onClick={() => seekCommit(60)}>seek to 60</button>
      <button onClick={() => setVolume(0.5)}>set volume</button>
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
  localStorage.clear()
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

  it('timeupdate ticks reach time subscribers without re-rendering other consumers', () => {
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    HTMLMediaElement.prototype.pause = vi.fn()

    let trackProbeRenders = 0
    function TrackProbe() {
      const { currentTrack } = usePlayer()
      trackProbeRenders++
      return <p>track: {currentTrack?.title ?? 'none'}</p>
    }
    function TimeProbe() {
      const { subscribeTime, getTime } = usePlayer()
      const time = useSyncExternalStore(subscribeTime, getTime)
      return <p>time: {time}</p>
    }

    render(
      <PlayerProvider>
        <TrackProbe />
        <TimeProbe />
      </PlayerProvider>,
    )
    const audio = document.querySelector('audio')!
    const rendersBeforeTick = trackProbeRenders

    audio.currentTime = 42
    fireEvent(audio, new Event('timeupdate'))

    expect(screen.getByText('time: 42')).toBeInTheDocument()
    expect(trackProbeRenders).toBe(rendersBeforeTick)
  })

  it('next walks the queue and wraps from the last track to the first', async () => {
    const user = userEvent.setup()
    renderPlayer([
      track({ id: 't1', title: 'One', audioUrl: 'https://x/1.mp3' }),
      track({ id: 't2', title: 'Two', audioUrl: 'https://x/2.mp3' }),
    ])

    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    await user.click(screen.getByRole('button', { name: 'next' }))
    expect(screen.getByText('current: Two')).toBeInTheDocument()
    expect(screen.getByText('playing: true')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'next' }))
    expect(screen.getByText('current: One')).toBeInTheDocument()
  })

  it('prev goes to the previous track near the start, restarts otherwise', async () => {
    const user = userEvent.setup()
    renderPlayer([
      track({ id: 't1', title: 'One', audioUrl: 'https://x/1.mp3' }),
      track({ id: 't2', title: 'Two', audioUrl: 'https://x/2.mp3' }),
    ])

    await user.click(screen.getByRole('button', { name: 'toggle Two' }))
    // near the start (currentTime 0) — previous track, wrapping backwards
    await user.click(screen.getByRole('button', { name: 'prev' }))
    expect(screen.getByText('current: One')).toBeInTheDocument()

    // more than 3s in — prev restarts the current track instead
    const audio = document.querySelector('audio')!
    audio.currentTime = 30
    await user.click(screen.getByRole('button', { name: 'prev' }))
    expect(screen.getByText('current: One')).toBeInTheDocument()
    expect(audio.currentTime).toBe(0)
  })

  it('auto-advances to the next queue track when a song ends', async () => {
    const user = userEvent.setup()
    renderPlayer([
      track({ id: 't1', title: 'One', audioUrl: 'https://x/1.mp3' }),
      track({ id: 't2', title: 'Two', audioUrl: 'https://x/2.mp3' }),
    ])

    await user.click(screen.getByRole('button', { name: 'toggle One' }))
    fireEvent(document.querySelector('audio')!, new Event('ended'))

    expect(screen.getByText('current: Two')).toBeInTheDocument()
    expect(screen.getByText('playing: true')).toBeInTheDocument()
  })

  it('setVolume clamps, applies to the element, and persists', async () => {
    const user = userEvent.setup()
    renderPlayer([track({ title: 'One' })])

    await user.click(screen.getByRole('button', { name: 'set volume' }))

    expect(screen.getByText('volume: 0.5')).toBeInTheDocument()
    expect(document.querySelector('audio')?.volume).toBe(0.5)
    expect(localStorage.getItem('player-volume')).toBe('0.5')
  })

  it('reads the persisted volume on mount', () => {
    localStorage.setItem('player-volume', '0.25')
    renderPlayer([track({ title: 'One' })])
    expect(screen.getByText('volume: 0.25')).toBeInTheDocument()
  })

  it('usePlayer throws outside a PlayerProvider', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe tracks={[]} />)).toThrow(
      'usePlayer must be used within a PlayerProvider',
    )
    spy.mockRestore()
  })
})
