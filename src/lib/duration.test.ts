import { describe, expect, it } from 'vitest'
import { formatDuration } from './duration'

describe('formatDuration', () => {
  it('returns null for null input', () => {
    expect(formatDuration(null)).toBeNull()
  })

  it('formats zero as 0:00', () => {
    expect(formatDuration(0)).toBe('0:00')
  })

  it('pads sub-ten-second remainders', () => {
    expect(formatDuration(65)).toBe('1:05')
  })

  it('formats whole minutes', () => {
    expect(formatDuration(180)).toBe('3:00')
  })

  it('floors fractional seconds instead of rendering them', () => {
    expect(formatDuration(125.7)).toBe('2:05')
  })

  it('carries hours into the minutes column', () => {
    expect(formatDuration(3725)).toBe('62:05')
  })
})
