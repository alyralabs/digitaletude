import { useLoaderData } from 'react-router'
import PageSection from '../components/PageSection'
import { apiFetch } from '../lib/api'
import type { Photo } from '../lib/types'

export async function loader() {
  return apiFetch<Photo[]>('/api/photos')
}

export default function Photography() {
  const photos = useLoaderData<Photo[]>()

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight text-color">
        Photography
      </h1>

      <PageSection title="Gallery">
        {photos.length === 0 ? (
          <p className="text-muted-color">No photos yet.</p>
        ) : (
          // CSS-columns masonry: photos keep their real aspect ratio (no
          // aspect-square/object-cover crop) instead of the old fixed grid.
          // Each tile needs its own break-inside-avoid + margin — space-y/
          // row gap don't apply across column boundaries, only column-gap
          // (via `gap-4`) does. Column count steps up at wider breakpoints
          // per plans/04-styling.md, not just more padding around a fixed
          // count.
          <div className="columns-2 gap-4 sm:columns-3 lg:columns-4 xl:columns-5 2xl:columns-6">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="mb-4 block break-inside-avoid"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  width={photo.width}
                  height={photo.height}
                  className="w-full rounded-lg border border-surface"
                />
              </a>
            ))}
          </div>
        )}
      </PageSection>
    </div>
  )
}
