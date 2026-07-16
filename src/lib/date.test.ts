import { describe, expect, it } from 'vitest'
import { formatDate } from './date'

describe('formatDate', () => {
  it('formats an ISO timestamp as a long UTC date', () => {
    expect(formatDate('2026-07-12T15:30:00Z')).toBe('July 12, 2026')
  })

  it('does not shift the day for late-UTC timestamps', () => {
    expect(formatDate('2026-01-01T00:00:00Z')).toBe('January 1, 2026')
    expect(formatDate('2026-12-31T23:59:59Z')).toBe('December 31, 2026')
  })
})
