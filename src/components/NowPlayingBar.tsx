import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { Times } from '@primeicons/react/times'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '../context/player'
import { formatDuration } from '../lib/duration'

export default function NowPlayingBar() {
  const {
    currentTrack: track,
    isPlaying,
    currentTime,
    duration,
    toggle,
    stop,
    seekChange,
    seekCommit,
  } = usePlayer()

  if (!track) return null
  const total = duration ?? track.durationSeconds ?? 0

  return (
    <div
      role="region"
      aria-label="Now playing"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-surface bg-page/95 backdrop-blur-sm"
    >
      <div className="mx-auto flex max-w-5xl items-center gap-4 px-6 py-3 xl:max-w-7xl xl:px-8 2xl:max-w-[1800px] 2xl:px-12">
        <Button
          rounded
          iconOnly
          size="small"
          aria-label={
            isPlaying ? `Pause ${track.title}` : `Play ${track.title}`
          }
          onClick={() => toggle(track)}
        >
          {isPlaying ? <Pause /> : <Play />}
        </Button>
        <p className="w-32 shrink-0 truncate text-sm font-medium text-color sm:w-56">
          {track.title || 'Untitled'}
        </p>
        <span className="w-10 shrink-0 text-right text-xs text-muted-color">
          {formatDuration(Math.floor(currentTime)) ?? '0:00'}
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
          className="flex-1"
        />
        <span className="w-10 shrink-0 text-xs text-muted-color">
          {formatDuration(total ? Math.floor(total) : null) ?? '0:00'}
        </span>
        <Button
          rounded
          iconOnly
          size="small"
          variant="text"
          severity="secondary"
          aria-label="Close player"
          onClick={stop}
        >
          <Times />
        </Button>
      </div>
    </div>
  )
}
