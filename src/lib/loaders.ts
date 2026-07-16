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
// TTL-stale. Failed promises evict themselves — errors always refetch.
const TTL_MS = 5 * 60_000

// React's `use()` reads a thenable synchronously when it carries the
// instrumented `status`/`value` fields — that's what makes a cache-hit
// revisit render content immediately instead of flashing the Suspense
// skeleton for a frame while an already-resolved promise is awaited.
type TrackedPromise<T> = Promise<T> & { status?: 'fulfilled'; value?: T }

const cache = new Map<
  string,
  { at: number; promise: TrackedPromise<unknown> }
>()

function cached<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const hit = cache.get(key)
  if (hit && Date.now() - hit.at < TTL_MS) {
    return hit.promise as Promise<T>
  }
  const promise: TrackedPromise<T> = fetcher().then((value) => {
    promise.status = 'fulfilled'
    promise.value = value
    return value
  })
  promise.catch(() => cache.delete(key))
  cache.set(key, { at: Date.now(), promise })
  return promise
}

// Test-only escape hatch: the module-level cache would otherwise leak one
// test's mock data into the next (wired up in src/test/setup.ts).
export function resetLoaderCache() {
  cache.clear()
}

// Photography and Music return their promise *un-awaited* (wrapped in an
// object so the router doesn't await it either): the page renders
// immediately and shows a skeleton via Suspense + use() until the data
// lands, instead of blocking navigation on the fetch.

export function photographyLoader() {
  return { photos: cached('photos', fetchPhotos) }
}

export function musicLoader() {
  return { music: cached('music', fetchMusic) }
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
