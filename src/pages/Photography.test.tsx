import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import Photography, { loader } from './Photography'
import type { Photo } from '../lib/types'

vi.mock('../lib/api', () => ({
  fetchPhotos: vi.fn(),
}))

import { fetchPhotos } from '../lib/api'

function renderPhotography() {
  const router = createMemoryRouter([
    { path: '/', Component: Photography, loader },
  ])
  return render(<RouterProvider router={router} />)
}

const photo: Photo = {
  id: '1',
  title: 'Mountain',
  description: '',
  width: 800,
  height: 600,
  sortOrder: 0,
  createdAt: '2026-01-01T00:00:00Z',
  originalUrl: 'https://example.com/original.jpg',
  thumbnailUrl: 'https://example.com/thumb.jpg',
}

describe('Photography', () => {
  it('fetches /api/photos and renders each thumbnail with width/height and a link to the original', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([photo])

    renderPhotography()

    const img = await screen.findByAltText('Mountain')
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    expect(img).toHaveAttribute('width', '800')
    expect(img).toHaveAttribute('height', '600')

    const link = img.closest('a')
    expect(link).toHaveAttribute('href', 'https://example.com/original.jpg')

    expect(fetchPhotos).toHaveBeenCalled()
  })

  it('renders the empty state when there are no photos', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([])

    renderPhotography()

    expect(await screen.findByText('No photos yet.')).toBeInTheDocument()
  })

  it('shows no exif overlay for a photo with no exif data', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([photo])

    renderPhotography()

    await screen.findByAltText('Mountain')
    expect(screen.queryByText(/f\//)).not.toBeInTheDocument()
    expect(screen.queryByText(/ISO/)).not.toBeInTheDocument()
  })

  it('renders an exif overlay with every extracted field', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([
      {
        ...photo,
        exif: {
          camera: 'Canon EOS R5',
          aperture: 'f/2.8',
          shutterSpeed: '1/250s',
          iso: 'ISO 400',
          focalLength: '50mm',
        },
      } satisfies Photo,
    ])

    renderPhotography()

    await screen.findByAltText('Mountain')
    expect(screen.getByText('Canon EOS R5')).toBeInTheDocument()
    expect(screen.getByText('f/2.8')).toBeInTheDocument()
    expect(screen.getByText('1/250s')).toBeInTheDocument()
    expect(screen.getByText('ISO 400')).toBeInTheDocument()
    expect(screen.getByText('50mm')).toBeInTheDocument()
  })

  it('omits missing fields instead of rendering them blank', async () => {
    vi.mocked(fetchPhotos).mockResolvedValue([
      { ...photo, exif: { aperture: 'f/4' } } satisfies Photo,
    ])

    renderPhotography()

    await screen.findByAltText('Mountain')
    expect(screen.getByText('f/4')).toBeInTheDocument()
    expect(screen.queryByText(/ISO/)).not.toBeInTheDocument()
  })
})
