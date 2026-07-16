import { useLoaderData } from 'react-router'
import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { Button } from '@/components/ui/button'
import PageSection from '../components/PageSection'
import { usePlayer } from '../context/player'
import { formatDuration } from '../lib/duration'
import type { MusicMetadata, MusicPayload, Track } from '../lib/types'

export default function Music() {
  const { albums, singles } = useLoaderData<MusicPayload>()
  const { currentTrack, isPlaying, toggle } = usePlayer()

  const isEmpty = albums.length === 0 && singles.length === 0

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight text-color">Music</h1>

      {isEmpty ? (
        <p className="text-muted-color">No music yet.</p>
      ) : (
        <>
          {albums.map((album) => (
            <PageSection key={album.id} title={album.title}>
              <div className="flex flex-col gap-6 sm:flex-row">
                {album.coverUrl && (
                  <img
                    src={album.coverUrl}
                    alt={album.title}
                    className="size-40 shrink-0 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 space-y-3">
                  {album.description && (
                    <p className="leading-relaxed text-muted-color">
                      {album.description}
                    </p>
                  )}
                  <div className="space-y-1">
                    {album.tracks.map((track) => (
                      <TrackRow
                        key={track.id}
                        track={track}
                        playing={currentTrack?.id === track.id && isPlaying}
                        onToggle={() => toggle(track)}
                      />
                    ))}
                  </div>
                  <MetadataLinks metadata={album.metadata} />
                </div>
              </div>
            </PageSection>
          ))}

          {singles.length > 0 && (
            <PageSection title="Singles">
              <div className="space-y-1">
                {singles.map((track) => (
                  <TrackRow
                    key={track.id}
                    track={track}
                    playing={currentTrack?.id === track.id && isPlaying}
                    onToggle={() => toggle(track)}
                  />
                ))}
              </div>
            </PageSection>
          )}
        </>
      )}
    </div>
  )
}

function TrackRow({
  track,
  playing,
  onToggle,
}: {
  track: Track
  playing: boolean
  onToggle: () => void
}) {
  const duration = formatDuration(track.durationSeconds)
  return (
    <div className="flex items-center gap-3 py-1.5">
      {/* Empty placeholder square when there's no cover art, so titles in a
          mixed list stay aligned instead of shifting left per row. */}
      {track.coverUrl ? (
        <img
          src={track.coverUrl}
          alt={`${track.title} cover art`}
          loading="lazy"
          decoding="async"
          className="size-14 shrink-0 rounded-md border border-surface object-cover"
        />
      ) : (
        <div className="size-14 shrink-0 rounded-md border border-surface bg-panel" />
      )}
      <Button
        rounded
        iconOnly
        size="small"
        aria-label={playing ? `Pause ${track.title}` : `Play ${track.title}`}
        onClick={onToggle}
      >
        {playing ? <Pause /> : <Play />}
      </Button>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-color">
          {track.trackNumber ? `${track.trackNumber}. ` : ''}
          {track.title || 'Untitled'}
        </p>
        {track.description && (
          <p className="truncate text-xs text-muted-color">
            {track.description}
          </p>
        )}
      </div>
      {duration && (
        <span className="shrink-0 text-xs text-muted-color">{duration}</span>
      )}
      <MetadataLinks metadata={track.metadata} />
    </div>
  )
}

function MetadataLinks({ metadata }: { metadata: MusicMetadata }) {
  const links = metadata?.links
  if (!links || Object.keys(links).length === 0) return null
  return (
    <div className="flex shrink-0 flex-wrap gap-3">
      {Object.entries(links).map(([name, url]) => (
        <a
          key={name}
          href={url}
          target="_blank"
          rel="noreferrer"
          className="text-xs font-medium text-primary hover:underline"
        >
          {name}
        </a>
      ))}
    </div>
  )
}
