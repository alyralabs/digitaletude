import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import { Button } from '@/components/ui/button'
import { InputText } from '@/components/ui/inputtext'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminFetch, apiFetch } from '../../lib/api'
import type { Album, MusicPayload, Track } from '../../lib/types'

export async function loader() {
  return apiFetch<MusicPayload>('/api/music')
}

export default function MusicAdmin() {
  const music = useLoaderData<MusicPayload>()
  const { revalidate } = useRevalidator()
  const [error, setError] = useState<string | null>(null)
  const [albumBusy, setAlbumBusy] = useState(false)
  const [trackBusy, setTrackBusy] = useState(false)

  async function onAlbumUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setAlbumBusy(true)
    setError(null)
    try {
      await adminFetch('/api/admin/albums', {
        method: 'POST',
        body: new FormData(form),
      })
      form.reset()
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'album creation failed')
    } finally {
      setAlbumBusy(false)
    }
  }

  async function onTrackUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setTrackBusy(true)
    setError(null)
    try {
      await adminFetch('/api/admin/tracks', {
        method: 'POST',
        body: new FormData(form),
      })
      form.reset()
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed')
    } finally {
      setTrackBusy(false)
    }
  }

  async function onDeleteAlbum(album: Album) {
    if (!confirm(`Delete "${album.title}"? Its tracks move to Singles.`)) return
    setError(null)
    try {
      await adminFetch(`/api/admin/albums/${album.id}`, { method: 'DELETE' })
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed')
    }
  }

  async function onDeleteTrack(track: Track) {
    if (!confirm(`Delete "${track.title}"?`)) return
    setError(null)
    try {
      await adminFetch(`/api/admin/tracks/${track.id}`, { method: 'DELETE' })
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed')
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-color">New album</h2>
        <form onSubmit={onAlbumUpload} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="album-title">Title</Label>
            <InputText
              id="album-title"
              name="title"
              required
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="album-description">Description</Label>
            <Textarea
              id="album-description"
              name="description"
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="album-cover">Cover (optional, JPEG/PNG)</Label>
            <input
              id="album-cover"
              name="cover"
              type="file"
              accept="image/jpeg,image/png"
              className="block w-full text-sm text-muted-color file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-color"
            />
          </div>
          <Button type="submit" disabled={albumBusy}>
            {albumBusy ? 'Creating…' : 'Create album'}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-color">Upload track</h2>
        <form onSubmit={onTrackUpload} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="track-file">Audio (MP3, ≤ 50 MB)</Label>
            <input
              id="track-file"
              name="file"
              type="file"
              accept="audio/mpeg,.mp3"
              required
              className="block w-full text-sm text-muted-color file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-color"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="track-title">
              Title (blank = read from MP3 tags)
            </Label>
            <InputText id="track-title" name="title" className="w-full" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="track-description">Description</Label>
            <Textarea
              id="track-description"
              name="description"
              className="w-full"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="track-cover">Cover (optional, JPEG/PNG)</Label>
            <input
              id="track-cover"
              name="cover"
              type="file"
              accept="image/jpeg,image/png"
              className="block w-full text-sm text-muted-color file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-color"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="track-album">Album (blank = single)</Label>
            <select
              id="track-album"
              name="album_id"
              className="block w-full rounded-md border border-surface bg-transparent px-3 py-1.5 text-sm text-color"
            >
              <option value="">Singles</option>
              {music.albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="track-number">Track number (within album)</Label>
            <input
              id="track-number"
              name="track_number"
              type="number"
              min={1}
              className="block w-full rounded-md border border-surface bg-transparent px-3 py-1.5 text-sm text-color"
            />
          </div>
          <Button type="submit" disabled={trackBusy}>
            {trackBusy ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      </section>

      {error && <p className="text-sm text-danger">{error}</p>}

      <section className="space-y-6">
        <h2 className="text-xl font-semibold text-color">
          Albums ({music.albums.length})
        </h2>
        {music.albums.length === 0 ? (
          <p className="text-muted-color">No albums yet.</p>
        ) : (
          music.albums.map((album) => (
            <AlbumCard
              key={album.id}
              album={album}
              albums={music.albums}
              onDeleteAlbum={onDeleteAlbum}
              onDeleteTrack={onDeleteTrack}
            />
          ))
        )}
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-color">
          Singles ({music.singles.length})
        </h2>
        {music.singles.length === 0 ? (
          <p className="text-muted-color">No singles yet.</p>
        ) : (
          <div className="space-y-2">
            {music.singles.map((track) => (
              <TrackRow
                key={track.id}
                track={track}
                albums={music.albums}
                onDelete={onDeleteTrack}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function AlbumCard({
  album,
  albums,
  onDeleteAlbum,
  onDeleteTrack,
}: {
  album: Album
  albums: Album[]
  onDeleteAlbum: (album: Album) => void
  onDeleteTrack: (track: Track) => void
}) {
  const { revalidate } = useRevalidator()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(album.title)
  const [description, setDescription] = useState(album.description)
  const [coverBusy, setCoverBusy] = useState(false)

  async function onSave() {
    await adminFetch(`/api/admin/albums/${album.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
    setEditing(false)
    revalidate()
  }

  async function onCoverChange(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setCoverBusy(true)
    try {
      await adminFetch(`/api/admin/albums/${album.id}/cover`, {
        method: 'PATCH',
        body: new FormData(form),
      })
      form.reset()
      revalidate()
    } finally {
      setCoverBusy(false)
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-surface p-4">
      <div className="flex items-start gap-4">
        {album.coverUrl && (
          <img
            src={album.coverUrl}
            alt={album.title}
            className="size-16 shrink-0 rounded-md object-cover"
          />
        )}
        <div className="flex-1 space-y-2">
          {editing ? (
            <>
              <InputText
                value={title}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setTitle(e.target.value)
                }
                className="w-full"
              />
              <Textarea
                value={description}
                onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                  setDescription(e.target.value)
                }
                className="w-full"
              />
              <div className="space-y-1.5">
                <Label htmlFor={`album-cover-${album.id}`}>Cover</Label>
                <form
                  onSubmit={onCoverChange}
                  className="flex flex-wrap items-center gap-2"
                >
                  <input
                    id={`album-cover-${album.id}`}
                    name="cover"
                    type="file"
                    accept="image/jpeg,image/png"
                    required
                    className="block flex-1 text-sm text-muted-color file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-color"
                  />
                  <Button
                    type="submit"
                    size="small"
                    variant="outlined"
                    disabled={coverBusy}
                  >
                    {coverBusy
                      ? 'Uploading…'
                      : album.coverUrl
                        ? 'Change cover'
                        : 'Add cover'}
                  </Button>
                </form>
              </div>
              <div className="flex gap-2">
                <Button size="small" onClick={onSave}>
                  Save
                </Button>
                <Button
                  size="small"
                  variant="text"
                  severity="secondary"
                  onClick={() => setEditing(false)}
                >
                  Cancel
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="font-medium text-color">{album.title}</p>
              <div className="flex gap-2">
                <Button
                  size="small"
                  variant="text"
                  severity="secondary"
                  onClick={() => setEditing(true)}
                >
                  Edit
                </Button>
                <Button
                  size="small"
                  variant="text"
                  severity="danger"
                  onClick={() => onDeleteAlbum(album)}
                >
                  Delete
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
      {album.tracks.length > 0 && (
        <div className="space-y-2 border-t border-surface pt-3">
          {album.tracks.map((track) => (
            <TrackRow
              key={track.id}
              track={track}
              albums={albums}
              onDelete={onDeleteTrack}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TrackRow({
  track,
  albums,
  onDelete,
}: {
  track: Track
  albums: Album[]
  onDelete: (track: Track) => void
}) {
  const { revalidate } = useRevalidator()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(track.title)
  const [description, setDescription] = useState(track.description)
  const [albumId, setAlbumId] = useState(track.albumId ?? '')
  const [trackNumber, setTrackNumber] = useState(
    track.trackNumber?.toString() ?? '',
  )
  const [coverBusy, setCoverBusy] = useState(false)

  async function onSave() {
    await adminFetch(`/api/admin/tracks/${track.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        albumId,
        trackNumber: trackNumber ? Number(trackNumber) : 0,
      }),
    })
    setEditing(false)
    revalidate()
  }

  async function onCoverChange(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setCoverBusy(true)
    try {
      await adminFetch(`/api/admin/tracks/${track.id}/cover`, {
        method: 'PATCH',
        body: new FormData(form),
      })
      form.reset()
      revalidate()
    } finally {
      setCoverBusy(false)
    }
  }

  return (
    <div className="space-y-2 rounded-md border border-surface p-3">
      {editing ? (
        <div className="space-y-2">
          <InputText
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              setTitle(e.target.value)
            }
            className="w-full"
          />
          <Textarea
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            className="w-full"
          />
          <div className="flex gap-2">
            <select
              value={albumId}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setAlbumId(e.target.value)
              }
              className="rounded-md border border-surface bg-transparent px-2 py-1 text-sm text-color"
            >
              <option value="">Singles</option>
              {albums.map((album) => (
                <option key={album.id} value={album.id}>
                  {album.title}
                </option>
              ))}
            </select>
            <input
              type="number"
              min={1}
              placeholder="Track #"
              value={trackNumber}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTrackNumber(e.target.value)
              }
              className="w-24 rounded-md border border-surface bg-transparent px-2 py-1 text-sm text-color"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`track-cover-${track.id}`}>Cover</Label>
            <form
              onSubmit={onCoverChange}
              className="flex flex-wrap items-center gap-2"
            >
              <input
                id={`track-cover-${track.id}`}
                name="cover"
                type="file"
                accept="image/jpeg,image/png"
                required
                className="block flex-1 text-sm text-muted-color file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-color"
              />
              <Button
                type="submit"
                size="small"
                variant="outlined"
                disabled={coverBusy}
              >
                {coverBusy
                  ? 'Uploading…'
                  : track.coverUrl
                    ? 'Change cover'
                    : 'Add cover'}
              </Button>
            </form>
          </div>
          <div className="flex gap-2">
            <Button size="small" onClick={onSave}>
              Save
            </Button>
            <Button
              size="small"
              variant="text"
              severity="secondary"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {track.coverUrl && (
            <img
              src={track.coverUrl}
              alt={track.title}
              className="size-10 shrink-0 rounded object-cover"
            />
          )}
          <div className="min-w-0 flex-1 space-y-1">
            <p className="truncate text-sm font-medium text-color">
              {track.trackNumber ? `${track.trackNumber}. ` : ''}
              {track.title || '(untitled)'}
            </p>
            <audio
              controls
              src={track.audioUrl}
              className="h-8 w-full max-w-xs"
            />
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              size="small"
              variant="text"
              severity="secondary"
              onClick={() => setEditing(true)}
            >
              Edit
            </Button>
            <Button
              size="small"
              variant="text"
              severity="danger"
              onClick={() => onDelete(track)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
