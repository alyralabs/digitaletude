import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import type { SliderRootProps } from 'primereact/slider'
import { Slider as PRSlider } from 'primereact/slider'

function Slider({
  className,
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  ...props
}: SliderRootProps) {
  const handleCount = useMemo(() => {
    const val = value ?? defaultValue
    if (val === undefined) return 1
    return Array.isArray(val) ? val.length : 1
  }, [value, defaultValue])

  return (
    <PRSlider.Root
      value={value}
      defaultValue={defaultValue}
      min={min}
      max={max}
      className={cn(
        'flex items-center justify-center data-[orientation=horizontal]:h-5 data-[orientation=vertical]:flex-col data-[orientation=vertical]:w-5',
        className,
      )}
      {...props}
    >
      <PRSlider.Track
        className="relative rounded-md bg-surface-200 dark:bg-surface-700
          data-[orientation=horizontal]:h-0.75
          data-[orientation=vertical]:w-0.75 data-[orientation=vertical]:min-h-25"
      >
        <PRSlider.Range
          className="block rounded-md bg-primary
            data-[orientation=horizontal]:h-full
            data-[orientation=vertical]:w-full"
        />
      </PRSlider.Track>

      {Array.from({ length: handleCount }, (_, index) => (
        <PRSlider.Handle
          key={index}
          index={index}
          data-slot="slider-handle"
          className="flex size-5 cursor-grab touch-none items-center justify-center rounded-full
            bg-surface-200 transition-colors duration-200 dark:bg-surface-700
            has-focus-visible:outline-1 has-focus-visible:outline-offset-2 has-focus-visible:outline-primary
            before:block before:size-4 before:rounded-full before:bg-surface-0
            before:shadow-[0_0.5px_0_0_rgba(0,0,0,0.08),0_1px_1px_0_rgba(0,0,0,0.14)]
            before:transition-colors before:duration-200 dark:before:bg-surface-950
            data-disabled:pointer-events-none data-disabled:cursor-not-allowed"
        />
      ))}
    </PRSlider.Root>
  )
}

export { Slider }
