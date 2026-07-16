import { afterEach, describe, expect, it, vi } from 'vitest'
import { blogLoader, blogPostLoader, resetLoaderCache } from './loaders'
import type { Post, PostSummary } from './types'

vi.mock('./api', () => ({
  fetchPhotos: vi.fn(),
  fetchMusic: vi.fn(),
  fetchPosts: vi.fn(),
  fetchPostBySlug: vi.fn(),
}))

import { fetchPostBySlug, fetchPosts } from './api'
import type { LoaderFunctionArgs } from 'react-router'

// Only `params` matters to blogPostLoader; the rest of LoaderFunctionArgs
// (request/context/url/pattern) is router plumbing this unit test skips.
function loaderArgs(slug: string) {
  return { params: { slug } } as unknown as LoaderFunctionArgs
}

const summary: PostSummary = {
  title: 'A Post',
  slug: 'a-post',
  excerpt: 'Excerpt.',
  coverUrl: null,
  publishedAt: '2026-01-01T00:00:00Z',
}

const post: Post = {
  id: '1',
  slug: 'a-post',
  title: 'A Post',
  excerpt: 'Excerpt.',
  contentMarkdown: '# Hello',
  status: 'published',
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-01T00:00:00Z',
  publishedAt: '2026-01-01T00:00:00Z',
  coverUrl: null,
}

afterEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  resetLoaderCache()
})

describe('loader cache', () => {
  it('serves a repeat navigation from cache within the TTL', async () => {
    vi.mocked(fetchPosts).mockResolvedValue([summary])

    expect(await blogLoader()).toEqual([summary])
    expect(await blogLoader()).toEqual([summary])
    expect(fetchPosts).toHaveBeenCalledTimes(1)
  })

  it('refetches once the TTL has expired', async () => {
    vi.useFakeTimers()
    vi.mocked(fetchPosts).mockResolvedValue([summary])

    await blogLoader()
    vi.setSystemTime(Date.now() + 5 * 60_000 + 1)
    await blogLoader()

    expect(fetchPosts).toHaveBeenCalledTimes(2)
  })

  it('does not cache failures', async () => {
    vi.mocked(fetchPosts)
      .mockRejectedValueOnce(new Error('content request failed: 500'))
      .mockResolvedValueOnce([summary])

    await expect(blogLoader()).rejects.toThrow('content request failed')
    expect(await blogLoader()).toEqual([summary])
    expect(fetchPosts).toHaveBeenCalledTimes(2)
  })

  it('caches posts per slug and does not cache a 404', async () => {
    vi.mocked(fetchPostBySlug).mockResolvedValue(post)

    const args = loaderArgs('a-post')
    expect(await blogPostLoader(args)).toEqual(post)
    expect(await blogPostLoader(args)).toEqual(post)
    expect(fetchPostBySlug).toHaveBeenCalledTimes(1)

    vi.mocked(fetchPostBySlug).mockResolvedValue(null)
    const missing = loaderArgs('missing')
    await expect(blogPostLoader(missing)).rejects.toBeInstanceOf(Response)
    await expect(blogPostLoader(missing)).rejects.toBeInstanceOf(Response)
    expect(fetchPostBySlug).toHaveBeenCalledTimes(3)
  })
})
