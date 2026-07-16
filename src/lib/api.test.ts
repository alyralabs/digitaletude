import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchMusic, fetchPhotos, fetchPostBySlug, fetchPosts } from './api'

const SUPABASE = 'https://testref.supabase.co'

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200 })
}

let fetchMock: ReturnType<typeof vi.fn>

beforeEach(() => {
  vi.stubEnv('VITE_SUPABASE_URL', SUPABASE)
  vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'anon-key')
  fetchMock = vi.fn()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.unstubAllEnvs()
  vi.clearAllMocks()
})

describe('fetchPhotos', () => {
  it('queries PostgREST with the anon key and composes storage URLs', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: '1',
          title: 'A Photo',
          description: '',
          width: 100,
          height: 80,
          sortOrder: 0,
          createdAt: '2026-01-01T00:00:00Z',
          exif: { iso: 'ISO 400' },
          storagePath: 'originals/abc.jpg',
          thumbnailPath: 'thumbnails/abc.jpg',
        },
      ]),
    )

    const photos = await fetchPhotos()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toContain(`${SUPABASE}/rest/v1/photos?select=`)
    expect(url).toContain('order=sort_order.asc,created_at.desc')
    const headers = new Headers(init.headers)
    expect(headers.get('apikey')).toBe('anon-key')
    expect(headers.get('Authorization')).toBe('Bearer anon-key')

    expect(photos).toHaveLength(1)
    expect(photos[0].originalUrl).toBe(
      `${SUPABASE}/storage/v1/object/public/photography/originals/abc.jpg`,
    )
    expect(photos[0].thumbnailUrl).toBe(
      `${SUPABASE}/storage/v1/object/public/photography/thumbnails/abc.jpg`,
    )
    expect(photos[0].exif).toEqual({ iso: 'ISO 400' })
  })

  it('throws on a non-OK response', async () => {
    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }))
    await expect(fetchPhotos()).rejects.toThrow('content request failed: 500')
  })
})

describe('fetchMusic', () => {
  it('returns albums with embedded tracks plus singles, composing URLs', async () => {
    const trackRow = {
      id: 't1',
      title: 'A Track',
      description: '',
      durationSeconds: 90,
      albumId: 'a1',
      trackNumber: 1,
      sortOrder: 0,
      createdAt: '2026-01-01T00:00:00Z',
      metadata: null,
      storagePath: 'tracks/t1.mp3',
      coverImagePath: null,
    }
    fetchMock.mockImplementation((url: string) => {
      if (url.includes('/rest/v1/albums')) {
        return Promise.resolve(
          jsonResponse([
            {
              id: 'a1',
              title: 'An Album',
              description: '',
              sortOrder: 0,
              createdAt: '2026-01-01T00:00:00Z',
              metadata: null,
              coverImagePath: 'covers/a1.jpg',
              tracks: [trackRow],
            },
          ]),
        )
      }
      return Promise.resolve(
        jsonResponse([
          { ...trackRow, id: 't2', albumId: null, trackNumber: null },
        ]),
      )
    })

    const music = await fetchMusic()

    const singlesUrl = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .find((u) => u.includes('/rest/v1/tracks'))
    expect(singlesUrl).toContain('album_id=is.null')

    expect(music.albums).toHaveLength(1)
    expect(music.albums[0].coverUrl).toBe(
      `${SUPABASE}/storage/v1/object/public/music/covers/a1.jpg`,
    )
    expect(music.albums[0].metadata).toEqual({})
    expect(music.albums[0].tracks[0].audioUrl).toBe(
      `${SUPABASE}/storage/v1/object/public/music/tracks/t1.mp3`,
    )
    expect(music.albums[0].tracks[0].coverUrl).toBeNull()
    expect(music.singles).toHaveLength(1)
    expect(music.singles[0].id).toBe('t2')
  })
})

describe('fetchPosts', () => {
  it('filters to published and never requests the post body', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          title: 'Has Excerpt',
          slug: 'has-excerpt',
          excerpt: 'hand-written',
          coverImagePath: 'covers/p1.jpg',
          publishedAt: '2026-01-01T00:00:00Z',
        },
      ]),
    )

    const posts = await fetchPosts()

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('status=eq.published')
    expect(url).toContain('order=published_at.desc')
    // Excerpts are stored at publish time (Repo.Publish in the API repo);
    // the list must not pull content_markdown just to derive one.
    expect(url).not.toContain('content_markdown')

    expect(posts[0].excerpt).toBe('hand-written')
    expect(posts[0].coverUrl).toBe(
      `${SUPABASE}/storage/v1/object/public/blog/covers/p1.jpg`,
    )
  })
})

describe('fetchPostBySlug', () => {
  it('returns the mapped post when found', async () => {
    fetchMock.mockResolvedValue(
      jsonResponse([
        {
          id: '1',
          slug: 'a-post',
          title: 'A Post',
          excerpt: '',
          contentMarkdown: 'Body.',
          status: 'published',
          createdAt: '2026-01-01T00:00:00Z',
          updatedAt: '2026-01-01T00:00:00Z',
          publishedAt: '2026-01-01T00:00:00Z',
          coverImagePath: null,
        },
      ]),
    )

    const post = await fetchPostBySlug('a-post')

    const [url] = fetchMock.mock.calls[0]
    expect(url).toContain('slug=eq.a-post')
    expect(url).toContain('status=eq.published')
    expect(post?.title).toBe('A Post')
    expect(post?.coverUrl).toBeNull()
  })

  it('returns null when no row matches (draft or unknown slug)', async () => {
    fetchMock.mockResolvedValue(jsonResponse([]))
    expect(await fetchPostBySlug('unknown')).toBeNull()
  })
})
