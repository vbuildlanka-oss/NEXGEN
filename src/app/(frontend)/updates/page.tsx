import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import Link from 'next/link'
import React from 'react'

import { Reveal } from '@/components/motion/Reveal'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { PageHeader } from '@/components/ui/PageHeader'
import { PostCard } from '@/components/ui/PostCard'
import { postCategories } from '@/collections/Posts'
import { asMedia } from '@/lib/media'
import { getPosts } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Updates',
  description:
    'News, artist and event announcements, collaborations, milestones and live recordings from NexGen.',
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

  const posts = await getPosts({ category: validCategory, draft })
  const [lead, ...rest] = posts

  return (
    <>
      <PageHeader
        eyebrow="Updates"
        heading="Everything new"
        standfirst="Announcements, collaborations, milestones and recordings — as they happen."
        image={asMedia(lead?.coverImage)}
      />

      <section className="section-pad">
        <div className="container-site">
          {/* Category filter. Plain links rather than JavaScript state, so each
              filter is a real, shareable, crawlable URL. */}
          <nav aria-label="Filter updates" className="mb-10 flex flex-wrap gap-2">
            <FilterPill href="/updates" active={!validCategory} label="Everything" />
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
            <div className="border border-hairline bg-surface p-10 text-center">
              <p className="font-display text-[1.75rem] text-chrome-bright uppercase">
                Nothing here yet
              </p>
              <p className="mt-3 text-chrome">
                {validCategory ? (
                  <>
                    No posts in this category so far —{' '}
                    <Link href="/updates" className="text-ember underline underline-offset-4">
                      see everything
                    </Link>
                    .
                  </>
                ) : (
                  'The first announcements are on their way.'
                )}
              </p>
            </div>
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
            Never miss an announcement
          </SplitHeading>
          <p className="mt-4 max-w-[52ch] text-chrome">
            Follow NexGen on social, or{' '}
            <Link href="/contact" className="text-ember underline underline-offset-4">
              drop us a message
            </Link>{' '}
            to join the mailing list.
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
