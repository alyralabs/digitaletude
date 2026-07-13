import { Play } from '@primeicons/react/play'
import { Button } from '@/components/ui/button'
import { Card, CardBody } from '@/components/ui/card'
import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

export default function Music() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-color">Music</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-color">
          {starWarsQuotes.falcon}
        </p>
      </div>

      <img
        src={placeholderImages.wide}
        alt="City lights at night"
        className="w-full rounded-xl border border-surface object-cover"
      />

      <PageSection title="Cantina Sessions">
        <p className="leading-relaxed text-muted-color">
          {starWarsQuotes.force}
        </p>
        <Card>
          <CardBody>
            <div className="flex items-start gap-6">
              <img
                src={placeholderImages.square}
                alt="Nebula in deep space"
                className="size-40 shrink-0 rounded-lg object-cover"
              />
              <div className="flex flex-col items-start gap-3">
                <Button rounded iconOnly aria-label="Play">
                  <Play />
                </Button>
                <p className="leading-relaxed text-muted-color">
                  {starWarsQuotes.hope}
                </p>
              </div>
            </div>
          </CardBody>
        </Card>
      </PageSection>
    </div>
  )
}
