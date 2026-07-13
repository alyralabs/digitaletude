import { Tag } from '@/components/ui/tag'
import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

export default function About() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-color">About</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-color">
          {starWarsQuotes.hope}
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <img
          src={placeholderImages.portrait}
          alt="Starry night sky"
          className="w-full rounded-xl border border-surface object-cover"
        />
        <PageSection title="Dossier">
          <div className="flex flex-wrap gap-2">
            <Tag rounded>Photography</Tag>
            <Tag rounded>Music</Tag>
            <Tag rounded>Writing</Tag>
          </div>
          <p className="leading-relaxed text-muted-color">
            {starWarsQuotes.force}
          </p>
          <p className="leading-relaxed text-muted-color">
            {starWarsQuotes.trench}
          </p>
        </PageSection>
      </div>
    </div>
  )
}
