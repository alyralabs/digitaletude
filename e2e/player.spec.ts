import { test, expect } from './fixtures'

test.describe('player transport', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/music')
  })

  test('play mounts the player bar and pause keeps the track loaded', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Play Onramp' }).click()

    const bar = page.getByRole('region', { name: 'Now playing' })
    await expect(bar).toBeVisible()
    await expect(bar.getByText('Onramp')).toBeVisible()
    await expect(
      bar.getByRole('button', { name: 'Pause Onramp' }),
    ).toBeVisible()
    await expect(page.locator('audio')).toHaveJSProperty('paused', false)

    await bar.getByRole('button', { name: 'Pause Onramp' }).click()
    await expect(bar.getByRole('button', { name: 'Play Onramp' })).toBeVisible()
    await expect(page.locator('audio')).toHaveJSProperty('paused', true)
    // Pausing must not clear the track — the bar stays mounted.
    await expect(bar).toBeVisible()
  })

  test('resuming a paused track continues from where it left off', async ({
    page,
    browserName,
  }) => {
    // Regression for the reload-on-resume bug: an earlier version
    // reassigned audio.src unconditionally on every play() call, which
    // restarts the media element's load from zero even when resuming the
    // exact track that was just paused.
    //
    // Chromium-only: headless WebKit in this environment resets
    // currentTime to 0 on pause() itself (confirmed via debug
    // instrumentation — audio.src, readyState, and networkState are all
    // unchanged across the pause/resume cycle, so it isn't reloading
    // anything; it's a headless-WebKit audio-backend limitation, most
    // likely the lack of a real output device, not an app or HTTP-layer
    // bug). The "paused/resumed keeps the track loaded" test above already
    // gives WebKit its transport-state coverage.
    test.skip(
      browserName === 'webkit',
      'headless WebKit resets currentTime on pause() itself in this environment — not the app bug this test targets',
    )
    const bar = page.getByRole('region', { name: 'Now playing' })
    const audio = page.locator('audio')

    await page.getByRole('button', { name: 'Play Onramp' }).click()
    await expect(audio).toHaveJSProperty('paused', false)
    await page.waitForFunction(
      () => (document.querySelector('audio')?.currentTime ?? 0) > 0.3,
    )
    const beforePause = await audio.evaluate(
      (el: HTMLAudioElement) => el.currentTime,
    )

    await bar.getByRole('button', { name: 'Pause Onramp' }).click()
    await bar.getByRole('button', { name: 'Play Onramp' }).click()
    await expect(audio).toHaveJSProperty('paused', false)
    await page.waitForTimeout(300)

    const afterResume = await audio.evaluate(
      (el: HTMLAudioElement) => el.currentTime,
    )
    expect(afterResume).toBeGreaterThanOrEqual(beforePause - 0.05)
  })

  test('next and prev walk the queue and wrap at the ends', async ({
    page,
  }) => {
    const bar = page.getByRole('region', { name: 'Now playing' })
    await page.getByRole('button', { name: 'Play Onramp' }).click()
    await expect(bar.getByText('Onramp')).toBeVisible()

    await bar.getByRole('button', { name: 'Next track' }).click()
    await expect(bar.getByText('Overpass')).toBeVisible()

    await bar.getByRole('button', { name: 'Next track' }).click()
    await expect(bar.getByText('Loose Ends')).toBeVisible()

    // Wraps last -> first.
    await bar.getByRole('button', { name: 'Next track' }).click()
    await expect(bar.getByText('Onramp')).toBeVisible()

    // Near the start of a track, prev wraps backwards instead of restarting.
    await bar.getByRole('button', { name: 'Previous track' }).click()
    await expect(bar.getByText('Loose Ends')).toBeVisible()
  })

  test('closing the player pauses playback and unmounts the bar', async ({
    page,
  }) => {
    await page.getByRole('button', { name: 'Play Onramp' }).click()
    const bar = page.getByRole('region', { name: 'Now playing' })
    await expect(bar).toBeVisible()

    await bar.getByRole('button', { name: 'Close player' }).click()
    await expect(bar).not.toBeVisible()
    await expect(page.locator('audio')).toHaveJSProperty('paused', true)
  })

  test('volume changes persist across a reload', async ({ page }) => {
    await page.getByRole('button', { name: 'Play Onramp' }).click()
    const bar = page.getByRole('region', { name: 'Now playing' })

    // Two sliders exist once a track is playing: the seek bar (first in
    // DOM order) and the desktop volume slider (second) — the mobile
    // volume popover only renders once opened, so it can't collide here.
    const volumeSlider = bar.getByRole('slider').nth(1)
    await volumeSlider.focus()
    await page.keyboard.press('Home') // ARIA slider convention: jump to min

    await expect(page.locator('audio')).toHaveJSProperty('volume', 0)
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem('player-volume')))
      .toBe('0')

    await page.reload()
    // Persisted volume applies to the (always-mounted, hidden) <audio>
    // element on mount, before anything is played again.
    await expect(page.locator('audio')).toHaveJSProperty('volume', 0)
  })
})
