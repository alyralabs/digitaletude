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
        <DialogPositioner>
          <DialogPopup className="max-h-[90vh] max-w-[90vw]">
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
                  className="max-h-[70vh] max-w-full rounded-lg object-contain"
                />
                <ExifOverlay exif={photo.exif} />
              </div>
            </DialogContent>
            <DialogFooter className="items-center justify-between">
              <Button
                iconOnly
                rounded
                variant="text"
                severity="secondary"
                aria-label="Previous photo"
                onClick={onPrev}
              >
                <ChevronLeft />
              </Button>
              <a
                href={photo.originalUrl}
                target="_blank"
                rel="noreferrer"
                className="text-sm font-medium text-primary hover:underline"
              >
                View Original
              </a>
              <Button
                iconOnly
                rounded
                variant="text"
                severity="secondary"
                aria-label="Next photo"
                onClick={onNext}
              >
                <ChevronRight />
              </Button>
            </DialogFooter>
          </DialogPopup>
        </DialogPositioner>
      </DialogPortal>
    </Dialog>
  )
}
