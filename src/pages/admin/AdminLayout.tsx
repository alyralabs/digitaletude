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
  { to: '/admin/posts', label: 'Posts' },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'text-sm font-medium transition-colors',
    isActive ? 'text-primary' : 'text-muted-color hover:text-color',
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
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex items-center justify-between border-b border-surface pb-4">
        <div className="flex items-center gap-5">
          <h1 className="text-lg font-semibold text-color">Admin</h1>
          {sections.map(({ to, label }) => (
            <NavLink key={to} to={to} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </div>
        <Button
          variant="text"
          severity="secondary"
          size="small"
          onClick={() => supabaseClient().auth.signOut()}
        >
          Sign out
        </Button>
      </div>
      <Outlet />
    </div>
  )
}
