import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useLoaderData, useRevalidator } from 'react-router'
import { Button } from '@/components/ui/button'
import { InputText } from '@/components/ui/inputtext'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { adminFetch, apiFetch } from '../../lib/api'
import type { Photo } from '../../lib/types'

export async function loader() {
  return apiFetch<Photo[]>('/api/photos')
}

export default function PhotosAdmin() {
  const photos = useLoaderData<Photo[]>()
  const { revalidate } = useRevalidator()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function onUpload(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    setBusy(true)
    setError(null)
    try {
      await adminFetch('/api/admin/photos', {
        method: 'POST',
        body: new FormData(form),
      })
      form.reset()
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'upload failed')
    } finally {
      setBusy(false)
    }
  }

  async function onDelete(photo: Photo) {
    if (!confirm(`Delete "${photo.title}"?`)) return
    setError(null)
    try {
      await adminFetch(`/api/admin/photos/${photo.id}`, { method: 'DELETE' })
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed')
    }
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-color">Upload photo</h2>
        <form onSubmit={onUpload} className="max-w-md space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="file">Image (JPEG/PNG, ≤ 15 MB)</Label>
            <input
              id="file"
              name="file"
              type="file"
              accept="image/jpeg,image/png"
              required
              className="block w-full text-sm text-muted-color file:mr-3 file:rounded-md file:border-0 file:bg-surface-100 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-color dark:file:bg-surface-800"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <InputText id="title" name="title" required className="w-full" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" className="w-full" />
          </div>
          <Button type="submit" disabled={busy}>
            {busy ? 'Uploading…' : 'Upload'}
          </Button>
        </form>
      </section>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-color">
          Photos ({photos.length})
        </h2>
        {photos.length === 0 ? (
          <p className="text-muted-color">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onDelete={onDelete} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function PhotoCard({
  photo,
  onDelete,
}: {
  photo: Photo
  onDelete: (photo: Photo) => void
}) {
  const { revalidate } = useRevalidator()
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(photo.title)
  const [description, setDescription] = useState(photo.description)

  async function onSave() {
    await adminFetch(`/api/admin/photos/${photo.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
    setEditing(false)
    revalidate()
  }

  return (
    <div className="space-y-2 rounded-lg border border-surface p-2">
      <img
        src={photo.thumbnailUrl}
        alt={photo.title}
        width={photo.width}
        height={photo.height}
        className="aspect-square w-full rounded-md object-cover"
      />
      {editing ? (
        <div className="space-y-2">
          <InputText
            value={title}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
            className="w-full"
          />
          <Textarea
            value={description}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            className="w-full"
          />
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
        <div className="space-y-1">
          <p className="truncate text-sm font-medium text-color">
            {photo.title}
          </p>
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
              onClick={() => onDelete(photo)}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
