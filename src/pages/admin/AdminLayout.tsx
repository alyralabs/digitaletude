import { useEffect } from 'react'
import { NavLink, Outlet, redirect, useNavigate } from 'react-router'
import { Button } from '@/components/ui/button'
import { supabaseClient } from '../../lib/supabase'

// Route loader: no session → login. Runs before the layout renders.
export async function loader() {
  const { data } = await supabaseClient().auth.getSession()
  if (!data.session) throw redirect('/admin/login')
  return null
}

const sections = [
  { to: '/admin/photos', label: 'Photos' },
  { to: '/admin/music', label: 'Music' },
  { to: '/admin/posts', label: 'Blog posts' },
]

const sidebarLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-md px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-panel text-primary'
      : 'text-muted-color hover:bg-panel hover:text-color',
  ].join(' ')

export default function AdminLayout() {
  const navigate = useNavigate()

  // Keep the guard live: sign-out (this tab or another) kicks back to login.
  useEffect(() => {
    const { data } = supabaseClient().auth.onAuthStateChange(
      (_event, session) => {
        if (!session) navigate('/admin/login')
      },
    )
    return () => data.subscription.unsubscribe()
  }, [navigate])

  return (
    // Admin is explicitly out of scope for the wide public layout (see
    // plans/04-styling.md) — re-caps to roughly the old site-wide width so
    // admin doesn't stretch to ~1800px along with the public pages.
    // Vertical sidebar (GitHub settings-style) instead of a horizontal top
    // bar — stacks on small screens, side-by-side with a divider at md+.
    <div className="mx-auto flex max-w-5xl flex-col gap-8 md:flex-row">
      <aside className="shrink-0 space-y-6 md:w-48">
        <h1 className="text-lg font-semibold text-color">Admin</h1>
        <nav className="space-y-1">
          {sections.map(({ to, label }) => (
            <NavLink key={to} to={to} className={sidebarLinkClass}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Button
          variant="text"
          severity="secondary"
          size="small"
          onClick={() => supabaseClient().auth.signOut()}
        >
          Sign out
        </Button>
      </aside>
      <div className="min-w-0 flex-1 border-t border-surface pt-8 md:border-t-0 md:border-l md:pt-0 md:pl-8">
        <Outlet />
      </div>
    </div>
  )
}
