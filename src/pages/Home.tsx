import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

export default function Home() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-color">Home</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-color">
          {starWarsQuotes.force}
        </p>
      </div>

      <img
        src={placeholderImages.hero}
        alt="Milky Way over a dark landscape"
        className="w-full rounded-xl border border-surface object-cover"
      />

      <PageSection title="Transmission from the Outer Rim">
        <p className="leading-relaxed text-muted-color">
          {starWarsQuotes.falcon}
        </p>
        <blockquote className="rounded-lg border-l-4 border-primary bg-surface-0 p-6 leading-relaxed text-muted-color dark:bg-surface-900">
          {starWarsQuotes.hope}
          <footer className="mt-3 text-sm italic">
            — Intercepted rebel transmission
          </footer>
        </blockquote>
      </PageSection>
    </div>
  )
}
