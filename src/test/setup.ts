import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'
// The dedicated Vitest entry point (not the bare `@testing-library/jest-dom`
// side-effect import, which assumes a Jest-style ambient `expect`): this
// both extends Vitest's own `expect` and ambient-declares the matcher types
// on Vitest's `Assertion` interface, so `tsc` recognizes them too.
import '@testing-library/jest-dom/vitest'

// @testing-library/react's automatic afterEach-cleanup registration only
// fires when it detects a global test-framework afterEach; with globals off
// it has to be wired explicitly, or DOM from one test leaks into the next.
afterEach(cleanup)

// The loader cache is module-level state — without a reset, one test's
// mocked fetch result would satisfy the next test's navigation. Imported
// dynamically at hook time: a static import here would load lib/api before
// a test file's vi.mock('../lib/api') can intercept it, silently unmocking
// every suite.
afterEach(async () => {
  const { resetLoaderCache } = await import('../lib/loaders')
  resetLoaderCache()
})
