import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import AdminLayout from './AdminLayout'

const mockSignOut = vi.fn()

vi.mock('../../lib/supabase', () => ({
  supabaseClient: () => ({
    auth: {
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: mockSignOut,
    },
  }),
}))

// Rendered directly (not through the router's loader mechanism, which needs
// a real Supabase session this environment doesn't have) — this exercises
// AdminLayout's own sidebar/outlet rendering in isolation.
function renderLayout(initialPath = '/admin/photos') {
  const router = createMemoryRouter(
    [
      {
        path: '/admin',
        Component: AdminLayout,
        children: [
          { path: 'photos', Component: () => <div>Photos content</div> },
          { path: 'music', Component: () => <div>Music content</div> },
        ],
      },
    ],
    { initialEntries: [initialPath] },
  )
  return render(
    <PrimeReactProvider>
      <RouterProvider router={router} />
    </PrimeReactProvider>,
  )
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('AdminLayout sidebar', () => {
  it('renders all sections as a vertical nav and the routed content beside it', () => {
    renderLayout()

    const nav = screen.getByRole('navigation')
    expect(
      within(nav).getByRole('link', { name: 'Photos' }),
    ).toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: 'Music' })).toBeInTheDocument()
    expect(
      within(nav).getByRole('link', { name: 'Blog posts' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Photos content')).toBeInTheDocument()
  })

  it('highlights the active section', () => {
    renderLayout('/admin/music')

    expect(screen.getByRole('link', { name: 'Music' })).toHaveClass(
      'text-primary',
    )
    expect(screen.getByRole('link', { name: 'Photos' })).not.toHaveClass(
      'text-primary',
    )
  })

  it('signs out when "Sign out" is clicked', async () => {
    const user = userEvent.setup()
    renderLayout()

    await user.click(screen.getByRole('button', { name: 'Sign out' }))

    expect(mockSignOut).toHaveBeenCalled()
  })
})
