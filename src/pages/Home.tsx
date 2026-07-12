import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

export default function Home() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-fg">Home</h1>
        <p className="max-w-2xl text-lg text-muted">{starWarsQuotes.force}</p>
      </div>

      <img
        src={placeholderImages.hero}
        alt="Milky Way over a dark landscape"
        className="w-full rounded-xl border border-border object-cover"
      />

      <PageSection title="Transmission from the Outer Rim">
        <p className="text-muted leading-relaxed">{starWarsQuotes.falcon}</p>
        <p className="text-muted leading-relaxed">{starWarsQuotes.hope}</p>
      </PageSection>
    </div>
  )
}
