import { Card, CardBody, CardCaption, CardTitle } from '@/components/ui/card'
import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

const posts = [
  {
    title: 'Stay on Target',
    excerpt: starWarsQuotes.force,
    image: placeholderImages.gallery[0],
  },
  {
    title: "Chewie, We're Home",
    excerpt: starWarsQuotes.falcon,
    image: placeholderImages.gallery[1],
  },
  {
    title: 'Rebellions Are Built on Hope',
    excerpt: starWarsQuotes.hope,
    image: placeholderImages.gallery[2],
  },
]

export default function Blog() {
  return (
    <div className="space-y-10">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight text-color">Blog</h1>
        <p className="max-w-2xl text-lg leading-relaxed text-muted-color">
          {starWarsQuotes.trench}
        </p>
      </div>

      <PageSection title="Recent Transmissions">
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <Card key={post.title} className="overflow-hidden">
              <img
                src={post.image}
                alt={post.title}
                className="h-44 w-full object-cover"
              />
              <CardBody>
                <CardCaption>
                  <CardTitle>{post.title}</CardTitle>
                </CardCaption>
                <p className="line-clamp-4 text-sm leading-relaxed text-muted-color">
                  {post.excerpt}
                </p>
              </CardBody>
            </Card>
          ))}
        </div>
      </PageSection>
    </div>
  )
}
