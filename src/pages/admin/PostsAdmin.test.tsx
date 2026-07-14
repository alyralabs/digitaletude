import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import PostsAdmin, { loader } from './PostsAdmin'
import type { Post } from '../../lib/types'

vi.mock('../../lib/api', () => ({
  adminFetch: vi.fn(),
}))

import { adminFetch } from '../../lib/api'

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

let navigateSpy: ReturnType<typeof vi.fn>

vi.mock('react-router', async () => {
  const actual =
    await vi.importActual<typeof import('react-router')>('react-router')
  return {
    ...actual,
    useNavigate: () => navigateSpy,
  }
})

function renderAdmin() {
  const router = createMemoryRouter([
    { path: '/', Component: PostsAdmin, loader },
  ])
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

describe('PostsAdmin', () => {
  it('fetches /api/admin/posts and lists title, status, and updated date', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce([post({ title: 'My Draft' })])

    renderAdmin()

    expect(await screen.findByText('My Draft')).toBeInTheDocument()
    expect(screen.getByText('draft')).toBeInTheDocument()
    expect(adminFetch).toHaveBeenCalledWith('/api/admin/posts')
  })

  it('renders the empty state when there are no posts', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce([])

    renderAdmin()

    expect(await screen.findByText('No posts yet.')).toBeInTheDocument()
  })

  it('navigates to /admin/posts/new when "New post" is clicked', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce([])
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('No posts yet.')
    await user.click(screen.getByRole('button', { name: 'New post' }))

    expect(navigateSpy).toHaveBeenCalledWith('/admin/posts/new')
  })

  it('navigates to /admin/posts/:id when a row is clicked', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce([
      post({ id: 'p1', title: 'Click Me' }),
    ])
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Click Me')
    await user.click(screen.getByText('Click Me'))

    expect(navigateSpy).toHaveBeenCalledWith('/admin/posts/p1')
  })

  it('does nothing if the confirm dialog is declined', async () => {
    vi.mocked(adminFetch).mockResolvedValueOnce([post({ title: 'Keep Me' })])
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Keep Me')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    expect(adminFetch).toHaveBeenCalledTimes(1) // only the initial list fetch
  })

  it('calls DELETE and revalidates when confirmed', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    vi.mocked(adminFetch)
      .mockResolvedValueOnce([post({ id: 'p1', title: 'Remove Me' })])
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([])
    const user = userEvent.setup()
    renderAdmin()

    await screen.findByText('Remove Me')
    await user.click(screen.getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(adminFetch).toHaveBeenCalledTimes(3))
    const [path, init] = vi.mocked(adminFetch).mock.calls[1]
    expect(path).toBe('/api/admin/posts/p1')
    expect(init?.method).toBe('DELETE')
  })
})
