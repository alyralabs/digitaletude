import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import PostEditor, { loader } from './PostEditor'
import type { Post } from '../../lib/types'

vi.mock('../../lib/api', () => ({
  adminFetch: vi.fn(),
}))

import { adminFetch } from '../../lib/api'

let navigateSpy: ReturnType<typeof vi.fn>

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

function post(overrides: Partial<Post> = {}): Post {
  return {
    id: 'p1',
    slug: 'a-post',
    title: 'A Post',
    excerpt: '',
    contentMarkdown: 'body',
    status: 'draft',
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
    publishedAt: null,
    coverUrl: null,
    ...overrides,
  }
}

function renderEditor(path: string) {
  // Mirrors App.tsx: 'posts/new' is a separate static route from 'posts/:id'
  // (params.id is undefined there, which is how the loader/component tell
  // create mode from edit mode) — a single ':id' route would wrongly treat
  // "new" as an id.
  const router = createMemoryRouter(
    [
      { path: '/admin/posts/new', Component: PostEditor, loader },
      { path: '/admin/posts/:id', Component: PostEditor, loader },
    ],
    { initialEntries: [path] },
  )
  return render(
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
  navigateSpy = vi.fn()
})

describe('PostEditor create mode', () => {
  it('renders as "New post" and has no slug field', async () => {
    renderEditor('/admin/posts/new')

    expect(await screen.findByText('New post')).toBeInTheDocument()
    expect(screen.queryByLabelText('Slug')).not.toBeInTheDocument()
  })

  it('submits a multipart POST to /api/admin/posts and navigates to the new post', async () => {
    vi.mocked(adminFetch).mockResolvedValue(post({ id: 'new-id' }))
    const user = userEvent.setup()
    renderEditor('/admin/posts/new')

    await screen.findByText('New post')
    await user.type(screen.getByLabelText('Title'), 'My New Post')
    await user.type(screen.getByLabelText(/Content/i), '# hello')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalled())
    const [path, init] = vi.mocked(adminFetch).mock.calls[0]
    expect(path).toBe('/api/admin/posts')
    expect(init?.method).toBe('POST')
    const body = init?.body as FormData
    expect(body.get('title')).toBe('My New Post')
    expect(body.get('contentMarkdown')).toBe('# hello')

    expect(navigateSpy).toHaveBeenCalledWith('/admin/posts/new-id')
  })

  it('shows an error message instead of crashing on failure', async () => {
    vi.mocked(adminFetch).mockRejectedValue(new Error('save failed: bad title'))
    const user = userEvent.setup()
    renderEditor('/admin/posts/new')

    await screen.findByText('New post')
    await user.type(screen.getByLabelText('Title'), 'My New Post')
    await user.click(screen.getByRole('button', { name: 'Save' }))

    expect(
      await screen.findByText('save failed: bad title'),
    ).toBeInTheDocument()
  })
})

describe('PostEditor edit mode — draft', () => {
  it('loads the post via adminFetch, shows the slug field, and has Publish/Delete', async () => {
    vi.mocked(adminFetch).mockResolvedValue(post({ status: 'draft' }))
    renderEditor('/admin/posts/p1')

    expect(await screen.findByDisplayValue('A Post')).toBeInTheDocument()
    expect(adminFetch).toHaveBeenCalledWith('/api/admin/posts/p1')
    expect(screen.getByLabelText('Slug')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publish' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument()
  })

  it('saves a full-post PUT including the slug', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce(post({ status: 'draft' }))
    const user = userEvent.setup()
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    vi.mocked(adminFetch)
      .mockResolvedValueOnce(undefined) // the PUT response
      .mockResolvedValueOnce(post({ status: 'draft' })) // revalidate() reloads the loader
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalledTimes(3))
    const [path, init] = vi.mocked(adminFetch).mock.calls[1]
    expect(path).toBe('/api/admin/posts/p1')
    expect(init?.method).toBe('PUT')
    const body = JSON.parse(init?.body as string)
    expect(body.slug).toBe('a-post')
  })

  it('calls PATCH .../publish when Publish is clicked', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce(post({ status: 'draft' }))
    const user = userEvent.setup()
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    vi.mocked(adminFetch)
      .mockResolvedValueOnce(undefined) // the publish response
      .mockResolvedValueOnce(post({ status: 'published' })) // revalidate() reloads the loader
    await user.click(screen.getByRole('button', { name: 'Publish' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalledTimes(3))
    const [path, init] = vi.mocked(adminFetch).mock.calls[1]
    expect(path).toBe('/api/admin/posts/p1/publish')
    expect(init?.method).toBe('PATCH')
  })

  it('deletes and navigates back to the list when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminFetch).mockResolvedValueOnce(post({ status: 'draft' }))
    const user = userEvent.setup()
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    vi.mocked(adminFetch).mockResolvedValueOnce(undefined)
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalledTimes(2))
    const [path, init] = vi.mocked(adminFetch).mock.calls[1]
    expect(path).toBe('/api/admin/posts/p1')
    expect(init?.method).toBe('DELETE')
    expect(navigateSpy).toHaveBeenCalledWith('/admin/posts')
  })

  it('does nothing on delete if the confirm dialog is declined', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    vi.mocked(adminFetch).mockResolvedValueOnce(post({ status: 'draft' }))
    const user = userEvent.setup()
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(adminFetch).toHaveBeenCalledTimes(1) // only the initial load
  })
})

describe('PostEditor edit mode — published', () => {
  it('hides the slug field and shows Unpublish instead of Publish', async () => {
    vi.mocked(adminFetch).mockResolvedValue(
      post({ status: 'published', publishedAt: '2026-01-01T00:00:00Z' }),
    )
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    expect(screen.queryByLabelText('Slug')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Unpublish' }),
    ).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Publish' }),
    ).not.toBeInTheDocument()
  })

  it('a PUT save omits the slug field entirely (frozen once published)', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce(post({ status: 'published' }))
    const user = userEvent.setup()
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    vi.mocked(adminFetch)
      .mockResolvedValueOnce(undefined) // the PUT response
      .mockResolvedValueOnce(post({ status: 'published' })) // revalidate() reloads the loader
    await user.click(screen.getByRole('button', { name: 'Save' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalledTimes(3))
    const [, init] = vi.mocked(adminFetch).mock.calls[1]
    const body = JSON.parse(init?.body as string)
    expect(body.slug).toBeUndefined()
  })

  it('calls PATCH .../unpublish when Unpublish is clicked', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce(post({ status: 'published' }))
    const user = userEvent.setup()
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    vi.mocked(adminFetch)
      .mockResolvedValueOnce(undefined) // the unpublish response
      .mockResolvedValueOnce(post({ status: 'draft' })) // revalidate() reloads the loader
    await user.click(screen.getByRole('button', { name: 'Unpublish' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalledTimes(3))
    const [path, init] = vi.mocked(adminFetch).mock.calls[1]
    expect(path).toBe('/api/admin/posts/p1/unpublish')
    expect(init?.method).toBe('PATCH')
  })
})

describe('PostEditor cover upload (edit mode)', () => {
  it('offers "Add cover" for a post with none, and PATCHes .../cover with the file', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce(post({ coverUrl: null }))
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    expect(
      screen.getByRole('button', { name: 'Add cover' }),
    ).toBeInTheDocument()

    vi.mocked(adminFetch).mockResolvedValueOnce(post({ coverUrl: null }))
    const file = new File(['bytes'], 'cover.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Cover image'), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Add cover' }).closest('form')!,
    )

    await waitFor(() => expect(adminFetch).toHaveBeenCalledTimes(2))
    const [path, init] = vi.mocked(adminFetch).mock.calls[1]
    expect(path).toBe('/api/admin/posts/p1/cover')
    expect(init?.method).toBe('PATCH')
    expect((init?.body as FormData).get('cover')).toBeInstanceOf(File)
  })

  it('shows the existing thumbnail and offers "Change cover" for a post that has one', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce(
      post({ coverUrl: 'https://example.com/cover.jpg' }),
    )
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    expect(screen.getByAltText('A Post')).toHaveAttribute(
      'src',
      'https://example.com/cover.jpg',
    )
    expect(
      screen.getByRole('button', { name: 'Change cover' }),
    ).toBeInTheDocument()
  })

  it('shows an error message instead of crashing on failure', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce(post({ coverUrl: null }))
    renderEditor('/admin/posts/p1')

    await screen.findByDisplayValue('A Post')
    vi.mocked(adminFetch).mockRejectedValueOnce(
      new Error('cover update failed: too big'),
    )
    const file = new File(['bytes'], 'cover.jpg', { type: 'image/jpeg' })
    fireEvent.change(screen.getByLabelText('Cover image'), {
      target: { files: [file] },
    })
    fireEvent.submit(
      screen.getByRole('button', { name: 'Add cover' }).closest('form')!,
    )

    expect(
      await screen.findByText('cover update failed: too big'),
    ).toBeInTheDocument()
  })
})
