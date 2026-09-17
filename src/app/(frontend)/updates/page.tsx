import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import React from 'react'

import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { EmptyState } from '@/components/ui/EmptyState'
import { PageHeader } from '@/components/ui/PageHeader'
import { PostCard } from '@/components/ui/PostCard'
import { postCategories } from '@/collections/Posts'
import { UPDATES_PAGE_COPY } from '@/globals/pageCopy'
import { asMedia } from '@/lib/media'
import { getPosts, getUpdatesPage } from '@/lib/queries'

export const revalidate = 3600

/**
 * The wording this page ships with, shared with the global that makes it editable.
 *
 * Used for every field, so a cleared field, a global that has never been saved, or a
 * database read that fails all render real copy rather than a blank heading. Defined
 * in one place with the field defaults — see the note in globals/pageCopy.ts.
 */
const COPY = UPDATES_PAGE_COPY

export async function generateMetadata(): Promise<Metadata> {
  const page = await getUpdatesPage()

  return {
    title: page?.seo?.title || COPY.seo.title,
    description: page?.seo?.description || COPY.seo.description,
  }
}

type Search = { searchParams: Promise<{ category?: string }> }

export default async function UpdatesPage({ searchParams }: Search) {
  const { isEnabled: draft } = await draftMode()
  const { category } = await searchParams

  // Only accept a category the CMS actually knows about, so a hand-typed query
  // string cannot produce a confusing empty page.
  const validCategory = postCategories.some((option) => option.value === category)
    ? category
    : undefined

  const [posts, page] = await Promise.all([
    getPosts({ category: validCategory, draft }),
    getUpdatesPage({ draft }),
  ])

  const [lead, ...rest] = posts

  return (
    <>
      <PageHeader
        eyebrow={page?.intro?.eyebrow || COPY.intro.eyebrow}
        heading={page?.intro?.heading || COPY.intro.heading}
        standfirst={page?.intro?.standfirst || COPY.intro.standfirst}
        image={asMedia(page?.intro?.image) ?? asMedia(lead?.coverImage)}
      />

      <section className="section-pad">
        <div className="container-site">
          {/* Category filter. Plain links rather than JavaScript state, so each
              filter is a real, shareable, crawlable URL. */}
          <nav aria-label="Filter updates" className="mb-10 flex flex-wrap gap-2">
            <FilterPill
              href="/updates"
              active={!validCategory}
              label={page?.filters?.allLabel || COPY.filters.allLabel}
            />
            {postCategories.map((option) => (
              <FilterPill
                key={option.value}
                href={`/updates?category=${option.value}`}
                active={validCategory === option.value}
                label={option.label}
              />
            ))}
          </nav>

          {posts.length === 0 ? (
            /**
             * Filtering to an empty category is a different situation from having
             * published nothing at all, so it keeps its own wording and its own way
             * out. Only the genuinely-empty case is editable, because the filtered
             * case has to name the escape route precisely.
             */
            validCategory ? (
              <EmptyState
                heading={page?.empty?.heading || COPY.empty.heading}
                body="No posts in this category so far —"
                linkLabel="see everything"
                linkUrl="/updates"
              />
            ) : (
              <EmptyState
                heading={page?.empty?.heading || COPY.empty.heading}
                body={page?.empty?.body || COPY.empty.body}
                linkLabel={page?.empty?.linkLabel}
                linkUrl={page?.empty?.linkUrl}
              />
            )
          ) : (
            <div className="flex flex-col gap-6">
              {lead && (
                <Reveal>
                  <PostCard post={lead} featured />
                </Reveal>
              )}

              {rest.length > 0 && (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {rest.map((post, index) => (
                    <Reveal key={post.id} delay={Math.min(index, 6) * 0.05}>
                      <PostCard post={post} />
                    </Reveal>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <section className="border-t border-hairline bg-surface">
        <div className="container-site py-[clamp(3rem,7vw,5rem)]">
          <SplitHeading as="h2" className="type-4">
            {page?.outro?.heading || COPY.outro.heading}
          </SplitHeading>
          <p className="mt-4 max-w-[52ch] text-chrome">
            {page?.outro?.body || COPY.outro.body}{' '}
            <Link
              href={page?.outro?.linkUrl || COPY.outro.linkUrl}
              className="text-ember underline underline-offset-4"
            >
              {page?.outro?.linkLabel || COPY.outro.linkLabel}
            </Link>
          </p>
        </div>
      </section>
    </>
  )
}

const FilterPill: React.FC<{ href: string; active: boolean; label: string }> = ({
  href,
  active,
  label,
}) => (
  <Link
    href={href}
    aria-current={active ? 'true' : undefined}
    className={`rounded-[2px] border-2 px-4 py-2 font-display text-[1rem] uppercase transition-colors duration-200 ${
      active
        ? 'border-nexgen bg-nexgen text-ink'
        : 'border-hairline text-chrome hover:border-ember hover:text-ember'
    }`}
  >
    {label}
  </Link>
)
