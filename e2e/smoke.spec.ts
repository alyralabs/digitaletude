import { test, expect } from './fixtures'

// Console guard alone (see fixtures.ts) would have caught both visualizer
// crashes — every test here doubles as a crash detector for its route.

test('home redirects to the blog and lists fixture posts', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(/\/blog$/)
  await expect(
    page.getByRole('heading', { name: 'Blog', level: 1 }),
  ).toBeVisible()
  await expect(page.getByRole('link', { name: 'The First Post' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'A Second One' })).toBeVisible()
})

test('photography route renders the fixture gallery', async ({ page }) => {
  await page.goto('/photography')
  await expect(
    page.getByRole('heading', { name: 'Photography', level: 1 }),
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Overlook' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Underpass' })).toBeVisible()
})

test('music route renders the fixture album and single', async ({ page }) => {
  await page.goto('/music')
  await expect(
    page.getByRole('heading', { name: 'Music', level: 1 }),
  ).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Nightdrive' })).toBeVisible()
  await expect(page.getByText('Onramp')).toBeVisible()
  await expect(page.getByText('Loose Ends')).toBeVisible()
})

test('a blog post permalink renders the fixture markdown body', async ({
  page,
}) => {
  await page.goto('/blog/first-post')
  await expect(
    page.getByRole('heading', { name: 'The First Post' }),
  ).toBeVisible()
})

test('nav links move between routes without a console error', async ({
  page,
}) => {
  await page.goto('/blog')
  // Scoped to the <nav> landmark: the drawer's duplicate mobile links
  // portal to document.body, outside this element, so this stays
  // unambiguous regardless of whether the drawer is mounted while closed.
  const nav = page.getByRole('navigation')
  await nav.getByRole('link', { name: 'Photography' }).click()
  await expect(page).toHaveURL(/\/photography$/)
  await nav.getByRole('link', { name: 'Music' }).click()
  await expect(page).toHaveURL(/\/music$/)
  await nav.getByRole('link', { name: 'Blog' }).click()
  await expect(page).toHaveURL(/\/blog$/)
})
