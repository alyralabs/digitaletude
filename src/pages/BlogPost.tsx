import { useLoaderData, type LoaderFunctionArgs } from 'react-router'
import PostBody from '../components/PostBody'
import { apiFetch, ApiError } from '../lib/api'
import type { Post } from '../lib/types'

export async function loader({ params }: LoaderFunctionArgs) {
  try {
    return await apiFetch<Post>(`/api/posts/${params.slug}`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      throw new Response('Not Found', { status: 404 })
    }
    throw err
  }
}

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
