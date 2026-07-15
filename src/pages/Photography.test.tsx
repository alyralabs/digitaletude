import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import Photography, { loader } from './Photography'
import type { Photo } from '../lib/types'

vi.mock('../lib/api', () => ({
  fetchPhotos: vi.fn(),
}))

vi.mock('@primeicons/react/chevron-left', () => ({
  ChevronLeft: () => <span>chevron-left-icon</span>,
}))
vi.mock('@primeicons/react/chevron-right', () => ({
  ChevronRight: () => <span>chevron-right-icon</span>,
}))
vi.mock('@primeicons/react/times', () => ({
  Times: () => <span>times-icon</span>,
}))

import { fetchPhotos } from '../lib/api'

function renderPhotography() {
  const router = createMemoryRouter([
    { path: '/', Component: Photography, loader },
  ])
  return render(
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>,
  )
}

function makePhoto(overrides: Partial<Photo> = {}): Photo {
  return {
    id: '1',
    title: 'Mountain',
    description: '',
    width: 800,
    height: 600,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00Z',
    originalUrl: 'https://example.com/original.jpg',
    thumbnailUrl: 'https://example.com/thumb.jpg',
    ...overrides,
  }
}

const photo = makePhoto()

describe('Photography grid', () => {
  it('fetches photos and renders each thumbnail as a clickable button with width/height', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([photo])

    renderPhotography()

    const img = await screen.findByAltText('Mountain')
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    expect(img).toHaveAttribute('width', '800')
    expect(img).toHaveAttribute('height', '600')
    expect(img.closest('button')).toBeInTheDocument()
    expect(img.closest('a')).not.toBeInTheDocument()

    expect(fetchPhotos).toHaveBeenCalled()
  })

  it('renders the empty state when there are no photos', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([])

    renderPhotography()

    expect(await screen.findByText('No photos yet.')).toBeInTheDocument()
  })
})

describe('Photography carousel', () => {
  const photos = [
    makePhoto({
      id: '1',
      title: 'First',
      thumbnailUrl: 'https://example.com/thumb-1.jpg',
      originalUrl: 'https://example.com/original-1.jpg',
      exif: { iso: 'ISO 100' },
    }),
    makePhoto({
      id: '2',
      title: 'Second',
      thumbnailUrl: 'https://example.com/thumb-2.jpg',
      originalUrl: 'https://example.com/original-2.jpg',
    }),
    makePhoto({
      id: '3',
      title: 'Third',
      thumbnailUrl: 'https://example.com/thumb-3.jpg',
      originalUrl: 'https://example.com/original-3.jpg',
    }),
  ]

  it('opens on the clicked photo, shows its EXIF data, and a View Original link', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue(photos)
    const user = userEvent.setup()
    renderPhotography()

    const firstThumb = await screen.findByAltText('First')
    await user.click(firstThumb)

    const dialog = await screen.findByRole('dialog')
    expect(dialog).toBeInTheDocument()
    expect(within(dialog).getByText('ISO 100')).toBeInTheDocument()
    const viewOriginal = screen.getByRole('link', { name: 'View Original' })
    expect(viewOriginal).toHaveAttribute(
      'href',
      'https://example.com/original-1.jpg',
    )
  })

  it('renders every extracted EXIF field for the open photo', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([
      makePhoto({
        title: 'First',
        thumbnailUrl: 'https://example.com/thumb-1.jpg',
        originalUrl: 'https://example.com/original-1.jpg',
        exif: {
          camera: 'Canon EOS R5',
          aperture: 'f/2.8',
          shutterSpeed: '1/250s',
          iso: 'ISO 400',
          focalLength: '50mm',
        },
      }),
    ])
    const user = userEvent.setup()
    renderPhotography()

    await user.click(await screen.findByAltText('First'))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByText('Canon EOS R5')).toBeInTheDocument()
    expect(within(dialog).getByText('f/2.8')).toBeInTheDocument()
    expect(within(dialog).getByText('1/250s')).toBeInTheDocument()
    expect(within(dialog).getByText('ISO 400')).toBeInTheDocument()
    expect(within(dialog).getByText('50mm')).toBeInTheDocument()
  })

  it('omits missing EXIF fields instead of rendering them blank', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([
      makePhoto({
        title: 'First',
        thumbnailUrl: 'https://example.com/thumb-1.jpg',
        originalUrl: 'https://example.com/original-1.jpg',
        exif: { aperture: 'f/4' },
      }),
    ])
    const user = userEvent.setup()
    renderPhotography()

    await user.click(await screen.findByAltText('First'))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).getByText('f/4')).toBeInTheDocument()
    expect(within(dialog).queryByText(/ISO/)).not.toBeInTheDocument()
  })

  it('shows no EXIF bar for a photo with no exif data', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([
      makePhoto({
        title: 'First',
        thumbnailUrl: 'https://example.com/thumb-1.jpg',
        originalUrl: 'https://example.com/original-1.jpg',
      }),
    ])
    const user = userEvent.setup()
    renderPhotography()

    await user.click(await screen.findByAltText('First'))
    const dialog = await screen.findByRole('dialog')

    expect(within(dialog).queryByText(/f\//)).not.toBeInTheDocument()
    expect(within(dialog).queryByText(/ISO/)).not.toBeInTheDocument()
  })

  it('steps forward and wraps past the last photo back to the first', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue(photos)
    const user = userEvent.setup()
    renderPhotography()

    await user.click(await screen.findByAltText('First'))
    await screen.findByRole('dialog')

    const next = screen.getByRole('button', { name: 'Next photo' })
    await user.click(next)
    expect(screen.getByRole('link', { name: 'View Original' })).toHaveAttribute(
      'href',
      'https://example.com/original-2.jpg',
    )

    await user.click(next)
    expect(screen.getByRole('link', { name: 'View Original' })).toHaveAttribute(
      'href',
      'https://example.com/original-3.jpg',
    )

    // wraps past the last photo back to the first
    await user.click(next)
    expect(screen.getByRole('link', { name: 'View Original' })).toHaveAttribute(
      'href',
      'https://example.com/original-1.jpg',
    )
  })

  it('steps backward and wraps past the first photo back to the last', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue(photos)
    const user = userEvent.setup()
    renderPhotography()

    await user.click(await screen.findByAltText('First'))
    await screen.findByRole('dialog')

    const prev = screen.getByRole('button', { name: 'Previous photo' })
    await user.click(prev)
    expect(screen.getByRole('link', { name: 'View Original' })).toHaveAttribute(
      'href',
      'https://example.com/original-3.jpg',
    )
  })

  it('navigates with the arrow keys', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue(photos)
    const user = userEvent.setup()
    renderPhotography()

    await user.click(await screen.findByAltText('First'))
    await screen.findByRole('dialog')

    await user.keyboard('{ArrowRight}')
    expect(screen.getByRole('link', { name: 'View Original' })).toHaveAttribute(
      'href',
      'https://example.com/original-2.jpg',
    )

    await user.keyboard('{ArrowLeft}')
    expect(screen.getByRole('link', { name: 'View Original' })).toHaveAttribute(
      'href',
      'https://example.com/original-1.jpg',
    )
  })

  it('closes via the close button', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue(photos)
    const user = userEvent.setup()
    renderPhotography()

    await user.click(await screen.findByAltText('First'))
    await screen.findByRole('dialog')

    await user.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('closes via Escape', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue(photos)
    const user = userEvent.setup()
    renderPhotography()

    await user.click(await screen.findByAltText('First'))
    await screen.findByRole('dialog')

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
