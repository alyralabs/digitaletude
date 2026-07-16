'use client'
import { cn } from '@/lib/utils'
import type {
  CardBodyProps,
  CardCaptionProps,
  CardContentProps,
  CardFooterProps,
  CardHeaderProps,
  CardRootProps,
  CardSubtitleProps,
  CardTitleProps,
} from 'primereact/card'
import { Card as PRCard } from 'primereact/card'

function Card({ className, ...props }: CardRootProps) {
  return (
    <PRCard.Root
      className={cn(
        'flex flex-col rounded-xl bg-surface-0 dark:bg-surface-800 text-surface-700 dark:text-surface-0 shadow-md',
        className,
      )}
      {...props}
    />
  )
}

function CardHeader({ className, ...props }: CardHeaderProps) {
  return <PRCard.Header className={cn('', className)} {...props} />
}

function CardBody({ className, ...props }: CardBodyProps) {
  return (
    <PRCard.Body
      className={cn('p-5 flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function CardCaption({ className, ...props }: CardCaptionProps) {
  return (
    <PRCard.Caption
      className={cn('flex flex-col gap-2', className)}
      {...props}
    />
  )
}

function CardContent({ className, ...props }: CardContentProps) {
  return <PRCard.Content className={cn('', className)} {...props} />
}

function CardTitle({ className, ...props }: CardTitleProps) {
  return (
    <PRCard.Title className={cn('font-medium text-lg', className)} {...props} />
  )
}

function CardSubTitle({ className, ...props }: CardSubtitleProps) {
  return (
    <PRCard.Subtitle
      className={cn('text-surface-500 dark:text-surface-400', className)}
      {...props}
    />
  )
}

function CardFooter({ className, ...props }: CardFooterProps) {
  return <PRCard.Footer className={cn('', className)} {...props} />
}

export {
  Card,
  CardBody,
  CardCaption,
  CardContent,
  CardFooter,
  CardHeader,
  CardSubTitle,
  CardTitle,
}
