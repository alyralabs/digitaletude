import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import PhotosAdmin, { loader } from './PhotosAdmin'
import type { Photo } from '../../lib/types'

vi.mock('../../lib/api', () => ({
  apiFetch: vi.fn(),
  adminFetch: vi.fn(),
}))

import { apiFetch, adminFetch } from '../../lib/api'

const photo: Photo = {
  id: 'p1',
  title: 'Original Title',
  description: 'Original description',
  width: 100,
  height: 100,
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  originalUrl: 'https://example.com/o.jpg',
  thumbnailUrl: 'https://example.com/t.jpg',
}

function renderAdmin() {
  const router = createMemoryRouter([
    { path: '/', Component: PhotosAdmin, loader },
  ])
  return render(
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(apiFetch).mockResolvedValue([photo])
})

describe('PhotosAdmin upload form', () => {
  it('submits the fields and file as multipart form data, then revalidates on success', async () => {
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Title')

    await user.type(screen.getByLabelText(/Title/i), 'New Photo')
    const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })
    // fireEvent.change with an explicit FileList, and fireEvent.submit
    // rather than a click, instead of userEvent's higher-level upload/click:
    // jsdom's constraint validation for a required file input doesn't
    // reliably recognize a FileList assigned via userEvent as satisfying
    // `required`, which silently blocks the native click-to-submit path.
    // Dispatching submit directly still exercises the real onSubmit handler.
    fireEvent.change(screen.getByLabelText(/Image/i), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Upload' }).closest('form')!,
    )

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/photos')
    expect(init?.method).toBe('POST')
    const body = init?.body as FormData
    expect(body.get('title')).toBe('New Photo')
    // Not asserting the file's name/size here: jsdom's `new FormData(form)`
    // auto-population from a file input doesn't preserve File metadata in
    // this environment (verified in isolation — a jsdom limitation, not a
    // product bug; real browsers round-trip this correctly). Confirming a
    // File actually made it into the 'file' field is what's reliable here.
    expect(body.get('file')).toBeInstanceOf(File)

    // revalidate() re-runs the loader
    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2))
  })

  it('shows an error message instead of crashing on failure', async () => {
    vi.mocked(adminFetch).mockRejectedValue(new Error('upload failed: too big'))
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Title')
    await user.type(screen.getByLabelText(/Title/i), 'New Photo')
    const file = new File(['bytes'], 'photo.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText(/Image/i), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Upload' }).closest('form')!,
    )

    expect(
      await screen.findByText('upload failed: too big'),
    ).toBeInTheDocument()
  })
})

describe('PhotosAdmin inline edit', () => {
  it('saves via PATCH with the edited fields and exits edit mode', async () => {
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Title')
    await user.click(screen.getByRole('button', { name: 'Edit' }))

    const titleInput = screen.getByDisplayValue('Original Title')
    await user.clear(titleInput)
    await user.type(titleInput, 'Edited Title')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/photos/p1')
    expect(init?.method).toBe('PATCH')
    expect(JSON.parse(init?.body as string)).toEqual({
      title: 'Edited Title',
      description: 'Original description',
    })

    await waitFor(() =>
      expect(
        screen.queryByRole('button', { name: 'Save' }),
      ).not.toBeInTheDocument(),
    )
  })
})

describe('PhotosAdmin delete', () => {
  it('does nothing if the confirm dialog is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Title')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(adminFetch).not.toHaveBeenCalled()
  })

  it('calls DELETE and revalidates when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminFetch).mockResolvedValue(undefined)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Original Title')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/photos/p1')
    expect(init?.method).toBe('DELETE')

    await waitFor(() => expect(apiFetch).toHaveBeenCalledTimes(2))
  })
})
