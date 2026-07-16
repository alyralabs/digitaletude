import { Suspense, use } from 'react'
import { useLoaderData } from 'react-router'
import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { Button } from '@/components/ui/button'
import PageSection from '../components/PageSection'
import { usePlayer } from '../context/player'
import { formatDuration } from '../lib/duration'
import type { MusicMetadata, MusicPayload, Track } from '../lib/types'

export default function Music() {
  const { music } = useLoaderData<{ music: Promise<MusicPayload> }>()

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight text-color">Music</h1>

      <Suspense fallback={<MusicSkeleton />}>
        <Catalog musicPromise={music} />
      </Suspense>
    </div>
  )
}

function TrackRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="size-14 shrink-0 rounded-md border border-surface bg-panel" />
      <div className="size-8 shrink-0 rounded-full bg-panel" />
      <div className="min-w-0 flex-1 space-y-2">
        <div className="h-3 w-40 max-w-full rounded bg-panel" />
        <div className="h-2.5 w-24 max-w-full rounded bg-panel" />
      </div>
      <div className="h-2.5 w-8 shrink-0 rounded bg-panel" />
    </div>
  )
}

// Mirrors the loaded layout: one album block (cover + description + rows),
// then a singles list, so content replaces the skeleton without reflow.
function MusicSkeleton() {
  return (
    <div aria-hidden className="animate-pulse space-y-10">
      <section className="space-y-4">
        <div className="h-6 w-48 rounded bg-panel" />
        <div className="flex flex-col gap-6 sm:flex-row">
          <div className="size-40 shrink-0 rounded-lg border border-surface bg-panel" />
          <div className="flex-1 space-y-3">
            <div className="h-3 w-3/4 max-w-96 rounded bg-panel" />
            <div className="space-y-1">
              <TrackRowSkeleton />
              <TrackRowSkeleton />
              <TrackRowSkeleton />
            </div>
          </div>
        </div>
      </section>
      <section className="space-y-4">
        <div className="h-6 w-32 rounded bg-panel" />
        <div className="space-y-1">
          <TrackRowSkeleton />
          <TrackRowSkeleton />
        </div>
      </section>
    </div>
  )
}

function Catalog({ musicPromise }: { musicPromise: Promise<MusicPayload> }) {
  const { albums, singles } = use(musicPromise)
  const { currentTrack, isPlaying, toggle } = usePlayer()

  // Everything on the page in display order — what prev/next and
  // auto-advance walk through, regardless of which row started playback.
  const queue = [...albums.flatMap((album) => album.tracks), ...singles]

  const isEmpty = albums.length === 0 && singles.length === 0

  if (isEmpty) {
    return <p className="text-muted-color">No music yet.</p>
  }

  return (
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
                    onToggle={() => toggle(track, queue)}
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
                onToggle={() => toggle(track, queue)}
              />
            ))}
          </div>
        </PageSection>
      )}
    </>
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
