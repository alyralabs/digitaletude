import PageSection from '../components/PageSection'
import { placeholderImages, starWarsQuotes } from '../lib/placeholder'

const posts = [
  {
    title: 'Stay on Target',
    excerpt: starWarsQuotes.force,
    image: placeholderImages.gallery[0],
  },
  {
    title: 'Chewie, We\'re Home',
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
        <h1 className="text-4xl font-bold tracking-tight text-fg">Blog</h1>
        <p className="max-w-2xl text-lg text-muted">{starWarsQuotes.trench}</p>
      </div>

      <PageSection title="Recent Transmissions">
        <div className="grid gap-6 md:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.title}
              className="overflow-hidden rounded-xl border border-border bg-surface"
            >
              <img
                src={post.image}
                alt={post.title}
                className="h-44 w-full object-cover"
              />
              <div className="space-y-2 p-4">
                <h3 className="font-semibold text-fg">{post.title}</h3>
                <p className="text-sm text-muted leading-relaxed">
                  {post.excerpt}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>
    </div>
  )
}
