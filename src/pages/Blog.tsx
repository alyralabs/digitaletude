import { Link, useLoaderData } from 'react-router'
import { Card, CardBody, CardCaption, CardTitle } from '@/components/ui/card'
import PageSection from '../components/PageSection'
import type { PostSummary } from '../lib/types'

export default function Blog() {
  const posts = useLoaderData<PostSummary[]>()

  return (
    <div className="space-y-10">
      <h1 className="text-4xl font-bold tracking-tight text-color">Blog</h1>

      <PageSection title="Recent Posts">
        {posts.length === 0 ? (
          <p className="text-muted-color">No posts yet.</p>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
            {posts.map((post) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                <Card className="overflow-hidden">
                  {post.coverUrl && (
                    <img
                      src={post.coverUrl}
                      alt={post.title}
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <CardBody>
                    <CardCaption>
                      <CardTitle>{post.title}</CardTitle>
                    </CardCaption>
                    <p className="line-clamp-4 text-sm leading-relaxed text-muted-color">
                      {post.excerpt}
                    </p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </PageSection>
    </div>
  )
}
