import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { StepBackwardAlt } from '@primeicons/react/step-backward-alt'
import { StepForwardAlt } from '@primeicons/react/step-forward-alt'
import { Times } from '@primeicons/react/times'
import { VolumeOff } from '@primeicons/react/volume-off'
import { VolumeUp } from '@primeicons/react/volume-up'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '../context/player'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Thumbless sliders: the handle is invisible — you just click or drag
// anywhere on the track. Focus brings it back so the focus ring isn't
// lost, but shrunken: Chrome applies :focus-visible to the handle's inner
// range input even on mouse click, so the revealed dot must stay tiny.
// Targeted via [data-part=handle] — PrimeReact overwrites data-slot on the
// rendered handle (it becomes "root"), so the ui/slider.tsx data-slot
// never reaches the DOM. The h-3 override collapses the slider row's
// default 20px hit height.
const THUMBLESS =
  'data-[orientation=horizontal]:h-3 [&_[data-part=handle]]:size-2.5 [&_[data-part=handle]]:before:size-1.5 [&_[data-part=handle]]:opacity-0 [&_[data-part=handle]:has(:focus-visible)]:opacity-100'

// One pill, Apple-Music-style: transport cluster, square cover, stacked
// title/artist with the scrubber beneath, volume, close. Sits in the
// footer's left slot from 1200px up; below that it detaches and floats
// centered above the footer.
export default function NowPlayingBar() {
  const {
    currentTrack: track,
    isPlaying,
    toggle,
    prev,
    next,
    stop,
    seekChange,
    seekCommit,
    volume,
    setVolume,
    subscribeTime,
    getTime,
    getDuration,
  } = usePlayer()
  // Time ticks arrive through the subscription store, so only this bar
  // re-renders 4x/second during playback — not every usePlayer consumer.
  const currentTime = useSyncExternalStore(subscribeTime, getTime)
  const duration = useSyncExternalStore(subscribeTime, getDuration)
  const lastVolume = useRef(1)
  const [volumeOpen, setVolumeOpen] = useState(false)

  // The popup is display-hidden past 1200px, but the open state would
  // survive a resize and pop it back up on return to mobile — close it
  // for real when the viewport crosses into the docked layout.
  useEffect(() => {
    const desktop = matchMedia('(min-width: 1200px)')
    const close = (e: MediaQueryListEvent) => {
      if (e.matches) setVolumeOpen(false)
    }
    desktop.addEventListener('change', close)
    return () => desktop.removeEventListener('change', close)
  }, [])

  if (!track) return null
  const total = duration ?? track.durationSeconds ?? 0

  return (
    <div
      role="region"
      aria-label="Now playing"
      className="fixed bottom-14 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 items-center gap-2.5 rounded-full border border-surface bg-panel py-1 pr-2.5 pl-1.5 shadow-lg min-[1200px]:static min-[1200px]:w-auto min-[1200px]:translate-x-0 min-[1200px]:shadow-sm"
    >
      <div className="flex shrink-0 items-center -space-x-0.5">
        <Button
          iconOnly
          rounded
          size="small"
          variant="text"
          severity="secondary"
          aria-label="Previous track"
          className="[&_svg]:size-3.5!"
          onClick={prev}
        >
          <StepBackwardAlt />
        </Button>
        <Button
          iconOnly
          rounded
          size="small"
          variant="text"
          aria-label={
            isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
          }
          className="[&_svg]:size-4!"
          onClick={() => toggle(track)}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <Button
          iconOnly
          rounded
          size="small"
          variant="text"
          severity="secondary"
          aria-label="Next track"
          className="[&_svg]:size-3.5!"
          onClick={next}
        >
          <StepForwardAlt />
        </Button>
      </div>
      {track.coverUrl ? (
        <img
          src={track.coverUrl}
          alt={`${track.title} cover art`}
          decoding="async"
          className="size-8 shrink-0 rounded-md border border-surface object-cover"
        />
      ) : (
        <div className="size-8 shrink-0 rounded-md border border-surface bg-page" />
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs leading-tight font-medium text-color">
          {track.title || 'Untitled'}
        </p>
        {/* Every track on the site is mine — hardcoded artist line. */}
        <p className="font-display text-[10px] leading-tight font-semibold tracking-[0.14em] text-muted-color uppercase">
          Alyra
        </p>
        <div className="flex items-center gap-2">
          <span className="shrink-0 text-[10px] leading-none tabular-nums text-muted-color">
            {formatTime(currentTime)}
          </span>
          <Slider
            value={currentTime}
            min={0}
            max={total}
            onValueChange={(e) => {
              if (typeof e.value === 'number') seekChange(e.value)
            }}
            onValueChangeEnd={(e) => {
              if (typeof e.value === 'number') seekCommit(e.value)
            }}
            className={`min-w-0 flex-1 ${THUMBLESS}`}
          />
          <span className="shrink-0 text-[10px] leading-none tabular-nums text-muted-color">
            {formatTime(total)}
          </span>
        </div>
      </div>
      {/* Mobile volume: speaker toggles a small vertical slider popped
          above the pill; the inline horizontal group takes over at 1200px. */}
      <div className="relative shrink-0 min-[1200px]:hidden">
        <Button
          iconOnly
          rounded
          size="small"
          variant="text"
          severity="secondary"
          aria-label="Volume"
          aria-expanded={volumeOpen}
          onClick={() => setVolumeOpen((open) => !open)}
        >
          {volume === 0 ? <VolumeOff /> : <VolumeUp />}
        </Button>
        {volumeOpen && (
          <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 rounded-full border border-surface bg-panel px-1.5 py-3 shadow-lg">
            <Slider
              orientation="vertical"
              value={volume}
              min={0}
              max={1}
              step={0.01}
              onValueChange={(e) => {
                if (typeof e.value === 'number') setVolume(e.value)
              }}
              className={`data-[orientation=vertical]:w-3 ${THUMBLESS}`}
            />
          </div>
        )}
      </div>
      <div className="hidden shrink-0 items-center gap-1 min-[1200px]:flex">
        <Button
          iconOnly
          rounded
          size="small"
          variant="text"
          severity="secondary"
          aria-label={volume === 0 ? 'Unmute' : 'Mute'}
          onClick={() => {
            if (volume === 0) {
              setVolume(lastVolume.current || 1)
            } else {
              lastVolume.current = volume
              setVolume(0)
            }
          }}
        >
          {volume === 0 ? <VolumeOff /> : <VolumeUp />}
        </Button>
        <Slider
          value={volume}
          min={0}
          max={1}
          step={0.01}
          onValueChange={(e) => {
            if (typeof e.value === 'number') setVolume(e.value)
          }}
          className={`w-14 ${THUMBLESS}`}
        />
      </div>
      <Button
        rounded
        iconOnly
        size="small"
        variant="text"
        severity="secondary"
        className="shrink-0 [&_svg]:size-3!"
        aria-label="Close player"
        onClick={stop}
      >
        <Times />
      </Button>
    </div>
  )
}
