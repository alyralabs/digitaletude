// Direct port of deriveExcerpt from the API repo (internal/posts/slug.go),
// used since the public list now reads Supabase directly and the server that
// used to derive excerpts is no longer in the read path. Keep the two in
// sync — the local admin's Go code remains the write-side source of truth.
const mdCodeFence = /```[\s\S]*?```/g
const mdImage = /!\[[^\]]*\]\([^)]*\)/g
const mdLink = /\[([^\]]*)\]\([^)]*\)/g
const mdHeading = /^#{1,6}\s*/gm
const mdEmphasis = /[*_`]+/g
const whitespaceRun = /\s+/g

export function deriveExcerpt(markdown: string, maxLen: number): string {
  const s = markdown
    .replace(mdCodeFence, '')
    .replace(mdImage, '')
    .replace(mdLink, '$1')
    .replace(mdHeading, '')
    .replace(mdEmphasis, '')
    .replace(whitespaceRun, ' ')
    .trim()

  const points = Array.from(s)
  if (points.length <= maxLen) return s

  let cut = points.slice(0, maxLen).join('')
  const i = cut.lastIndexOf(' ')
  if (i > 0) cut = cut.slice(0, i)
  return cut.trim() + '…'
}
