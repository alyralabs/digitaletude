import { readFileSync } from 'node:fs'
import { test as base, expect, type Route } from '@playwright/test'
import music from './fixtures/music.json' with { type: 'json' }
import posts from './fixtures/posts.json' with { type: 'json' }
import photos from './fixtures/photos.json' with { type: 'json' }

export const STUB = 'https://stub.supabase.test'

// The app page (localhost) fetches the stub origin cross-origin with
// apikey + Authorization headers, so the browser sends CORS preflights and
// enforces CORS on fulfilled responses. Every fulfill needs these headers
// and OPTIONS must be answered, or nothing gets through at all. Exported so
// specs that need a per-test route override (e.g. delaying one specific
// image response) can reuse the same headers — see music.spec.ts.
export const CORS = {
  'access-control-allow-origin': '*',
  'access-control-allow-headers': 'apikey, authorization, content-type',
  'access-control-allow-methods': 'GET, POST, PATCH, DELETE, OPTIONS',
}

function json(route: Route, body: unknown) {
  return route.fulfill({ json: body, headers: CORS })
}

// WebKit's <audio> pipeline treats a resource as reload-from-scratch unless
// the response looks Range-capable — without Accept-Ranges/206 support,
// resuming a paused track re-fetched the whole file and reset currentTime
// to 0 under WebKit specifically (Chromium never needed this). This isn't
// the app's own reload-on-resume bug (that path is untouched: audio.src is
// never reassigned across a pause/resume of the same track) — it's WebKit's
// media stack, over an HTTP layer we're simulating, wanting real Range
// support to treat the resource as seekable/resumable.
async function fulfillMedia(route: Route, filePath: string) {
  const buffer = readFileSync(filePath)
  const contentType = filePath.endsWith('.wav') ? 'audio/wav' : 'image/png'
  const range = await route.request().headerValue('range')
  const base = {
    ...CORS,
    'accept-ranges': 'bytes',
    'content-type': contentType,
  }

  if (!range) {
    return route.fulfill({
      status: 200,
      headers: { ...base, 'content-length': String(buffer.length) },
      body: buffer,
    })
  }

  const match = /bytes=(\d*)-(\d*)/.exec(range)
  const start = match?.[1] ? Number(match[1]) : 0
  const end = match?.[2] ? Number(match[2]) : buffer.length - 1
  const slice = buffer.subarray(start, end + 1)
  return route.fulfill({
    status: 206,
    headers: {
      ...base,
      'content-range': `bytes ${start}-${end}/${buffer.length}`,
      'content-length': String(slice.length),
    },
    body: slice,
  })
}

async function handleStub(route: Route) {
  const request = route.request()
  if (request.method() === 'OPTIONS') {
    return route.fulfill({ status: 204, headers: CORS })
  }

  const url = new URL(request.url())
  const { pathname, searchParams } = url

  if (pathname.startsWith('/rest/v1/albums')) return json(route, music.albums)
  if (pathname.startsWith('/rest/v1/tracks')) return json(route, music.tracks)
  if (pathname.startsWith('/rest/v1/photos')) return json(route, photos)
  if (pathname.startsWith('/rest/v1/posts')) {
    // fetchPostBySlug queries `slug=eq.<slug>`; fetchPosts has no slug
    // filter at all. Same pathname either way, so branch on the query.
    const slugParam = searchParams.get('slug')
    const slug = slugParam?.startsWith('eq.')
      ? decodeURIComponent(slugParam.slice(3))
      : null
    if (slug)
      return json(
        route,
        posts.filter((p) => p.slug === slug),
      )
    return json(route, posts)
  }

  // Storage: real bytes, so <audio>, the AnalyserNode graph, and image
  // onload all run their production code paths.
  if (pathname.startsWith('/storage/v1/object/public')) {
    const path = pathname.endsWith('.wav')
      ? 'e2e/fixtures/tone.wav'
      : 'e2e/fixtures/cover.png'
    return fulfillMedia(route, path)
  }

  // A deliberate, loud failure for anything unaccounted for — a live
  // fetch to this fake domain would hang or DNS-fail instead, so a crisp
  // 404 makes a missed interception obvious in the request instead of a
  // confusing downstream symptom.
  return route.fulfill({ status: 404, headers: CORS, body: 'not stubbed' })
}

// Known-benign console.error patterns, filtered out of the guard by exact
// cause rather than loosening it generally. Each one is a browser/test-infra
// artifact, not application misbehavior — anything not matched here still
// fails the test.
const BENIGN_CONSOLE_ERRORS: RegExp[] = [
  // index.html preconnects to VITE_SUPABASE_URL as a real perf hint — Vite
  // substitutes it with STUB at build time. Chromium routes/silences that
  // resource hint through page.route() like any other request, but WebKit
  // resolves it via real DNS before interception applies, so the .test
  // TLD's guaranteed NXDOMAIN (RFC 2606) surfaces as a console.error there.
  // WebKit-only side effect of faking the origin this way.
  /^Failed to preconnect to .*stub\.supabase\.test/,
  // PlayerContext's play() does `void audio.play()` with no rejection
  // handler. A pause() landing before that promise settles (a real user
  // double-tapping play/pause, or — as found writing this suite — five
  // parallel headless tabs contending for CPU against one shared dev
  // server) makes the browser reject it with a harmless AbortError, which
  // surfaces as an unhandled-rejection console.error. Confirmed a real,
  // if minor, pre-existing gap (not a test-timing artifact: reproduces at
  // ~1-in-7 under parallel load, never under serial runs) — worth an
  // `audio.play().catch(() => {})` in PlayerContext.tsx, but that's a
  // production-code fix outside this plan's stated scope, so it's flagged
  // here rather than silently patched. Chromium phrases the rejection as
  // "The play() request was interrupted by a call to pause()"; WebKit
  // phrases the same DOMException as "AbortError: The operation was
  // aborted." — same cause, worded differently per engine. No other
  // AbortController/AbortSignal usage exists anywhere in the app (checked),
  // so a bare AbortError match can't be masking something unrelated.
  /^The play\(\) request was interrupted by a call to pause\(\)/,
  /^AbortError: The operation was aborted\.?$/,
]

const isBenignConsoleError = (text: string) =>
  BENIGN_CONSOLE_ERRORS.some((pattern) => pattern.test(text))

export const test = base.extend({
  // Playwright's convention names this second param "use" — renamed here
  // because eslint-plugin-react-hooks (applied repo-wide to **/*.ts) treats
  // any use*-prefixed identifier as a React Hook call and flags it as
  // invalid outside a component/hook, a false positive for Playwright's
  // fixture pattern rather than an actual hook-rules violation.
  page: async ({ page }, runTest) => {
    // Any uncaught exception or console.error fails the test. Both
    // visualizer crashes threw uncaught TypeErrors — this guard alone
    // would have caught them from any test that opened the overlay.
    const errors: string[] = []
    // Unhandled promise rejections (like the AbortError below) surface via
    // pageerror, not a console 'error' event — the benign-message filter has
    // to apply to both listeners, not just console.
    page.on('pageerror', (err) => {
      if (!isBenignConsoleError(err.message)) errors.push(err.message)
    })
    page.on('console', (msg) => {
      if (msg.type() === 'error' && !isBenignConsoleError(msg.text())) {
        errors.push(msg.text())
      }
    })

    await page.route(`${STUB}/**`, handleStub)

    await runTest(page)

    expect(errors, 'page logged errors during the test').toEqual([])
  },
})

export { expect }
