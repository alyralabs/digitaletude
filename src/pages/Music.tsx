import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

export default function Music() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-fg">Music</h1>
        <p className="max-w-2xl text-lg text-muted">{starWarsQuotes.falcon}</p>
      </div>

      <img
        src={placeholderImages.wide}
        alt="City lights at night"
        className="w-full rounded-xl border border-border object-cover"
      />

      <PageSection title="Cantina Sessions">
        <p className="text-muted leading-relaxed">{starWarsQuotes.force}</p>
        <div className="flex items-center gap-6">
          <img
            src={placeholderImages.square}
            alt="Nebula in deep space"
            className="h-40 w-40 shrink-0 rounded-lg border border-border object-cover"
          />
          <p className="text-muted leading-relaxed">{starWarsQuotes.hope}</p>
        </div>
      </PageSection>
    </div>
  )
}
