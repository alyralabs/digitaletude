// Public reads go straight to Supabase's PostgREST API with the anon key —
// there is no deployed backend. RLS policies (migration 0005 in the API
// repo) restrict anon to reads, and to published posts only. Column aliases
// in the select strings map snake_case DB columns onto the camelCase types
// in ./types, and storage URLs are composed here (the DB stores paths).
import type { MusicPayload, Photo, Post, PostSummary, Track } from './types'

function supabaseUrl(): string {
  const url = import.meta.env.VITE_SUPABASE_URL
  if (!url) throw new Error('VITE_SUPABASE_URL is not set')
  return url
}

function anonKey(): string {
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY
  if (!key) throw new Error('VITE_SUPABASE_ANON_KEY is not set')
  return key
}

async function rest<T>(pathAndQuery: string): Promise<T> {
  const key = anonKey()
  const res = await fetch(`${supabaseUrl()}/rest/v1/${pathAndQuery}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  })
  if (!res.ok) {
    throw new Error(`content request failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

function publicUrl(bucket: string, path: string): string {
  return `${supabaseUrl()}/storage/v1/object/public/${bucket}/${path}`
}

type PhotoRow = Omit<Photo, 'originalUrl' | 'thumbnailUrl'> & {
  storagePath: string
  thumbnailPath: string
}

const photoCols =
  'id,title,description,width,height,sortOrder:sort_order,createdAt:created_at,exif,storagePath:storage_path,thumbnailPath:thumbnail_path'

export async function fetchPhotos(): Promise<Photo[]> {
  const rows = await rest<PhotoRow[]>(
    `photos?select=${photoCols}&order=sort_order.asc,created_at.desc`,
  )
  return rows.map(({ storagePath, thumbnailPath, ...photo }) => ({
    ...photo,
    originalUrl: publicUrl('photography', storagePath),
    thumbnailUrl: publicUrl('photography', thumbnailPath),
  }))
}

type TrackRow = Omit<Track, 'audioUrl' | 'coverUrl'> & {
  storagePath: string
  coverImagePath: string | null
}

type AlbumRow = {
  id: string
  title: string
  description: string
  sortOrder: number
  createdAt: string
  metadata: Track['metadata'] | null
  coverImagePath: string | null
  tracks: TrackRow[]
}

const trackCols =
  'id,title,description,durationSeconds:duration_seconds,albumId:album_id,trackNumber:track_number,sortOrder:sort_order,createdAt:created_at,metadata,storagePath:storage_path,coverImagePath:cover_image_path'

const trackOrder = 'track_number.asc,sort_order.asc,created_at.desc'

function toTrack({ storagePath, coverImagePath, ...track }: TrackRow): Track {
  return {
    ...track,
    metadata: track.metadata ?? {},
    audioUrl: publicUrl('music', storagePath),
    coverUrl: coverImagePath ? publicUrl('music', coverImagePath) : null,
  }
}

export async function fetchMusic(): Promise<MusicPayload> {
  const [albumRows, singleRows] = await Promise.all([
    rest<AlbumRow[]>(
      `albums?select=id,title,description,sortOrder:sort_order,createdAt:created_at,metadata,coverImagePath:cover_image_path,tracks(${trackCols})&order=sort_order.asc,created_at.desc&tracks.order=${trackOrder}`,
    ),
    rest<TrackRow[]>(
      `tracks?album_id=is.null&select=${trackCols}&order=${trackOrder}`,
    ),
  ])

  return {
    albums: albumRows.map(({ coverImagePath, tracks, ...album }) => ({
      ...album,
      metadata: album.metadata ?? {},
      coverUrl: coverImagePath ? publicUrl('music', coverImagePath) : null,
      tracks: tracks.map(toTrack),
    })),
    singles: singleRows.map(toTrack),
  }
}

type PostSummaryRow = {
  title: string
  slug: string
  excerpt: string
  coverImagePath: string | null
  publishedAt: string | null
}

// No content_markdown here: the publish step (Repo.Publish in the API repo)
// derives and stores an excerpt when the author left it blank, so the list
// payload no longer grows with every post body ever written.
export async function fetchPosts(): Promise<PostSummary[]> {
  const rows = await rest<PostSummaryRow[]>(
    'posts?status=eq.published&select=title,slug,excerpt,coverImagePath:cover_image_path,publishedAt:published_at&order=published_at.desc',
  )
  return rows.map(({ coverImagePath, ...post }) => ({
    ...post,
    coverUrl: coverImagePath ? publicUrl('blog', coverImagePath) : null,
  }))
}

type PostRow = Omit<Post, 'coverUrl'> & { coverImagePath: string | null }

export async function fetchPostBySlug(slug: string): Promise<Post | null> {
  const rows = await rest<PostRow[]>(
    `posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=id,slug,title,excerpt,contentMarkdown:content_markdown,status,createdAt:created_at,updatedAt:updated_at,publishedAt:published_at,coverImagePath:cover_image_path&limit=1`,
  )
  if (rows.length === 0) return null
  const { coverImagePath, ...post } = rows[0]
  return {
    ...post,
    coverUrl: coverImagePath ? publicUrl('blog', coverImagePath) : null,
  }
}
