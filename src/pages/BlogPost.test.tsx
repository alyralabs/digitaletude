import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import BlogPost, { loader } from './BlogPost'
import RouteError from '../components/RouteError'
import type { Post } from '../lib/types'

vi.mock('../lib/api', () => ({
  fetchPostBySlug: vi.fn(),
}))

import { fetchPostBySlug } from '../lib/api'

function renderBlogPost(slug: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/blog/:slug',
        Component: BlogPost,
        loader,
        errorElement: <RouteError />,
      },
    ],
    { initialEntries: [`/blog/${slug}`] },
  )
  return render(
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>,
  )
}

const post: Post = {
  id: '1',
  slug: 'a-great-post',
  title: 'A Great Post',
  excerpt: '',
  contentMarkdown: '# Heading\n\nBody text.',
  status: 'published',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  publishedAt: '2026-01-01T00:00:00Z',
  coverUrl: null,
}

describe('BlogPost', () => {
  it('fetches the post by slug and renders the title and body', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(post)

    renderBlogPost('a-great-post')

    expect(await screen.findByText('A Great Post')).toBeInTheDocument()
    expect(screen.getByText('Body text.')).toBeInTheDocument()
    expect(fetchPostBySlug).toHaveBeenCalledWith('a-great-post')
  })

  it('translates a missing post into a thrown Response so the not-found error boundary renders', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(null)

    renderBlogPost('unknown-slug')

    expect(await screen.findByText('Not found')).toBeInTheDocument()
  })

  it('lets a fetch error propagate to the generic error boundary', async () => {
    vi.mocked(fetchPostBySlug).mockRejectedValue(
      new Error('content request failed: 500'),
    )

    renderBlogPost('a-great-post')

    expect(await screen.findByText('Something went wrong')).toBeInTheDocument()
  })
})
