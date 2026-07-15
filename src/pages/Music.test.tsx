import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import Music, { loader } from './Music'
import type { MusicPayload, Track } from '../lib/types'

vi.mock('../lib/api', () => ({
  fetchMusic: vi.fn(),
}))

// @primeicons/react@8.0.0-alpha.1's package exports map is broken (see the
// alias workaround in vite.config.ts); Vitest resolves this dependency
// through Node's own resolver rather than Vite's, so the alias doesn't
// apply here. Mocking the two icons this page uses sidesteps it.
vi.mock('@primeicons/react/play', () => ({
  Play: () => <span>play-icon</span>,
}))
vi.mock('@primeicons/react/pause', () => ({
  Pause: () => <span>pause-icon</span>,
}))

import { fetchMusic } from '../lib/api'

function renderMusic() {
  const router = createMemoryRouter([{ path: '/', Component: Music, loader }])
  return render(
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>,
  )
}

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

describe('Music', () => {
  it('fetches /api/music and renders the empty state when there is nothing', async () => {
    vi.mocked(fetchMusic).mockResolvedValue({
      albums: [],
      singles: [],
    } satisfies MusicPayload)

    renderMusic()

    expect(await screen.findByText('No music yet.')).toBeInTheDocument()
    expect(fetchMusic).toHaveBeenCalled()
  })

  it('renders album tracks under their album and singles separately', async () => {
    vi.mocked(fetchMusic).mockResolvedValue({
      albums: [
        {
          id: 'a1',
          title: 'An Album',
          description: '',
          sortOrder: 0,
          createdAt: '2026-01-01T00:00:00Z',
          metadata: {},
          coverUrl: null,
          tracks: [
            track({ id: 'album-track', title: 'Album Track', albumId: 'a1' }),
          ],
        },
      ],
      singles: [track({ id: 'single-track', title: 'Single Track' })],
    } satisfies MusicPayload)

    renderMusic()

    expect(await screen.findByText('Album Track')).toBeInTheDocument()
    expect(screen.getByText('Single Track')).toBeInTheDocument()
    expect(screen.getByText('Singles')).toBeInTheDocument()
  })

  it('clicking play sets the shared audio element source and toggles to pause', async () => {
    vi.mocked(fetchMusic).mockResolvedValue({
      albums: [],
      singles: [track({ title: 'Playable Track' })],
    } satisfies MusicPayload)
    const user = userEvent.setup()
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    HTMLMediaElement.prototype.pause = vi.fn()

    renderMusic()
    await screen.findByText('Playable Track')

    // Bar isn't mounted yet, so this label is still unambiguous.
    const playButton = screen.getByRole('button', {
      name: 'Play Playable Track',
    })
    await user.click(playButton)

    const bar = screen.getByRole('region', { name: 'Now playing' })
    expect(
      within(bar).getByRole('button', { name: 'Pause Playable Track' }),
    ).toBeInTheDocument()

    await user.click(
      within(bar).getByRole('button', { name: 'Pause Playable Track' }),
    )
    expect(
      within(bar).getByRole('button', { name: 'Play Playable Track' }),
    ).toBeInTheDocument()
  })

  it('does not reassign audio.src when resuming a paused track, and does when switching tracks', async () => {
    vi.mocked(fetchMusic).mockResolvedValue({
      albums: [],
      singles: [
        track({ id: 't1', title: 'Track One', audioUrl: 'https://x/1.mp3' }),
        track({ id: 't2', title: 'Track Two', audioUrl: 'https://x/2.mp3' }),
      ],
    } satisfies MusicPayload)
    const user = userEvent.setup()
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    HTMLMediaElement.prototype.pause = vi.fn()

    let currentSrc = ''
    const srcSetter = vi.fn((v: string) => {
      currentSrc = v
    })
    Object.defineProperty(HTMLMediaElement.prototype, 'src', {
      configurable: true,
      get: () => currentSrc,
      set: srcSetter,
    })

    renderMusic()
    await screen.findByText('Track One')

    await user.click(screen.getByRole('button', { name: 'Play Track One' }))
    expect(srcSetter).toHaveBeenCalledTimes(1)

    const bar = screen.getByRole('region', { name: 'Now playing' })
    await user.click(
      within(bar).getByRole('button', { name: 'Pause Track One' }),
    )
    // resuming the same, still-paused track must not reload
    await user.click(
      within(bar).getByRole('button', { name: 'Play Track One' }),
    )
    expect(srcSetter).toHaveBeenCalledTimes(1)

    // switching to a genuinely different track still reloads
    await user.click(screen.getByRole('button', { name: 'Play Track Two' }))
    expect(srcSetter).toHaveBeenCalledTimes(2)

    Reflect.deleteProperty(HTMLMediaElement.prototype, 'src')
  })

  it('shows the mini-player bar once a track starts and keeps it visible while paused', async () => {
    vi.mocked(fetchMusic).mockResolvedValue({
      albums: [],
      singles: [track({ title: 'Playable Track' })],
    } satisfies MusicPayload)
    const user = userEvent.setup()
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    HTMLMediaElement.prototype.pause = vi.fn()

    renderMusic()
    await screen.findByText('Playable Track')

    expect(
      screen.queryByRole('region', { name: 'Now playing' }),
    ).not.toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Play Playable Track' }),
    )

    const bar = screen.getByRole('region', { name: 'Now playing' })
    expect(within(bar).getByText('Playable Track')).toBeInTheDocument()

    await user.click(
      within(bar).getByRole('button', { name: 'Pause Playable Track' }),
    )
    expect(
      screen.getByRole('region', { name: 'Now playing' }),
    ).toBeInTheDocument()
  })

  it('seeking sets the audio element currentTime', async () => {
    vi.mocked(fetchMusic).mockResolvedValue({
      albums: [],
      singles: [track({ title: 'Playable Track', durationSeconds: 125 })],
    } satisfies MusicPayload)
    const user = userEvent.setup()
    HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
    HTMLMediaElement.prototype.pause = vi.fn()

    renderMusic()
    await screen.findByText('Playable Track')
    await user.click(
      screen.getByRole('button', { name: 'Play Playable Track' }),
    )

    const slider = screen.getByRole('slider')
    fireEvent.change(slider, { target: { value: '60' } })

    const audio = document.querySelector('audio')
    expect(audio?.currentTime).toBe(60)
  })

  it('renders external metadata links', async () => {
    vi.mocked(fetchMusic).mockResolvedValue({
      albums: [],
      singles: [
        track({
          title: 'Linked Track',
          metadata: {
            links: { soundcloud: 'https://soundcloud.example/track' },
          },
        }),
      ],
    } satisfies MusicPayload)

    renderMusic()

    const link = await screen.findByRole('link', { name: 'soundcloud' })
    expect(link).toHaveAttribute('href', 'https://soundcloud.example/track')
  })
})
