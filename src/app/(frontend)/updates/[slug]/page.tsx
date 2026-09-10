import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { Button } from '@/components/ui/Button'
import { PageHeader } from '@/components/ui/PageHeader'
import { PostCard } from '@/components/ui/PostCard'
import { RichText } from '@/components/ui/RichText'
import { postCategoryLabels } from '@/collections/Posts'
import { formatEventDate, formatShortDate } from '@/lib/format'
import { asMedia, pickSrc } from '@/lib/media'
import { getPostBySlug, getPostSlugs, getPosts } from '@/lib/queries'

export const revalidate = 3600

type Params = { params: Promise<{ slug: string }> }

export async function generateStaticParams() {
  const slugs = await getPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post) return { title: 'Update not found' }

  const image = pickSrc(asMedia(post.coverImage))

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: 'article',
      publishedTime: post.publishedAt ?? undefined,
      ...(image ? { images: [{ url: image }] } : {}),
    },
  }
}

export default async function PostPage({ params }: Params) {
  const { slug } = await params
  const { isEnabled: draft } = await draftMode()

  const post = await getPostBySlug(slug, { draft })
  if (!post) notFound()

  // Other posts in the same category make the most useful "read next".
  const related = (await getPosts({ category: post.category ?? undefined, limit: 4, draft }))
    .filter((other) => other.id !== post.id)
    .slice(0, 3)

  const category = postCategoryLabels[post.category ?? 'news'] ?? 'Update'
  const relatedEvent = typeof post.relatedEvent === 'object' ? post.relatedEvent : null

  return (
    <>
      <PageHeader eyebrow={category} heading={post.title} image={asMedia(post.coverImage)}>
        <p className="mt-6 text-small tracking-[0.14em] text-chrome uppercase">
          {formatShortDate(post.publishedAt ?? post.createdAt)}
        </p>
      </PageHeader>

      <article className="section-pad">
        <div className="container-site grid gap-[clamp(2rem,5vw,4rem)] lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
          <div>
            {post.excerpt && (
              <p className="mb-8 border-l-[3px] border-nexgen pl-5 text-body-lg text-chrome-bright">
                {post.excerpt}
              </p>
            )}

            <Reveal>
              <RichText data={post.body as never} />
            </Reveal>

            {post.externalUrl && (
              <div className="mt-10">
                <Button href={post.externalUrl} size="lg">
                  Listen / watch
                </Button>
              </div>
            )}
          </div>

          <aside className="flex flex-col gap-6">
            {relatedEvent && (
              <div className="border border-hairline bg-surface p-6">
                <p className="eyebrow mb-3">Linked event</p>
                <h2 className="text-[1.5rem]">{relatedEvent.title}</h2>
                <p className="mt-2 text-small text-chrome">
                  {formatEventDate(relatedEvent.startsAt)} · {relatedEvent.venue}
                </p>
                <Link
                  href={`/events/${relatedEvent.slug}`}
                  className="mt-4 inline-block font-display text-[1.1rem] text-nexgen uppercase transition-colors hover:text-ember"
                >
                  Event details →
                </Link>
              </div>
            )}

            <div className="border border-hairline p-6">
              <p className="eyebrow mb-3">Category</p>
              <Link
                href={`/updates?category=${post.category}`}
                className="font-display text-[1.4rem] text-chrome-bright uppercase transition-colors hover:text-ember"
              >
                {category}
              </Link>
            </div>
          </aside>
        </div>
      </article>

      {related.length > 0 && (
        <section className="section-pad border-t border-hairline bg-surface">
          <div className="container-site">
            <SplitHeading as="h2" className="mb-10 text-[clamp(1.7rem,3.4vw,2.5rem)]">
              {`More ${category.toLowerCase()}`}
            </SplitHeading>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {related.map((other, index) => (
                <Reveal key={other.id} delay={index * 0.06}>
                  <PostCard post={other} />
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  )
}
