import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

export default function About() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-fg">About</h1>
        <p className="max-w-2xl text-lg text-muted">{starWarsQuotes.hope}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
        <img
          src={placeholderImages.portrait}
          alt="Starry night sky"
          className="w-full rounded-xl border border-border object-cover"
        />
        <PageSection title="Dossier">
          <p className="text-muted leading-relaxed">{starWarsQuotes.force}</p>
          <p className="text-muted leading-relaxed">{starWarsQuotes.trench}</p>
        </PageSection>
      </div>
    </div>
  )
}
