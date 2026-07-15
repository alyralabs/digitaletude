import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { Times } from '@primeicons/react/times'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import { usePlayer } from '../context/player'

// Lives in the footer's left slot (see Footer.tsx), not as its own fixed
// bar — kept intentionally compact (no elapsed/total labels, slider hidden
// below `sm:`) since it now shares a single footer row instead of owning
// the full width of the screen.
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
      className="flex min-w-0 items-center gap-2"
    >
      <Button
        rounded
        iconOnly
        size="small"
        aria-label={isPlaying ? `Pause ${track.title}` : `Play ${track.title}`}
        onClick={() => toggle(track)}
      >
        {isPlaying ? <Pause /> : <Play />}
      </Button>
      <p className="max-w-16 shrink truncate text-xs font-medium text-color sm:max-w-28">
        {track.title || 'Untitled'}
      </p>
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
        className="hidden w-16 shrink-0 sm:block md:w-24"
      />
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
  )
}
