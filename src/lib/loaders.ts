import type { LoaderFunctionArgs } from 'react-router'
import { fetchMusic, fetchPhotos, fetchPostBySlug, fetchPosts } from './api'

// Route loaders live here rather than in the page modules: App.tsx imports
// loaders statically so each route's data fetch starts in parallel with its
// lazy chunk download, and statically importing anything from a page module
// would pull that whole module into the shared chunk and defeat the
// per-route code splitting (a module that is both statically and dynamically
// imported never gets its own chunk).

export async function photographyLoader() {
  return fetchPhotos()
}

export async function musicLoader() {
  return fetchMusic()
}

export async function blogLoader() {
  return fetchPosts()
}

export async function blogPostLoader({ params }: LoaderFunctionArgs) {
  const post = await fetchPostBySlug(params.slug!)
  if (!post) throw new Response('Not Found', { status: 404 })
  return post
}
