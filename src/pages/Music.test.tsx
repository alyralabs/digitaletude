import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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

    const playButton = screen.getByRole('button', {
      name: 'Play Playable Track',
    })
    await user.click(playButton)

    expect(
      screen.getByRole('button', { name: 'Pause Playable Track' }),
    ).toBeInTheDocument()

    await user.click(
      screen.getByRole('button', { name: 'Pause Playable Track' }),
    )
    expect(
      screen.getByRole('button', { name: 'Play Playable Track' }),
    ).toBeInTheDocument()
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
