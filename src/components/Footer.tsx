import { lazy, Suspense } from 'react'
import GithubIcon from './icons/GithubIcon'
import { usePlayer } from '../context/player'

// Lazy so the Slider primitive it pulls in only loads once a track actually
// starts playing, keeping it out of the every-page footer/shell chunk.
const NowPlayingBar = lazy(() => import('./NowPlayingBar'))

export default function Footer() {
  const { currentTrack } = usePlayer()

  return (
    /* sticky bottom-0 pins the footer (and the player bar in it) to the
       viewport on long pages while keeping it in normal flow — short pages
       still get it exactly at the bottom via Layout's min-h-svh column, with
       no reserved-padding hacks. Opaque bg because content scrolls beneath. */
    <footer className="sticky bottom-0 z-40 border-t border-surface bg-page">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-4 px-6 py-3 xl:max-w-7xl xl:px-8 2xl:max-w-[1800px] 2xl:px-12">
        <div className="min-w-0">
          {currentTrack && (
            <Suspense fallback={null}>
              <NowPlayingBar />
            </Suspense>
          )}
        </div>
        <p className="justify-self-center text-xs whitespace-nowrap text-muted-color">
          Made with ❤️ in Yokohama
        </p>
        <a
          href="https://github.com/alyralabs/digitaletude"
          target="_blank"
          rel="noreferrer"
          aria-label="View this site's source on GitHub"
          className="justify-self-end text-muted-color transition-colors hover:text-color focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          <GithubIcon className="size-5" />
        </a>
      </div>
    </footer>
  )
}
