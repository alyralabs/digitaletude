import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { PrimeReactProvider } from '@primereact/core'
import NavBar from './NavBar'
import { ThemeProvider } from '../context/ThemeContext'

vi.mock('@primeicons/react/bars', () => ({
  Bars: () => <span>bars-icon</span>,
}))
vi.mock('@primeicons/react/times', () => ({
  Times: () => <span>times-icon</span>,
}))
vi.mock('@primeicons/react/moon', () => ({
  Moon: () => <span>moon-icon</span>,
}))
vi.mock('@primeicons/react/sun', () => ({ Sun: () => <span>sun-icon</span> }))

const mockGetSession = vi.fn()
const mockOnAuthStateChange = vi.fn()

vi.mock('../lib/supabase', () => ({
  supabaseClient: () => ({
    auth: {
      getSession: mockGetSession,
      onAuthStateChange: mockOnAuthStateChange,
    },
  }),
}))

// jsdom has no matchMedia; ThemeProvider (wrapped below) needs it to pick an
// initial theme. Not testing theme-detection behavior here (ThemeContext.test.tsx
// already does) — just need it to not throw, so the light branch is enough.
function stubMatchMedia() {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

function renderNavBar() {
  const router = createMemoryRouter([
    { path: '/', Component: NavBar },
    { path: '/admin', Component: () => <div>Admin Page</div> },
  ])
  return render(
    <PrimeReactProvider>
      <ThemeProvider>
        <RouterProvider router={router} />
      </ThemeProvider>
    </PrimeReactProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  stubMatchMedia()
  mockGetSession.mockResolvedValue({ data: { session: null } })
  mockOnAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  })
})

describe('NavBar drawer', () => {
  it('is closed by default and opens on hamburger click', async () => {
    const user = userEvent.setup()
    renderNavBar()

    expect(screen.queryByText('Menu')).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))

    expect(await screen.findByText('Menu')).toBeInTheDocument()
  })

  it('closes when a nav link inside it is clicked', async () => {
    const user = userEvent.setup()
    renderNavBar()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await screen.findByText('Menu')

    const dialog = document.querySelector('[data-open]') as HTMLElement
    await user.click(within(dialog).getByRole('link', { name: 'Photography' }))

    await waitFor(() =>
      expect(screen.queryByText('Menu')).not.toBeInTheDocument(),
    )
  })

  it('closes when the close button is clicked', async () => {
    const user = userEvent.setup()
    renderNavBar()

    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await screen.findByText('Menu')

    await user.click(screen.getByRole('button', { name: 'Close menu' }))

    await waitFor(() =>
      expect(screen.queryByText('Menu')).not.toBeInTheDocument(),
    )
  })
})

describe('theme toggle', () => {
  it('toggles the .dark class on <html> when clicked', async () => {
    const user = userEvent.setup()
    renderNavBar()

    expect(document.documentElement.classList.contains('dark')).toBe(false)

    await user.click(screen.getByRole('switch'))

    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })
})

describe('admin quick-link', () => {
  it('is not shown when there is no admin session', async () => {
    renderNavBar()

    await waitFor(() => expect(mockGetSession).toHaveBeenCalled())
    expect(
      screen.queryByRole('button', { name: 'Admin' }),
    ).not.toBeInTheDocument()
  })

  it('appears once a session is found, and navigates to /admin when clicked', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'fake' } },
    })
    const user = userEvent.setup()
    renderNavBar()

    const adminButton = await screen.findByRole('button', { name: 'Admin' })
    await user.click(adminButton)

    expect(await screen.findByText('Admin Page')).toBeInTheDocument()
  })
})
