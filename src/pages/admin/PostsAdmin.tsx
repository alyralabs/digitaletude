import { useState } from 'react'
import { useLoaderData, useNavigate, useRevalidator } from 'react-router'
import { Button } from '@/components/ui/button'
import { Tag } from '@/components/ui/tag'
import { adminFetch } from '../../lib/api'
import type { Post } from '../../lib/types'

export async function loader() {
  return adminFetch<Post[]>('/api/admin/posts')
}

export default function PostsAdmin() {
  const posts = useLoaderData<Post[]>()
  const navigate = useNavigate()
  const { revalidate } = useRevalidator()
  const [error, setError] = useState<string | null>(null)

  async function onDelete(post: Post) {
    if (!confirm(`Delete "${post.title}"?`)) return
    setError(null)
    try {
      await adminFetch(`/api/admin/posts/${post.id}`, { method: 'DELETE' })
      revalidate()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'delete failed')
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-color">
          Blog posts ({posts.length})
        </h2>
        <Button size="small" onClick={() => navigate('/admin/posts/new')}>
          New post
        </Button>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      {posts.length === 0 ? (
        <p className="text-muted-color">No posts yet.</p>
      ) : (
        <div className="divide-y divide-surface rounded-lg border border-surface">
          {posts.map((post) => (
            <div
              key={post.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <button
                type="button"
                onClick={() => navigate(`/admin/posts/${post.id}`)}
                className="flex flex-1 items-center gap-3 text-left"
              >
                <span className="truncate font-medium text-color">
                  {post.title}
                </span>
                <Tag
                  severity={
                    post.status === 'published' ? 'success' : 'secondary'
                  }
                >
                  {post.status}
                </Tag>
                <span className="text-xs text-muted-color">
                  updated {new Date(post.updatedAt).toLocaleDateString()}
                </span>
              </button>
              <Button
                size="small"
                variant="text"
                severity="danger"
                onClick={() => onDelete(post)}
              >
                Delete
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
