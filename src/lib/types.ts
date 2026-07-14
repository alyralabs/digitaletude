// Camera-settings subset shown as a viewfinder-style overlay — not a full
// EXIF dump. Every field is optional; the server omits whatever the camera
// didn't record. Pre-formatted strings (e.g. "f/2.8", "ISO 400") — no
// per-field formatting on this side, just join whatever's present.
export type PhotoExif = {
  camera?: string
  aperture?: string
  shutterSpeed?: string
  iso?: string
  focalLength?: string
}

export type Photo = {
  id: string
  title: string
  description: string
  width: number
  height: number
  sortOrder: number
  createdAt: string
  originalUrl: string
  thumbnailUrl: string
  exif?: PhotoExif
}

// Opaque bag returned as-is by the server. `links` is the one convention the
// UI reads (external streaming links); anything else just passes through.
export type MusicMetadata = {
  links?: Record<string, string>
  [key: string]: unknown
}

export type Track = {
  id: string
  title: string
  description: string
  durationSeconds: number | null
  albumId: string | null
  trackNumber: number | null
  sortOrder: number
  createdAt: string
  metadata: MusicMetadata
  audioUrl: string
  coverUrl: string | null
}

export type Album = {
  id: string
  title: string
  description: string
  sortOrder: number
  createdAt: string
  metadata: MusicMetadata
  coverUrl: string | null
  tracks: Track[]
}

export type MusicPayload = {
  albums: Album[]
  singles: Track[]
}

export type PostStatus = 'draft' | 'published'

export type Post = {
  id: string
  slug: string
  title: string
  excerpt: string
  contentMarkdown: string
  status: PostStatus
  createdAt: string
  updatedAt: string
  publishedAt: string | null
  coverUrl: string | null
}

// Thin shape returned by the public list endpoint (no contentMarkdown).
export type PostSummary = {
  title: string
  slug: string
  excerpt: string
  coverUrl: string | null
  publishedAt: string | null
}
