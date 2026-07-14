import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

// The one styled file input used across the admin forms. Extracted because
// the file:* pseudo-element class string was copied in seven places and had
// already been hand-edited once during the semantic-token sweep — exactly
// how copies drift. Callers pass layout (`w-full` / `flex-1`) via className.
export default function FileInput({
  className,
  ...props
}: ComponentProps<'input'>) {
  return (
    <input
      type="file"
      {...props}
      className={cn(
        'block text-sm text-muted-color file:mr-3 file:rounded-md file:border-0 file:bg-panel file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-color',
        className,
      )}
    />
  )
}
