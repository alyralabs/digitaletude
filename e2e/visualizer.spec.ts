import type { Page } from '@playwright/test'
import { test, expect } from './fixtures'

// The visualizer needs a real WebGL2 context (NowPlayingBar feature-detects
// this and doesn't even render the open button without it). Headless WebKit
// support is not guaranteed, so this whole file stays Chromium-only per the
// plan's canvas-liveness risk note — WebKit still gets the player/transport
// coverage in player.spec.ts, which is what it was added for.
test.beforeEach(async ({ page, browserName }) => {
  test.skip(
    browserName === 'webkit',
    'visualizer requires WebGL2 in headless WebKit; canvas-liveness assertions are Chromium-only',
  )
  await page.goto('/music')
  await page.getByRole('button', { name: 'Play Onramp' }).click()
})

function dialog(page: Page) {
  return page.getByRole('dialog', { name: 'Music visualizer' })
}

// The drawing buffer isn't readable from JS, but Playwright screenshots
// capture real compositor output, so WebGL content is visible to them. The
// scene animates even at idle, so two captures apart must differ — a
// crashed, black, or frozen canvas produces identical bytes both times.
async function expectCanvasAnimating(canvas: ReturnType<Page['locator']>) {
  const before = await canvas.screenshot()
  await canvas.page().waitForTimeout(500)
  const after = await canvas.screenshot()
  expect(before.equals(after)).toBe(false)
}

test('opening the visualizer renders an animating scene', async ({ page }) => {
  await page.getByRole('button', { name: 'Open visualizer' }).click()
  const d = dialog(page)
  await expect(d).toBeVisible()
  await expectCanvasAnimating(d.locator('canvas'))
})

test('pausing keeps the scene animating instead of crashing', async ({
  page,
}) => {
  // Regression: React Compiler bailing out of PlayerProvider made
  // getAnalyser unstable, so pausing rebuilt the WebGL scene on a context
  // that had already been force-lost — an uncaught TypeError that the
  // console guard alone would catch, but the animation check proves the
  // scene stays alive, not just error-free.
  await page.getByRole('button', { name: 'Open visualizer' }).click()
  const d = dialog(page)
  const canvas = d.locator('canvas')
  await expectCanvasAnimating(canvas)

  await d.getByRole('button', { name: /^Pause/ }).click()
  await expectCanvasAnimating(canvas)

  await d.getByRole('button', { name: /^Play/ }).click()
  await expectCanvasAnimating(canvas)
})

test('escape and both close buttons all close the overlay', async ({
  page,
}) => {
  const openButton = page.getByRole('button', { name: 'Open visualizer' })

  await openButton.click()
  await page.keyboard.press('Escape')
  await expect(dialog(page)).not.toBeVisible()

  // Two elements share the aria-label "Close visualizer" — the floating
  // pill's icon button (DOM-first) and the standalone top-right corner
  // button (DOM-second). Both must work.
  await openButton.click()
  await dialog(page)
    .getByRole('button', { name: 'Close visualizer' })
    .nth(1)
    .click()
  await expect(dialog(page)).not.toBeVisible()

  await openButton.click()
  await dialog(page)
    .getByRole('button', { name: 'Close visualizer' })
    .nth(0)
    .click()
  await expect(dialog(page)).not.toBeVisible()
})

test('closing the player while the visualizer is open closes both', async ({
  page,
}) => {
  await page.getByRole('button', { name: 'Open visualizer' }).click()
  const d = dialog(page)
  await expect(d).toBeVisible()

  await d.getByRole('button', { name: 'Close player' }).click()

  await expect(d).not.toBeVisible()
  await expect(
    page.getByRole('region', { name: 'Now playing' }),
  ).not.toBeVisible()
})

test('reopening after a close gets a fresh, working scene', async ({
  page,
}) => {
  // Regression: closing the player used to leave the visualizer "armed" to
  // pop back open on the next play, and separately, re-running the scene
  // effect on a reused <canvas> after forceContextLoss() crashed the next
  // WebGLRenderer — StrictMode's dev double-mount hits that exact path on
  // open, which is why this file runs against the `dev` project too.
  const openButton = page.getByRole('button', { name: 'Open visualizer' })

  await openButton.click()
  await expect(dialog(page)).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(dialog(page)).not.toBeVisible()

  await openButton.click()
  const d = dialog(page)
  await expect(d).toBeVisible()
  await expectCanvasAnimating(d.locator('canvas'))
})
