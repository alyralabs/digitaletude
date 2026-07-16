import { useSyncExternalStore } from 'react'
import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { Times } from '@primeicons/react/times'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '../context/player'

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

// Lives in the footer's left slot (see Footer.tsx), which grows to fill
// whatever space the footer's other columns don't need — the slider
// stretches to fill that (flex-1) on one row from `lg:` up. Below `lg:`
// there isn't room for everything on one line, so controls and the
// scrubber split across two rows instead of squeezing down further.
export default function NowPlayingBar() {
  const {
    currentTrack: track,
    isPlaying,
    toggle,
    stop,
    seekChange,
    seekCommit,
    subscribeTime,
    getTime,
    getDuration,
  } = usePlayer()
  // Time ticks arrive through the subscription store, so only this bar
  // re-renders 4x/second during playback — not every usePlayer consumer.
  const currentTime = useSyncExternalStore(subscribeTime, getTime)
  const duration = useSyncExternalStore(subscribeTime, getDuration)

  if (!track) return null
  const total = duration ?? track.durationSeconds ?? 0

  return (
    <div
      role="region"
      aria-label="Now playing"
      className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 lg:flex-nowrap"
    >
      {/* No order class: default 0 keeps the cover leftmost on both the
          one-row (lg+) and wrapped two-row layouts. */}
      {track.coverUrl && (
        <img
          src={track.coverUrl}
          alt={`${track.title} cover art`}
          decoding="async"
          className="size-9 shrink-0 rounded border border-surface object-cover lg:size-10"
        />
      )}
      <Button
        rounded
        iconOnly
        size="small"
        className="order-1 size-6 shrink-0 [&_svg]:size-2.5! lg:size-7 lg:[&_svg]:size-3!"
        aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        onClick={() => toggle(track)}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>
      <p className="order-2 max-w-28 min-w-0 flex-1 shrink truncate text-xs font-medium text-color lg:flex-none">
        {track.title || 'Untitled'}
      </p>
      <div className="order-4 flex min-w-0 basis-full items-center gap-2 lg:order-3 lg:basis-auto lg:flex-1">
        <span className="shrink-0 text-xs tabular-nums text-muted-color">
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
          className="min-w-0 flex-1 [&_[data-slot=slider-handle]]:size-3
            [&_[data-slot=slider-handle]]:before:size-2
            lg:[&_[data-slot=slider-handle]]:size-5
            lg:[&_[data-slot=slider-handle]]:before:size-4"
        />
        <span className="shrink-0 text-xs tabular-nums text-muted-color">
          {formatTime(total)}
        </span>
      </div>
      <Button
        rounded
        iconOnly
        size="small"
        variant="text"
        severity="secondary"
        className="order-3 size-6 shrink-0 [&_svg]:size-2.5! lg:order-4 lg:size-7 lg:[&_svg]:size-3!"
        aria-label="Close player"
        onClick={stop}
      >
        <Times />
      </Button>
    </div>
  )
}
