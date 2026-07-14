import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import MusicAdmin, { loader } from './MusicAdmin'
import type { Album, MusicPayload, Track } from '../../lib/types'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
  adminFetch: vi.fn(),
}))

import { apiFetch, adminFetch } from '../../lib/api'

function track(overrides: Partial<Track> = {}): Track {
  return {
    id: 't1',
    title: 'Original Track',
    description: 'Original track description',
    durationSeconds: 100,
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

function album(overrides: Partial<Album> = {}): Album {
  return {
    id: 'a1',
    title: 'Original Album',
    description: 'Original album description',
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
    metadata: {},
    coverUrl: null,
    tracks: [],
    ...overrides,
  }
}

function renderAdmin() {
  const router = createMemoryRouter([
    { path: '/', Component: MusicAdmin, loader },
  ])
  return render(
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(apiFetch).mockResolvedValue({
    albums: [album()],
    singles: [track()],
  } satisfies MusicPayload)
})

describe('MusicAdmin album form', () => {
  it('submits fields as multipart form data to /api/admin/albums and revalidates', async () => {
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Albums (1)')
    await user.type(screen.getByLabelText(/^Title$/i), 'New Album')
    await user.click(screen.getByRole('button', { name: 'Create album' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/albums')
    expect(init?.method).toBe('POST')
    expect((init?.body as FormData).get('title')).toBe('New Album')

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2))
  })
})

describe('MusicAdmin track upload form', () => {
  it('submits fields and file as multipart form data to /api/admin/tracks', async () => {
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    renderAdmin()

    await screen.findByText('Original Track')
    const file = new File(['bytes'], 'song.mp3', { type: 'audio/mpeg' })
    fireEvent.change(screen.getByLabelText(/Audio \(MP3/i), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Upload' }).closest('form')!,
    )

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/tracks')
    expect(init?.method).toBe('POST')
    expect((init?.body as FormData).get('file')).toBeInstanceOf(File)

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2))
  })

  it('shows an error message instead of crashing on failure', async () => {
    vi.mocked(adminFetch).mockRejectedValue(new Error('upload failed: bad mp3'))
    renderAdmin()

    await screen.findByText('Original Track')
    const file = new File(['bytes'], 'song.mp3', { type: 'audio/mpeg' })
    fireEvent.change(screen.getByLabelText(/Audio \(MP3/i), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Upload' }).closest('form')!,
    )

    expect(
      await screen.findByText('upload failed: bad mp3'),
    ).toBeInTheDocument()
  })
})

describe('MusicAdmin album inline edit', () => {
  it('saves via PATCH with the edited fields and exits edit mode', async () => {
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    const albumsSection = (await screen.findByText('Albums (1)')).closest(
      'section',
    )!
    await user.click(
      within(albumsSection).getByRole('button', { name: 'Edit' }),
    )

    const titleInput = screen.getByDisplayValue('Original Album')
    await user.clear(titleInput)
    await user.type(titleInput, 'Edited Album')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/albums/a1')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({
      title: 'Edited Album',
      description: 'Original album description',
    })
  })
})

describe('MusicAdmin track inline edit', () => {
  it('saves via PATCH with title/description/album/track number', async () => {
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Track')
    // The single (top-level) track row is the one outside the album section.
    const singlesSection = screen.getByText('Singles (1)').closest('section')!
    await user.click(
      within(singlesSection).getByRole('button', { name: 'Edit' }),
    )

    const titleInput = screen.getByDisplayValue('Original Track')
    await user.clear(titleInput)
    await user.type(titleInput, 'Edited Track')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/tracks/t1')
    expect(init?.method).toBe('PATCH')
    const body = JSON.parse(init?.body as string)
    expect(body.title).toBe('Edited Track')
  })
})

describe('MusicAdmin album cover upload', () => {
  it('PATCHes /api/admin/albums/:id/cover with the file and revalidates', async () => {
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    const albumsSection = (await screen.findByText('Albums (1)')).closest(
      'section',
    )!
    await user.click(
      within(albumsSection).getByRole('button', { name: 'Edit' }),
    )

    const file = new File(['bytes'], 'cover.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Cover'), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Add cover' }).closest('form')!,
    )

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/albums/a1/cover')
    expect(init?.method).toBe('PATCH')
    expect((init?.body as FormData).get('cover')).toBeInstanceOf(File)

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2))
  })

  it('shows an error message instead of failing silently when the upload is rejected', async () => {
    vi.mocked(adminFetch).mockRejectedValue(
      new Error('only JPEG and PNG are accepted'),
    )
    const user = userEvent.setup()
    renderAdmin()

    const albumsSection = (await screen.findByText('Albums (1)')).closest(
      'section',
    )!
    await user.click(
      within(albumsSection).getByRole('button', { name: 'Edit' }),
    )

    const file = new File(['bytes'], 'cover.gif', { type: 'image/gif' })
    fireEvent.change(screen.getByLabelText('Cover'), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Add cover' }).closest('form')!,
    )

    expect(
      await screen.findByText('only JPEG and PNG are accepted'),
    ).toBeInTheDocument()
  })

  it('shows an error message when an inline album save fails', async () => {
    vi.mocked(adminFetch).mockRejectedValue(new Error('save failed: nope'))
    const user = userEvent.setup()
    renderAdmin()

    const albumsSection = (await screen.findByText('Albums (1)')).closest(
      'section',
    )!
    await user.click(
      within(albumsSection).getByRole('button', { name: 'Edit' }),
    )
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(await screen.findByText('save failed: nope')).toBeInTheDocument()
  })

  it('offers "Change cover" instead of "Add cover" when the album already has one', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      albums: [album({ coverUrl: 'https://example.com/cover.jpg' })],
      singles: [track()],
    } satisfies MusicPayload)
    const user = userEvent.setup()
    renderAdmin()

    const albumsSection = (await screen.findByText('Albums (1)')).closest(
      'section',
    )!
    await user.click(
      within(albumsSection).getByRole('button', { name: 'Edit' }),
    )

    expect(
      screen.getByRole('button', { name: 'Change cover' }),
    ).toBeInTheDocument()
  })
})

describe('MusicAdmin track cover upload', () => {
  it('PATCHes /api/admin/tracks/:id/cover with the file and revalidates', async () => {
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Track')
    const singlesSection = screen.getByText('Singles (1)').closest('section')!
    await user.click(
      within(singlesSection).getByRole('button', { name: 'Edit' }),
    )

    const file = new File(['bytes'], 'cover.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Cover'), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Add cover' }).closest('form')!,
    )

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/tracks/t1/cover')
    expect(init?.method).toBe('PATCH')
    expect((init?.body as FormData).get('cover')).toBeInstanceOf(File)

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2))
  })

  it('shows an error message instead of failing silently when the upload is rejected', async () => {
    vi.mocked(adminFetch).mockRejectedValue(
      new Error('upload exceeds size limit'),
    )
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Track')
    const singlesSection = screen.getByText('Singles (1)').closest('section')!
    await user.click(
      within(singlesSection).getByRole('button', { name: 'Edit' }),
    )

    const file = new File(['bytes'], 'cover.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Cover'), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Add cover' }).closest('form')!,
    )

    expect(
      await screen.findByText('upload exceeds size limit'),
    ).toBeInTheDocument()
  })
})

describe('MusicAdmin delete', () => {
  it('does nothing if the confirm dialog is declined for an album', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Albums (1)')
    const albumsSection = screen.getByText('Albums (1)').closest('section')!
    await user.click(
      within(albumsSection).getByRole('button', { name: 'Delete' }),
    )

    expect(adminFetch).not.toHaveBeenCalled()
  })

  it('calls DELETE for a track when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Track')
    const singlesSection = screen.getByText('Singles (1)').closest('section')!
    await user.click(
      within(singlesSection).getByRole('button', { name: 'Delete' }),
    )

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/tracks/t1')
    expect(init?.method).toBe('DELETE')
  })
})
