import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import Blog, { loader } from './Blog'
import type { PostSummary } from '../lib/types'

vi.mock('../lib/api', () => ({
  apiFetch: vi.fn(),
}))

import { apiFetch } from '../lib/api'

function renderBlog() {
  const router = createMemoryRouter([{ path: '/', Component: Blog, loader }])
  return render(
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>,
  )
}

const post: PostSummary = {
  title: 'A Great Post',
  slug: 'a-great-post',
  excerpt: 'An excerpt of the post.',
  coverUrl: 'https://example.com/cover.jpg',
  publishedAt: '2026-01-01T00:00:00Z',
}

describe('Blog', () => {
  it('fetches /api/posts and links each card to /blog/:slug', async () => {
    vi.mocked(apiFetch).mockResolvedValue([post])

    renderBlog()

    const title = await screen.findByText('A Great Post')
    expect(screen.getByText('An excerpt of the post.')).toBeInTheDocument()
    const link = title.closest('a')
    expect(link).toHaveAttribute('href', '/blog/a-great-post')

    expect(apiFetch).toHaveBeenCalledWith('/api/posts')
  })

  it('renders the empty state when there are no posts', async () => {
    vi.mocked(apiFetch).mockResolvedValue([])

    renderBlog()

    expect(await screen.findByText('No posts yet.')).toBeInTheDocument()
  })
})
