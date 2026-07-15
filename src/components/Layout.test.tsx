import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import Layout from './Layout'
import Music from '../pages/Music'
import Photography from '../pages/Photography'
import { musicLoader, photographyLoader } from '../lib/loaders'
import { ThemeProvider } from '../context/ThemeContext'
import type { MusicPayload } from '../lib/types'

vi.mock('../lib/api', () => ({
  fetchMusic: vi.fn(),
  fetchPhotos: vi.fn(),
}))

// Same broken-exports-map workaround as the other test files: every icon
// imported anywhere in this render tree (NavBar, NowPlayingBar, the pages)
// has to be mocked so Vitest never loads the real modules.
vi.mock('@primeicons/react/bars', () => ({
  Bars: () => <span>bars-icon</span>,
}))
vi.mock('@primeicons/react/moon', () => ({
  Moon: () => <span>moon-icon</span>,
}))
vi.mock('@primeicons/react/sun', () => ({ Sun: () => <span>sun-icon</span> }))
vi.mock('@primeicons/react/times', () => ({
  Times: () => <span>times-icon</span>,
}))
vi.mock('@primeicons/react/play', () => ({
  Play: () => <span>play-icon</span>,
}))
vi.mock('@primeicons/react/pause', () => ({
  Pause: () => <span>pause-icon</span>,
}))
vi.mock('@primeicons/react/chevron-left', () => ({
  ChevronLeft: () => <span>chevron-left-icon</span>,
}))
vi.mock('@primeicons/react/chevron-right', () => ({
  ChevronRight: () => <span>chevron-right-icon</span>,
}))

import { fetchMusic, fetchPhotos } from '../lib/api'

function stubMatchMedia() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

function renderLayout() {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <Layout />,
        children: [
          { path: 'music', Component: Music, loader: musicLoader },
          {
            path: 'photography',
            Component: Photography,
            loader: photographyLoader,
          },
        ],
      },
    ],
    { initialEntries: ['/music'] },
  )
  return render(
    <PrimeReactProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </PrimeReactProvider>,
  )
}

beforeEach(() => {
  stubMatchMedia()
  HTMLMediaElement.prototype.play = vi.fn().mockResolvedValue(undefined)
  HTMLMediaElement.prototype.pause = vi.fn()
  vi.mocked(fetchMusic).mockResolvedValue({
    albums: [],
    singles: [
      {
        id: 't1',
        title: 'Persistent Track',
        description: '',
        durationSeconds: 125,
        albumId: null,
        trackNumber: null,
        sortOrder: 0,
        createdAt: '2026-01-01T00:00:00Z',
        metadata: {},
        audioUrl: 'https://example.com/t1.mp3',
        coverUrl: null,
      },
    ],
  } satisfies MusicPayload)
  vi.mocked(fetchPhotos).mockResolvedValue([])
})

describe('Layout player persistence', () => {
  it('keeps the player bar (and its track) alive across route navigation', async () => {
    const user = userEvent.setup()
    renderLayout()

    await screen.findByText('Persistent Track')
    await user.click(
      screen.getByRole('button', { name: 'Play Persistent Track' }),
    )

    // the bar is lazy-loaded, so it appears async even in jsdom
    const bar = await screen.findByRole('region', { name: 'Now playing' })
    expect(within(bar).getByText('Persistent Track')).toBeInTheDocument()

    await user.click(screen.getByRole('link', { name: 'Photography' }))
    await screen.findByText('No photos yet.')

    const barAfterNav = screen.getByRole('region', { name: 'Now playing' })
    expect(
      within(barAfterNav).getByText('Persistent Track'),
    ).toBeInTheDocument()
    expect(HTMLMediaElement.prototype.pause).not.toHaveBeenCalled()
  })

  it('the close button stops playback and dismisses the bar', async () => {
    const user = userEvent.setup()
    renderLayout()

    await screen.findByText('Persistent Track')
    await user.click(
      screen.getByRole('button', { name: 'Play Persistent Track' }),
    )
    const bar = await screen.findByRole('region', { name: 'Now playing' })

    await user.click(within(bar).getByRole('button', { name: 'Close player' }))

    await waitFor(() =>
      expect(
        screen.queryByRole('region', { name: 'Now playing' }),
      ).not.toBeInTheDocument(),
    )
    expect(HTMLMediaElement.prototype.pause).toHaveBeenCalled()
  })

  it('renders the footer with the GitHub link on every page', async () => {
    renderLayout()

    await screen.findByText('Persistent Track')
    const github = screen.getByRole('link', {
      name: "View this site's source on GitHub",
    })
    expect(github).toHaveAttribute(
      'href',
      'https://github.com/alyralabs/digitaletude',
    )
    expect(screen.getByText('Made with ❤️ in Yokohama')).toBeInTheDocument()
  })
})
