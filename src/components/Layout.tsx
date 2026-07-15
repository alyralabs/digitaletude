import { lazy, Suspense } from 'react'
import { Outlet } from 'react-router'
import Footer from './Footer'
import NavBar from './NavBar'
import { PlayerProvider } from '../context/PlayerContext'
import { usePlayer } from '../context/player'

// Lazy so the Slider primitive it pulls in only loads once a track actually
// starts playing, keeping it out of the every-page shell chunk.
const NowPlayingBar = lazy(() => import('./NowPlayingBar'))

function LayoutBody() {
  const { currentTrack } = usePlayer()

  return (
    // flex-col + flex-1 on <main> is the classic sticky-footer layout: the
    // footer sits right after the content and never floats up mid-page on
    // short pages, but also never overlays anything — it's always exactly
    // at the bottom of the viewport (or further down, if content is taller
    // than the viewport). Bottom padding (to keep the fixed player bar from
    // covering the footer) goes on this same flex column, below Footer.
    <div className={`flex min-h-svh flex-col${currentTrack ? ' pb-20' : ''}`}>
      <NavBar />
      <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-10 xl:max-w-7xl xl:px-8 2xl:max-w-[1800px] 2xl:px-12">
        <Outlet />
      </main>
      <Footer />
      {currentTrack && (
        <Suspense fallback={null}>
          <NowPlayingBar />
        </Suspense>
      )}
    </div>
  )
}

export default function Layout() {
  return (
    <PlayerProvider>
      <LayoutBody />
    </PlayerProvider>
  )
}
