import { cn as primeuixCn } from '@primeuix/utils'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: Parameters<typeof primeuixCn>) {
  return twMerge(primeuixCn(...inputs))
}
