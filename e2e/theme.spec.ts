import { test, expect } from './fixtures'

test.use({ colorScheme: 'light' })

test('theme toggle applies .dark to <html> and persists across a reload', async ({
  page,
}) => {
  await page.goto('/blog')
  const html = page.locator('html')
  await expect(html).not.toHaveClass(/dark/)

  await page.getByRole('switch', { name: 'Switch to dark mode' }).click()
  await expect(html).toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('theme')))
    .toBe('dark')

  // The pre-paint inline script in index.html mirrors getInitialTheme() to
  // avoid a light-mode flash on load — this is what proves that stays in
  // sync with the persisted value, not just the in-page React state.
  await page.reload()
  await expect(html).toHaveClass(/dark/)

  await page.getByRole('switch', { name: 'Switch to light mode' }).click()
  await expect(html).not.toHaveClass(/dark/)
  await expect
    .poll(() => page.evaluate(() => localStorage.getItem('theme')))
    .toBe('light')
})
