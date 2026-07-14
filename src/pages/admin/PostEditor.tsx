import { useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import {
  useLoaderData,
  useNavigate,
  useRevalidator,
  type LoaderFunctionArgs,
} from 'react-router'
import { Button } from '@/components/ui/button'
import { InputText } from '@/components/ui/inputtext'
import { Label } from '@/components/ui/label'
import { Tag } from '@/components/ui/tag'
import { Textarea } from '@/components/ui/textarea'
import PostBody from '../../components/PostBody'
import { adminFetch } from '../../lib/api'
import type { Post } from '../../lib/types'

export async function loader({ params }: LoaderFunctionArgs) {
  if (!params.id) return null
  return adminFetch<Post>(`/api/admin/posts/${params.id}`)
}

export default function PostEditor() {
  const post = useLoaderData<Post | null>()
  const isNew = post === null
  const navigate = useNavigate()
  const { revalidate } = useRevalidator()
  const coverInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(post?.title ?? '')
  const [excerpt, setExcerpt] = useState(post?.excerpt ?? '')
  const [slug, setSlug] = useState(post?.slug ?? '')
  const [contentMarkdown, setContentMarkdown] = useState(
    post?.contentMarkdown ?? '',
  )
  const [busy, setBusy] = useState(false)
  const [coverBusy, setCoverBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    try {
      if (isNew) {
        const formData = new FormData()
        formData.set('title', title)
        formData.set('excerpt', excerpt)
        formData.set('contentMarkdown', contentMarkdown)
        const file = coverInputRef.current?.files?.[0]
        if (file) formData.set('cover', file)
        const created = await adminFetch<Post>('/api/admin/posts', {
          method: 'POST',
          body: formData,
        })
        navigate(`/admin/posts/${created.id}`)
      } else {
        await adminFetch(`/api/admin/posts/${post.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            excerpt,
            contentMarkdown,
            slug: post.status === 'draft' ? slug : undefined,
          }),
        })
        revalidate()
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'save failed')
    } finally {
      setBusy(false)
    }
  }

  async function onCoverChange(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!post) return
    const form = e.currentTarget
    setCoverBusy(true)
    setError(null)
    try {
      await adminFetch(`/api/admin/posts/${post.id}/cover`, {
        method: 'PATCH',
        body: new FormData(form),
      })
      form.reset()
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'cover update failed')
    } finally {
      setCoverBusy(false)
    }
  }

  async function onPublish() {
    if (!post) return
    setError(null)
    try {
      await adminFetch(`/api/admin/posts/${post.id}/publish`, {
        method: 'PATCH',
      })
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'publish failed')
    }
  }

  async function onUnpublish() {
    if (!post) return
    setError(null)
    try {
      await adminFetch(`/api/admin/posts/${post.id}/unpublish`, {
        method: 'PATCH',
      })
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'unpublish failed')
    }
  }

  async function onDelete() {
    if (!post) return
    if (!confirm(`Delete "${post.title}"?`)) return
    setError(null)
    try {
      await adminFetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' })
      navigate('/admin/posts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-color">
          {isNew ? 'New post' : 'Edit post'}
        </h2>
        {post && (
          <Tag severity={post.status === 'published' ? 'success' : 'secondary'}>
            {post.status}
          </Tag>
        )}
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {!isNew && (
        <div className="max-w-md space-y-1.5">
          <Label htmlFor="edit-cover">Cover image</Label>
          {post.coverUrl && (
            <img
              src={post.coverUrl}
              alt={post.title}
              className="h-32 w-full rounded-lg object-cover"
            />
          )}
          {/* Its own <form>, deliberately not nested inside the one below —
              a <form> inside a <form> is invalid HTML, and this is a
              separate multipart action from the text-fields Save anyway. */}
          <form
            onSubmit={onCoverChange}
            className="flex flex-wrap items-center gap-2"
          >
            <input
              id="edit-cover"
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
                : post.coverUrl
                  ? 'Change cover'
                  : 'Add cover'}
            </Button>
          </form>
        </div>
      )}

      <form onSubmit={onSubmit} className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <InputText
              id="title"
              value={title}
              onChange={(e: ChangeEvent<HTMLInputElement>) =>
                setTitle(e.target.value)
              }
              required
              className="w-full"
            />
          </div>

          {!isNew && post.status === 'draft' && (
            <div className="space-y-1.5">
              <Label htmlFor="slug">Slug</Label>
              <InputText
                id="slug"
                value={slug}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  setSlug(e.target.value)
                }
                className="w-full"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              value={excerpt}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setExcerpt(e.target.value)
              }
              placeholder="Optional — derived from the content if left blank"
              className="w-full"
            />
          </div>

          {isNew && (
            <div className="space-y-1.5">
              <Label htmlFor="cover">Cover image (optional, JPEG/PNG)</Label>
              <input
                id="cover"
                name="cover"
                ref={coverInputRef}
                type="file"
                accept="image/jpeg,image/png"
                className="block w-full text-sm text-muted-color file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-color"
              />
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="contentMarkdown">Content (Markdown)</Label>
            <Textarea
              id="contentMarkdown"
              value={contentMarkdown}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) =>
                setContentMarkdown(e.target.value)
              }
              rows={16}
              className="w-full font-mono text-sm"
            />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save'}
            </Button>
            {!isNew && (
              <>
                {post.status === 'draft' ? (
                  <Button type="button" variant="outlined" onClick={onPublish}>
                    Publish
                  </Button>
                ) : (
                  <Button
                    type="button"
                    variant="outlined"
                    severity="secondary"
                    onClick={onUnpublish}
                  >
                    Unpublish
                  </Button>
                )}
                <Button
                  type="button"
                  variant="text"
                  severity="danger"
                  onClick={onDelete}
                >
                  Delete
                </Button>
              </>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Preview</Label>
          <div className="rounded-lg border border-surface p-4">
            <PostBody
              markdown={contentMarkdown || '*Nothing to preview yet.*'}
            />
          </div>
        </div>
      </form>
    </div>
  )
}
