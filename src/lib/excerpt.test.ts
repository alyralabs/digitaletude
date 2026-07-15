import { describe, expect, it } from 'vitest'
import { deriveExcerpt } from './excerpt'

// Mirrors the Go implementation's behavior (internal/posts/slug.go in the
// API repo) — these cases document the contract the two ports share.
describe('deriveExcerpt', () => {
  it('strips headings, emphasis, and collapses whitespace', () => {
    expect(deriveExcerpt('# Heading\n\nSome **bold** and _italic_.', 200)).toBe(
      'Heading Some bold and italic.',
    )
  })

  it('drops code fences and images, keeps link text', () => {
    const md =
      'Intro ```\ncode here\n``` ![alt text](img.png) a [label](https://x) end'
    expect(deriveExcerpt(md, 200)).toBe('Intro a label end')
  })

  it('returns short text unchanged (after cleanup)', () => {
    expect(deriveExcerpt('just a sentence', 200)).toBe('just a sentence')
  })

  it('cuts at a word boundary and appends an ellipsis', () => {
    const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(' ')
    const got = deriveExcerpt(words, 50)
    expect(got.length).toBeLessThanOrEqual(51) // 50 + ellipsis
    expect(got.endsWith('…')).toBe(true)
    expect(got).not.toContain('  ')
    // Never cuts mid-word: everything before the ellipsis is whole words.
    for (const w of got.slice(0, -1).trim().split(' ')) {
      expect(words).toContain(w)
    }
  })
})
