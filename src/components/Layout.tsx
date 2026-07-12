import { Outlet } from 'react-router'
import NavBar from './NavBar'

export default function Layout() {
  return (
    <div className="min-h-svh">
      <NavBar />
      <main className="mx-auto max-w-5xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
