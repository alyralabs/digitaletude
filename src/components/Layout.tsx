import { Outlet } from 'react-router'
import Footer from './Footer'
import NavBar from './NavBar'
import { PlayerProvider } from '../context/PlayerContext'

export default function Layout() {
  return (
    <PlayerProvider>
      {/* flex-col + flex-1 on <main> keeps the footer at the viewport bottom
          on short pages; on pages taller than the viewport the footer's own
          sticky bottom-0 (see Footer.tsx) pins it visible while content
          scrolls beneath. */}
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
