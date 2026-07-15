import { useRef, useState } from 'react'
import { useLoaderData } from 'react-router'
import { Pause } from '@primeicons/react/pause'
import { Play } from '@primeicons/react/play'
import { Button } from '@/components/ui/button'
import PageSection from '../components/PageSection'
import NowPlayingBar from '../components/NowPlayingBar'
import { fetchMusic } from '../lib/api'
import { formatDuration } from '../lib/duration'
import type { MusicMetadata, MusicPayload, Track } from '../lib/types'

export async function loader() {
  return fetchMusic()
}

export default function Music() {
  const { albums, singles } = useLoaderData<MusicPayload>()
  const audioRef = useRef<HTMLAudioElement>(null)
  const [currentTrackId, setCurrentTrackId] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState<number | null>(null)
  const [scrubbing, setScrubbing] = useState(false)

  const trackList = [...albums.flatMap((album) => album.tracks), ...singles]
  const currentTrack = trackList.find((t) => t.id === currentTrackId) ?? null

  function toggle(track: Track) {
    const audio = audioRef.current
    if (!audio) return
    if (currentTrackId === track.id && isPlaying) {
      audio.pause()
      setIsPlaying(false)
      return
    }
    // Only reassign `src` when it's actually a different track — this is
    // the fix for the reload-on-resume bug: reassigning unconditionally
    // triggers the media-element loading algorithm from scratch even when
    // resuming the exact same track that was just paused.
    if (audio.src !== track.audioUrl) {
      audio.src = track.audioUrl
      setCurrentTime(0)
      setDuration(null)
    }
    void audio.play()
    setCurrentTrackId(track.id)
    setIsPlaying(true)
  }

  function handleSeekChange(value: number) {
    setScrubbing(true)
    setCurrentTime(value)
  }

  function handleSeekCommit(value: number) {
    const audio = audioRef.current
    if (audio) audio.currentTime = value
    setCurrentTime(value)
    setScrubbing(false)
  }

  const isEmpty = albums.length === 0 && singles.length === 0

  return (
    <div className={`space-y-10${currentTrack ? ' pb-20' : ''}`}>
      <h1 className="text-4xl font-bold tracking-tight text-color">Music</h1>

      {/* One shared player: swapping `src` here avoids multiple audio
          elements playing simultaneously, since there's no browser-level
          exclusivity between separate <audio> tags. */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onTimeUpdate={() => {
          // A drag in progress owns `currentTime` until release — otherwise
          // the ~4x/second timeupdate tick yanks the slider thumb back to
          // the playback position mid-drag.
          if (scrubbing) return
          setCurrentTime(audioRef.current?.currentTime ?? 0)
        }}
        onLoadedMetadata={() => {
          setDuration(audioRef.current?.duration ?? null)
        }}
        className="hidden"
      />

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
                        playing={currentTrackId === track.id && isPlaying}
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
                    playing={currentTrackId === track.id && isPlaying}
                    onToggle={() => toggle(track)}
                  />
                ))}
              </div>
            </PageSection>
          )}
        </>
      )}

      {currentTrack && (
        <NowPlayingBar
          track={currentTrack}
          isPlaying={isPlaying}
          currentTime={currentTime}
          duration={duration}
          onToggle={() => toggle(currentTrack)}
          onSeekChange={handleSeekChange}
          onSeekCommit={handleSeekCommit}
        />
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
