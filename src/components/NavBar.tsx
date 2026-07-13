import { NavLink } from 'react-router'
import { Moon } from '@primeicons/react/moon'
import { Sun } from '@primeicons/react/sun'
import { Button } from '@/components/ui/button'
import { useTheme } from '../context/theme'

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
    isActive ? 'text-primary' : 'text-muted-color hover:text-color',
  ].join(' ')

export default function NavBar() {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-surface bg-surface-0/85 backdrop-blur-sm dark:bg-surface-950/85">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3">
        <NavLink
          to="/"
          className="text-lg font-semibold tracking-tight text-color hover:text-primary"
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

        <Button
          variant="text"
          severity="secondary"
          rounded
          iconOnly
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
          onClick={toggleTheme}
        >
          {theme === 'light' ? <Moon /> : <Sun />}
        </Button>
      </nav>
    </header>
  )
}
