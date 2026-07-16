import { ChevronLeft } from '@primeicons/react/chevron-left'
import { ChevronRight } from '@primeicons/react/chevron-right'
import { Times } from '@primeicons/react/times'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogBackdrop,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogHeaderActions,
  DialogPopup,
  DialogPortal,
  DialogPositioner,
  DialogTitle,
} from '@/components/ui/dialog'
import ExifOverlay from './ExifOverlay'
import type { Photo } from '../lib/types'

export default function PhotoCarousel({
  photo,
  open,
  onClose,
  onPrev,
  onNext,
}: {
  photo: Photo
  open: boolean
  onClose: () => void
  onPrev: () => void
  onNext: () => void
}) {
  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        if (!e.value) onClose()
      }}
      draggable={false}
      dismissable
    >
      <DialogPortal>
        <DialogBackdrop />
        <DialogPositioner className="p-4">
          {/* Anchored to the positioner (viewport), not the popup: the popup
              resizes with each photo's aspect ratio, so popup-anchored arrows
              would jump around between photos. mousedown must not bubble to
              the positioner or the dismissable outside-click logic treats an
              arrow press as a close. */}
          <Button
            iconOnly
            rounded
            severity="secondary"
            aria-label="Previous photo"
            className="absolute top-1/2 left-3 z-10 -translate-y-1/2"
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
            onClick={onPrev}
          >
            <ChevronLeft />
          </Button>
          <Button
            iconOnly
            rounded
            severity="secondary"
            aria-label="Next photo"
            className="absolute top-1/2 right-3 z-10 -translate-y-1/2"
            onMouseDown={(e: React.MouseEvent) => e.stopPropagation()}
            onClick={onNext}
          >
            <ChevronRight />
          </Button>
          <DialogPopup className="max-h-[95vh] max-w-[95vw]">
            <DialogHeader>
              <DialogTitle className="truncate">{photo.title}</DialogTitle>
              <DialogHeaderActions>
                <DialogClose aria-label="Close">
                  <Times />
                </DialogClose>
              </DialogHeaderActions>
            </DialogHeader>
            <DialogContent>
              <div className="relative mx-auto w-fit">
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.title}
                  className="max-h-[80vh] max-w-full rounded-lg object-contain"
                />
                <ExifOverlay exif={photo.exif} />
              </div>
            </DialogContent>
            <DialogFooter className="items-center justify-center">
              <a
                href={photo.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View Original
              </a>
            </DialogFooter>
          </DialogPopup>
        </DialogPositioner>
      </DialogPortal>
    </Dialog>
  )
}
