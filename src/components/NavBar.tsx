import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { Bars } from '@primeicons/react/bars'
import { Moon } from '@primeicons/react/moon'
import { Sun } from '@primeicons/react/sun'
import { Times } from '@primeicons/react/times'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerBackdrop,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerPopup,
  DrawerPortal,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { ToggleSwitch } from '@/components/ui/toggleswitch'
import Logo from './Logo'
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

// Whether there's a live admin session, so the public site can offer a
// quick way back into /admin instead of typing the URL.
//
// supabase-js is ~400KB and this hook runs on every public page, so it's
// deliberately kept out of the static import graph: a cheap localStorage
// probe (supabase persists sessions under sb-*-auth-token) decides whether
// to dynamically import it at all. Anonymous visitors — the vast majority —
// never download the supabase chunk. The catch also preserves the existing
// invariant that missing Supabase env vars only break admin routes, never
// the public site.
function useAdminSignedIn() {
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    const hasStoredSession = Object.keys(localStorage).some(
      (key) => key.startsWith('sb-') && key.endsWith('-auth-token'),
    )
    if (!hasStoredSession) return

    let cancelled = false
    let unsubscribe = () => {}
    import('../lib/supabase')
      .then(({ supabaseClient }) => {
        const client = supabaseClient()
        client.auth.getSession().then(({ data }) => {
          if (!cancelled) setSignedIn(!!data.session)
        })
        const { data } = client.auth.onAuthStateChange((_event, session) => {
          setSignedIn(!!session)
        })
        unsubscribe = () => data.subscription.unsubscribe()
      })
      .catch(() => {})
    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  return signedIn
}

function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  return (
    <label className="flex items-center gap-2">
      <Sun className="size-4 text-muted-color" aria-hidden="true" />
      <ToggleSwitch
        checked={theme === 'dark'}
        onCheckedChange={() => toggleTheme()}
        aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
      />
      <Moon className="size-4 text-muted-color" aria-hidden="true" />
    </label>
  )
}

function AdminLink({ onClick }: { onClick?: () => void }) {
  const navigate = useNavigate()
  return (
    <Button
      size="small"
      variant="outlined"
      onClick={() => {
        onClick?.()
        navigate('/admin')
      }}
    >
      Admin
    </Button>
  )
}

export default function NavBar() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const adminSignedIn = useAdminSignedIn()

  return (
    <header className="sticky top-0 z-50 border-b border-surface bg-page/85 backdrop-blur-sm">
      <nav className="mx-auto flex max-w-5xl items-center justify-between gap-6 px-6 py-3 xl:max-w-7xl xl:px-8 2xl:max-w-[1800px] 2xl:px-12">
        <NavLink to="/" aria-label="digitaletude, home" end>
          <Logo />
        </NavLink>

        <ul className="hidden items-center gap-5 md:flex">
          {navItems.map(({ to, label, end }) => (
            <li key={to}>
              <NavLink to={to} end={end} className={linkClass}>
                {label}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-4 md:flex">
          {adminSignedIn && <AdminLink />}
          <ThemeToggle />
        </div>

        <Drawer
          position="right"
          open={drawerOpen}
          onOpenChange={(e) => setDrawerOpen(e.value ?? false)}
        >
          <DrawerTrigger
            aria-label="Open menu"
            className="inline-flex size-9 items-center justify-center rounded-full text-muted-color transition-colors hover:bg-panel hover:text-color focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-primary md:hidden"
          >
            <Bars className="size-4" />
          </DrawerTrigger>
          <DrawerPortal>
            <DrawerBackdrop />
            <DrawerPopup className="w-64">
              <DrawerHeader>
                <DrawerTitle>Menu</DrawerTitle>
                <DrawerClose aria-label="Close menu">
                  <Times />
                </DrawerClose>
              </DrawerHeader>
              <DrawerContent>
                <ul className="space-y-4">
                  {navItems.map(({ to, label, end }) => (
                    <li key={to}>
                      <NavLink
                        to={to}
                        end={end}
                        className={linkClass}
                        onClick={() => setDrawerOpen(false)}
                      >
                        {label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
                {adminSignedIn && (
                  <div className="mt-4">
                    <AdminLink onClick={() => setDrawerOpen(false)} />
                  </div>
                )}
                <div className="mt-6 border-t border-surface pt-6">
                  <ThemeToggle />
                </div>
              </DrawerContent>
            </DrawerPopup>
          </DrawerPortal>
        </Drawer>
      </nav>
    </header>
  )
}
