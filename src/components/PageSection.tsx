import type { ReactNode } from 'react'

type PageSectionProps = {
  title: string
  children: ReactNode
}

export default function PageSection({ title, children }: PageSectionProps) {
  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-color">{title}</h2>
      {children}
    </section>
  )
}
