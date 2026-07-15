import { Outlet } from 'react-router'
import Footer from './Footer'
import NavBar from './NavBar'
import { PlayerProvider } from '../context/PlayerContext'

export default function Layout() {
  return (
    <PlayerProvider>
      {/* flex-col + flex-1 on <main> is the classic sticky-footer layout:
          the footer sits right after the content and never floats up
          mid-page on short pages, but also never overlays anything — it's
          always exactly at the bottom of the viewport (or further down, if
          content is taller than the viewport). */}
      <div className="flex min-h-svh flex-col">
        <NavBar />
        <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 xl:max-w-7xl xl:px-8 2xl:max-w-[1800px] 2xl:px-12">
          <Outlet />
        </main>
        <Footer />
      </div>
    </PlayerProvider>
  )
}
