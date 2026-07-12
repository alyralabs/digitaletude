import { NavLink } from 'react-router'
import { useTheme } from '../context/ThemeContext'

const navItems = [
  { to: '/', label: 'Home', end: true },
  { to: '/about', label: 'About' },
  { to: '/photography', label: 'Photography' },
  { to: '/music', label: 'Music' },
  { to: '/blog', label: 'Blog' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-sm font-medium transition-colors',
    isActive
      ? 'text-accent'
      : 'text-muted hover:text-fg',
  ].join(' ')

export default function NavBar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-nav backdrop-blur-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-4">
        <NavLink
          to="/"
          className="text-lg font-semibold tracking-tight text-fg hover:text-accent"
        >
          digitaletude
        </NavLink>

        <ul className="flex flex-wrap items-center gap-5">
          {navItems.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={linkClass}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm text-fg transition-colors hover:border-accent hover:text-accent"
        >
          {theme === 'light' ? 'Dark' : 'Light'}
        </button>
      </nav>
    </header>
  )
}
