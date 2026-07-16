'use client'

import { cn } from '@/lib/utils'
import { Tooltip as PRTooltip } from 'primereact/tooltip'
import type {
  TooltipArrowProps,
  TooltipManagerProps,
  TooltipPopupProps,
  TooltipPortalProps,
  TooltipPositionerProps,
  TooltipRootProps,
  TooltipTriggerProps,
} from 'primereact/tooltip'

function Tooltip({ ...props }: TooltipRootProps) {
  return <PRTooltip.Root {...props} />
}

function TooltipManager({ ...props }: TooltipManagerProps) {
  return <PRTooltip.Manager {...props} />
}

function TooltipTrigger({ ...props }: TooltipTriggerProps) {
  return <PRTooltip.Trigger {...props} />
}

function TooltipPortal({ ...props }: TooltipPortalProps) {
  return <PRTooltip.Portal {...props} />
}

function TooltipPositioner({ ...props }: TooltipPositionerProps) {
  return <PRTooltip.Positioner {...props} />
}

function TooltipPopup({ className, ...props }: TooltipPopupProps) {
  return (
    <PRTooltip.Popup
      className={cn(
        `relative
                bg-surface-700 text-surface-0
                rounded-md max-w-50
                shadow-md
                py-1.5 px-2.5 text-xs
                opacity-100 scale-100
                data-enter-from:opacity-0 data-enter-from:scale-[0.93]
                data-leave-to:opacity-0 data-leave-to:scale-[0.93]
                transition-[opacity,scale] duration-250 ease-[cubic-bezier(0.16,1,0.3,1)]
                origin-(--px-transform-origin)
                data-instant:duration-0`,
        className,
      )}
      {...props}
    />
  )
}

function TooltipArrow({ className, ...props }: TooltipArrowProps) {
  return (
    <PRTooltip.Arrow
      className={cn(
        `absolute bg-surface-700 size-2 rounded-bl-[3px]
                [clip-path:polygon(0_100%,0_0,100%_100%)]
                data-[side=top]:-bottom-1 data-[side=top]:left-(--px-placer-arrow-x) data-[side=top]:-translate-x-1/2 data-[side=top]:-rotate-45
                data-[side=bottom]:-top-1 data-[side=bottom]:left-(--px-placer-arrow-x) data-[side=bottom]:-translate-x-1/2 data-[side=bottom]:rotate-135
                data-[side=left]:-right-1 data-[side=left]:top-(--px-placer-arrow-y) data-[side=left]:-translate-y-1/2 data-[side=left]:-rotate-135
                data-[side=right]:-left-1 data-[side=right]:top-(--px-placer-arrow-y) data-[side=right]:-translate-y-1/2 data-[side=right]:rotate-45`,
        className,
      )}
      {...props}
    />
  )
}

export {
  Tooltip,
  TooltipArrow,
  TooltipManager,
  TooltipPopup,
  TooltipPortal,
  TooltipPositioner,
  TooltipTrigger,
}
