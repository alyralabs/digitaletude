import { useLoaderData } from 'react-router'
import PostBody from '../components/PostBody'
import type { Post } from '../lib/types'

export default function BlogPost() {
  const post = useLoaderData<Post>()

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
      <h1 className="text-4xl font-bold tracking-tight text-color">
        {post.title}
      </h1>
      <PostBody markdown={post.contentMarkdown} />
    </article>
  )
}
