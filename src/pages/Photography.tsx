import { useLoaderData } from 'react-router'
import PageSection from '../components/PageSection'
import { apiFetch } from '../lib/api'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'
import type { Photo } from '../lib/types'

export async function loader() {
  return apiFetch<Photo[]>('/api/photos')
}

export default function Photography() {
  const photos = useLoaderData<Photo[]>()

  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-color">
          Photography
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-color">
          {starWarsQuotes.trench}
        </p>
      </div>

      <img
        src={placeholderImages.landscape}
        alt="Snow-capped mountains above the clouds"
        className="w-full rounded-xl border border-surface object-cover"
      />

      <PageSection title="Gallery">
        {photos.length === 0 ? (
          <p className="text-muted-color">No photos yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {photos.map((photo) => (
              <a
                key={photo.id}
                href={photo.originalUrl}
                target="_blank"
                rel="noreferrer"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  width={photo.width}
                  height={photo.height}
                  className="aspect-square w-full rounded-lg border border-surface object-cover"
                />
              </a>
            ))}
          </div>
        )}
      </PageSection>
    </div>
  )
}
