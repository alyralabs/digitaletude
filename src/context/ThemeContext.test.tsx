import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ThemeProvider } from './ThemeContext'
import { useTheme } from './theme'

function mockMatchMedia(prefersDark: boolean) {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query === '(prefers-color-scheme: dark)' && prefersDark,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  )
}

function Probe() {
  const { theme, toggleTheme } = useTheme()
  return (
    <div>
      <span>current: {theme}</span>
      <button onClick={toggleTheme}>toggle</button>
    </div>
  )
}

function renderWithProvider() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.classList.remove('dark')
  mockMatchMedia(false)
})

describe('ThemeProvider initial theme', () => {
  it('defaults to light when nothing is stored and the system prefers light', () => {
    renderWithProvider()
    expect(screen.getByText('current: light')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
  })

  it('defaults to dark when nothing is stored and the system prefers dark', () => {
    mockMatchMedia(true)
    renderWithProvider()
    expect(screen.getByText('current: dark')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
  })

  it('a stored preference wins over the system preference', () => {
    localStorage.setItem('theme', 'dark')
    mockMatchMedia(false) // system says light, storage says dark
    renderWithProvider()
    expect(screen.getByText('current: dark')).toBeInTheDocument()
  })
})

describe('toggleTheme', () => {
  it('flips the theme, toggles the .dark class, and persists to localStorage', async () => {
    const user = userEvent.setup()
    renderWithProvider()

    expect(screen.getByText('current: light')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'toggle' }))

    expect(screen.getByText('current: dark')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(true)
    expect(localStorage.getItem('theme')).toBe('dark')

    await user.click(screen.getByRole('button', { name: 'toggle' }))

    expect(screen.getByText('current: light')).toBeInTheDocument()
    expect(document.documentElement.classList.contains('dark')).toBe(false)
    expect(localStorage.getItem('theme')).toBe('light')
  })
})

describe('useTheme', () => {
  it('throws when used outside a ThemeProvider', () => {
    // Swallow the expected React error-boundary console noise for this one case.
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(() => render(<Probe />)).toThrow(
      'useTheme must be used within a ThemeProvider',
    )
    consoleError.mockRestore()
  })
})
