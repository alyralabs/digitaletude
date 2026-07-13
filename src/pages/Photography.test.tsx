import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import Photography, { loader } from './Photography'
import type { Photo } from '../lib/types'

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '../lib/api'

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
    vi.mocked(apiFetch).mockResolvedValue([photo])

    renderPhotography()

    const img = await screen.findByAltText('Mountain')
    expect(img).toHaveAttribute('src', 'https://example.com/thumb.jpg')
    expect(img).toHaveAttribute('width', '800')
    expect(img).toHaveAttribute('height', '600')

    const link = img.closest('a')
    expect(link).toHaveAttribute('href', 'https://example.com/original.jpg')

    expect(apiFetch).toHaveBeenCalledWith('/api/photos')
  })

  it('renders the empty state when there are no photos', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])

    renderPhotography()

    expect(await screen.findByText('No photos yet.')).toBeInTheDocument()
  })
})
