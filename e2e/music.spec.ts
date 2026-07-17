import { readFileSync } from 'node:fs'
import { test, expect, STUB, CORS } from './fixtures'

test('album cover shows a skeleton while loading, never the broken-image alt text', async ({
  page,
}) => {
  // Regression: before this, the <img> had no loading state at all, so the
  // browser painted the alt text into the box for the frame(s) before
  // bytes arrived — invisible to jsdom (it never loads images at all) but
  // visible to a real user on every fresh load.
  let resolveDelay: () => void
  const delayed = new Promise<void>((resolve) => {
    resolveDelay = resolve
  })

  // Overrides the fixture dispatcher's storage branch for this one path —
  // per-test routes registered after fixtures.ts's page.route() win,
  // newest-first (see fixtures.ts).
  await page.route(
    `${STUB}/storage/v1/object/public/music/album-1/cover.png`,
    async (route) => {
      await delayed
      const buffer = readFileSync('e2e/fixtures/cover.png')
      return route.fulfill({
        status: 200,
        headers: { ...CORS, 'content-type': 'image/png' },
        body: buffer,
      })
    },
  )

  await page.goto('/music')

  // Scoped to the wrapper that holds this specific cover, so a
  // fast-resolving track-row skeleton elsewhere on the page can't be
  // mistaken for this one.
  const wrapper = page.locator('div:has(> img[alt="Nightdrive"])')
  const skeleton = wrapper.locator('[aria-hidden]')
  const cover = wrapper.locator('img')

  await expect(skeleton).toBeVisible()
  await expect(cover).toHaveCSS('opacity', '0')

  resolveDelay!()

  await expect(cover).toHaveCSS('opacity', '1')
  await expect(skeleton).toHaveCount(0)
})
