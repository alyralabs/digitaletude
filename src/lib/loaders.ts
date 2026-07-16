import type { LoaderFunctionArgs } from 'react-router'
import { fetchMusic, fetchPhotos, fetchPostBySlug, fetchPosts } from './api'

// Route loaders live here rather than in the page modules: App.tsx imports
// loaders statically so each route's data fetch starts in parallel with its
// lazy chunk download, and statically importing anything from a page module
// would pull that whole module into the shared chunk and defeat the
// per-route code splitting (a module that is both statically and dynamically
// imported never gets its own chunk).

// React Router re-runs loaders on every navigation and PostgREST responses
// carry no cache headers, so without this every Blog↔Music↔Photography
// hop refires the same queries. Content only changes when the admin tool
// publishes, so a short TTL keeps repeat navigations instant at worst
// TTL-stale. Only successful results are cached — errors always refetch.
const TTL_MS = 5 * 60_000

const cache = new Map<string, { at: number; data: unknown }>()

async function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) return hit.data as T
  const data = await fetcher()
  cache.set(key, { at: Date.now(), data })
  return data
}

// Test-only escape hatch: the module-level cache would otherwise leak one
// test's mock data into the next (wired up in src/test/setup.ts).
export function resetLoaderCache() {
  cache.clear()
}

export async function photographyLoader() {
  return cached('photos', fetchPhotos)
}

export async function musicLoader() {
  return cached('music', fetchMusic)
}

export async function blogLoader() {
  return cached('posts', fetchPosts)
}

export async function blogPostLoader({ params }: LoaderFunctionArgs) {
  const slug = params.slug!
  const post = await cached(`post:${slug}`, async () => {
    const found = await fetchPostBySlug(slug)
    if (!found) throw new Response('Not Found', { status: 404 })
    return found
  })
  return post
}
