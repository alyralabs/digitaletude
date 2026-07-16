import { Suspense, use, useEffect, useState } from 'react'
import { useLoaderData } from 'react-router'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  useSortable,
  type SortingStrategy,
} from '@dnd-kit/sortable'
import PhotoCarousel from '../components/PhotoCarousel'
import type { Photo } from '../lib/types'

export default function Photography() {
  const { photos } = useLoaderData<{ photos: Promise<Photo[]> }>()

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight text-color">
        Photography
      </h1>

      <Suspense fallback={<GallerySkeleton />}>
        <Gallery photosPromise={photos} />
      </Suspense>
    </div>
  )
}

// Varied heights so the placeholder reads as a masonry of photos, not a
// uniform grid; the sequence repeats but neighbors never match.
const SKELETON_HEIGHTS = [
  'h-64',
  'h-44',
  'h-56',
  'h-72',
  'h-48',
  'h-60',
  'h-40',
  'h-64',
  'h-52',
  'h-44',
]

function GallerySkeleton() {
  return (
    <div
      aria-hidden
      className="columns-2 gap-4 lg:columns-3 xl:columns-4 2xl:columns-5"
    >
      {SKELETON_HEIGHTS.map((height, i) => (
        <div
          key={i}
          className={`mb-4 ${height} animate-pulse break-inside-avoid rounded-lg border border-surface bg-panel`}
        />
      ))}
    </div>
  )
}

// Sortable transforms assume list/grid geometry and misplace tiles in a
// CSS-columns masonry — reordering the array on drag-over and letting the
// columns reflow is the actual animation here.
const noTransforms: SortingStrategy = () => null

function Gallery({ photosPromise }: { photosPromise: Promise<Photo[]> }) {
  const loaded = use(photosPromise)
  // Visitor-rearranged order ("just for fun") — purely client-side and
  // ephemeral; a refresh restores the server order.
  const [reordered, setReordered] = useState<Photo[] | null>(null)
  const photos = reordered ?? loaded
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  const [activePhoto, setActivePhoto] = useState<Photo | null>(null)

  // A plain click still opens the carousel: mouse drags only start after
  // 8px of travel, touch drags after a hold (so page scroll keeps working
  // on photo tiles).
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 250, tolerance: 8 },
    }),
  )

  function onDragStart(e: DragStartEvent) {
    setActivePhoto(photos.find((p) => p.id === e.active.id) ?? null)
  }

  function onDragOver(e: DragOverEvent) {
    if (!e.over || e.over.id === e.active.id) return
    const from = photos.findIndex((p) => p.id === e.active.id)
    const to = photos.findIndex((p) => p.id === e.over!.id)
    if (from === -1 || to === -1) return
    setReordered(arrayMove(photos, from, to))
  }

  // Warm the browser cache for the carousel's neighbors so prev/next is
  // instant instead of waiting on the network mid-browse.
  useEffect(() => {
    if (openIndex === null || photos.length < 2) return
    for (const offset of [1, -1]) {
      const neighbor =
        photos[(openIndex + offset + photos.length) % photos.length]
      new Image().src = neighbor.thumbnailUrl
    }
  }, [openIndex, photos])

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

  if (photos.length === 0) {
    return <p className="text-muted-color">No photos yet.</p>
  }

  return (
    <>
      {/* CSS-columns masonry: photos keep their real aspect ratio (no
          aspect-square/object-cover crop) instead of the old fixed grid.
          Each tile needs its own break-inside-avoid + margin — space-y/
          row gap don't apply across column boundaries, only column-gap
          (via `gap-4`) does. Column count steps up at wider breakpoints
          per plans/04-styling.md, not just more padding around a fixed
          count. */}
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDragEnd={() => setActivePhoto(null)}
        onDragCancel={() => setActivePhoto(null)}
      >
        <SortableContext
          items={photos.map((p) => p.id)}
          strategy={noTransforms}
        >
          <div className="columns-2 gap-4 lg:columns-3 xl:columns-4 2xl:columns-5">
            {photos.map((photo, i) => (
              <GalleryTile
                key={photo.id}
                photo={photo}
                index={i}
                onOpen={() => setOpenIndex(i)}
              />
            ))}
          </div>
        </SortableContext>
        {/* Floating copy of the grabbed photo; the in-grid tile dims while
            its slot moves around under the cursor. */}
        <DragOverlay>
          {activePhoto && (
            <img
              src={activePhoto.thumbnailUrl}
              alt={activePhoto.title}
              width={activePhoto.width}
              height={activePhoto.height}
              className="w-full rounded-lg border border-surface shadow-lg"
            />
          )}
        </DragOverlay>
      </DndContext>

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
  )
}

function GalleryTile({
  photo,
  index,
  onOpen,
}: {
  photo: Photo
  index: number
  onOpen: () => void
}) {
  const { setNodeRef, attributes, listeners, isDragging } = useSortable({
    id: photo.id,
  })
  return (
    <button
      ref={setNodeRef}
      type="button"
      onClick={onOpen}
      {...attributes}
      {...listeners}
      className={`relative mb-4 block w-full cursor-pointer touch-manipulation break-inside-avoid text-left ${
        isDragging ? 'opacity-40' : ''
      }`}
    >
      <img
        src={photo.thumbnailUrl}
        alt={photo.title}
        width={photo.width}
        height={photo.height}
        // lazy defers offscreen thumbnails (in-viewport ones still
        // load immediately once layout is known); the first DOM
        // image tops the left column and is the likely LCP.
        fetchPriority={index === 0 ? 'high' : undefined}
        loading={index === 0 ? undefined : 'lazy'}
        decoding="async"
        className="w-full rounded-lg border border-surface"
      />
    </button>
  )
}
