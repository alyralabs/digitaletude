import ReactMarkdown from 'react-markdown'
import { Link, useLoaderData } from 'react-router'
import { Card, CardBody, CardCaption, CardTitle } from '@/components/ui/card'
import PageSection from '../components/PageSection'
import { formatDate } from '../lib/date'
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
            {posts.map((post, i) => (
              <Link key={post.slug} to={`/blog/${post.slug}`}>
                {/* Lift-on-hover is deliberately slight: shadow one step up
                    plus a half-unit rise — enough to register the hover
                    without the grid feeling springy. */}
                <Card className="overflow-hidden shadow-md transition-[box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                  {post.coverUrl && (
                    <img
                      src={post.coverUrl}
                      alt={post.title}
                      // First cover is the likely LCP — fetch it at full
                      // priority; everything below the fold waits.
                      fetchPriority={i === 0 ? 'high' : undefined}
                      loading={i === 0 ? undefined : 'lazy'}
                      decoding="async"
                      className="h-44 w-full object-cover"
                    />
                  )}
                  <CardBody>
                    <CardCaption>
                      <CardTitle>{post.title}</CardTitle>
                    </CardCaption>
                    {post.publishedAt && (
                      <p className="text-xs text-muted-color">
                        <time dateTime={post.publishedAt}>
                          {formatDate(post.publishedAt)}
                        </time>
                      </p>
                    )}
                    {/* Text-level markdown only: the card is already inside
                        a <Link>, so anchors are unwrapped to their text
                        (nested <a> is invalid HTML), and block furniture
                        (headings, images) degrades to plain text in a
                        4-line clamp. */}
                    <div className="line-clamp-4 text-sm leading-relaxed text-muted-color [&_code]:rounded [&_code]:bg-page [&_code]:px-1 [&_code]:text-xs">
                      <ReactMarkdown
                        allowedElements={['p', 'strong', 'em', 'del', 'code']}
                        unwrapDisallowed
                      >
                        {post.excerpt}
                      </ReactMarkdown>
                    </div>
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
