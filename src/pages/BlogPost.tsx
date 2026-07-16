import { useLoaderData } from 'react-router'
import PostBody from '../components/PostBody'
import { formatDate } from '../lib/date'
import type { Post } from '../lib/types'

export default function BlogPost() {
  const post = useLoaderData<Post>()

  // Publishing stamps both timestamps in the same transaction, so a post
  // that's never been edited after publish has updatedAt === publishedAt —
  // "Updated" only appears once a real post-publish edit bumps updatedAt.
  const updatedAfterPublish =
    post.publishedAt !== null &&
    new Date(post.updatedAt).getTime() > new Date(post.publishedAt).getTime() &&
    formatDate(post.updatedAt) !== formatDate(post.publishedAt)

  return (
    // Capped at a readable measure independent of how wide the page shell
    // gets (plans/04-styling.md) — long-form text shouldn't stretch across
    // an ultrawide viewport just because the container can.
    <article className="mx-auto max-w-prose space-y-6">
      {post.coverUrl && (
        <img
          src={post.coverUrl}
          alt={post.title}
          className="w-full rounded-lg object-cover"
        />
      )}
      <header className="space-y-3">
        <h1 className="text-4xl font-bold tracking-tight text-color">
          {post.title}
        </h1>
        {post.publishedAt && (
          <p className="text-sm text-muted-color">
            <time dateTime={post.publishedAt}>
              {formatDate(post.publishedAt)}
            </time>
            {updatedAfterPublish && (
              <>
                {' · Updated '}
                <time dateTime={post.updatedAt}>
                  {formatDate(post.updatedAt)}
                </time>
              </>
            )}
          </p>
        )}
        <hr className="w-full border-surface" />
      </header>
      <PostBody markdown={post.contentMarkdown} />
    </article>
  )
}
