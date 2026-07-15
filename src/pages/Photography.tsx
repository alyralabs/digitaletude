import { useEffect, useState } from 'react'
import { useLoaderData } from 'react-router'
import PhotoCarousel from '../components/PhotoCarousel'
import type { Photo } from '../lib/types'

export default function Photography() {
  const photos = useLoaderData<Photo[]>()
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  useEffect(() => {
    if (openIndex === null || photos.length === 0) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        setOpenIndex((i) =>
          i === null ? i : (i - 1 + photos.length) % photos.length,
        )
      } else if (e.key === 'ArrowRight') {
        setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length))
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [openIndex, photos.length])

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight text-color">
        Photography
      </h1>

      {photos.length === 0 ? (
        <p className="text-muted-color">No photos yet.</p>
      ) : (
        <>
          {/* CSS-columns masonry: photos keep their real aspect ratio (no
              aspect-square/object-cover crop) instead of the old fixed grid.
              Each tile needs its own break-inside-avoid + margin — space-y/
              row gap don't apply across column boundaries, only column-gap
              (via `gap-4`) does. Column count steps up at wider breakpoints
              per plans/04-styling.md, not just more padding around a fixed
              count. */}
          <div className="columns-2 gap-4 lg:columns-3 xl:columns-4 2xl:columns-5">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                onClick={() => setOpenIndex(i)}
                className="relative mb-4 block w-full cursor-pointer break-inside-avoid text-left"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  width={photo.width}
                  height={photo.height}
                  className="w-full rounded-lg border border-surface"
                />
              </button>
            ))}
          </div>

          {/* Mounted only while open: the Dialog primitive's exit fade relies
              on a real transitionend event to know when to stop rendering,
              which never fires in jsdom (no CSS engine) — keeping it mounted
              through `open` alone would leave it stuck in the DOM in tests.
              Unmounting directly on close is instant (no fade) but correct
              and deterministic everywhere. */}
          {openIndex !== null && (
            <PhotoCarousel
              photo={photos[openIndex]}
              open
              onClose={() => setOpenIndex(null)}
              onPrev={() =>
                setOpenIndex((i) =>
                  i === null ? i : (i - 1 + photos.length) % photos.length,
                )
              }
              onNext={() =>
                setOpenIndex((i) => (i === null ? i : (i + 1) % photos.length))
              }
            />
          )}
        </>
      )}
    </div>
  )
}
