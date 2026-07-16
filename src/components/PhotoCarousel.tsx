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
          <DialogPopup className="max-h-[95vh] max-w-[95vw]">
            {/* Anchored to the popup so the arrows hug the photo instead of
                hiding at the viewport edges; they ride along as the popup
                resizes per photo. shadow-lg lifts them off busy images. */}
            <Button
              iconOnly
              rounded
              size="large"
              severity="secondary"
              aria-label="Previous photo"
              className="absolute top-1/2 left-2 z-10 -translate-y-1/2 shadow-lg"
              onClick={onPrev}
            >
              <ChevronLeft />
            </Button>
            <Button
              iconOnly
              rounded
              size="large"
              severity="secondary"
              aria-label="Next photo"
              className="absolute top-1/2 right-2 z-10 -translate-y-1/2 shadow-lg"
              onClick={onNext}
            >
              <ChevronRight />
            </Button>
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
