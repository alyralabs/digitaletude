import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

export default function Photography() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-fg">
          Photography
        </h1>
        <p className="max-w-2xl text-lg text-muted">{starWarsQuotes.trench}</p>
      </div>

      <img
        src={placeholderImages.landscape}
        alt="Snow-capped mountains above the clouds"
        className="w-full rounded-xl border border-border object-cover"
      />

      <PageSection title="Gallery">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {placeholderImages.gallery.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Space and landscape placeholder ${index + 1}`}
              className="aspect-square w-full rounded-lg border border-border object-cover"
            />
          ))}
        </div>
      </PageSection>
    </div>
  )
}
