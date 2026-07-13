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
