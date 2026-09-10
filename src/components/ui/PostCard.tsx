import Link from 'next/link'
import React from 'react'

import { ResponsiveImage } from '@/components/ui/ResponsiveImage'
import { postCategoryLabels } from '@/collections/Posts'
import { formatShortDate } from '@/lib/format'
import type { Post } from '@/payload-types'

type Props = {
  post: Post
  /** The first post in a list gets a wider, more prominent treatment. */
  featured?: boolean
}

export const PostCard: React.FC<Props> = ({ post, featured = false }) => {
  const category = postCategoryLabels[post.category ?? 'news'] ?? 'Update'
  const date = formatShortDate(post.publishedAt ?? post.createdAt)

  return (
    <article
      className={`chamfer group relative flex bg-surface ring-1 ring-inset ring-[color-mix(in_oklab,var(--color-chrome)_22%,transparent)] transition-all duration-300 hover:ring-nexgen ${
        featured ? 'flex-col lg:flex-row' : 'flex-col'
      }`}
    >
      <Link href={`/updates/${post.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">{post.title}</span>
      </Link>

      <div
        className={`relative overflow-hidden ${featured ? 'lg:w-[52%]' : ''}`}
        style={{ aspectRatio: featured ? '16 / 10' : '3 / 2' }}
      >
        {post.coverImage ? (
          <ResponsiveImage
            media={post.coverImage}
            sizes={featured ? '(max-width: 1100px) 92vw, 52vw' : '(max-width: 640px) 92vw, 30vw'}
            reserveSpace={false}
            className="h-full w-full object-cover transition-transform duration-700 ease-[var(--ease-out-quint)] group-hover:scale-[1.04]"
            alt={post.title}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-surface-raised">
            <span className="font-display text-[1.75rem] text-chrome-dim uppercase">NexGen</span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex items-center gap-3 text-[0.78rem] tracking-[0.14em] uppercase">
          <span className="text-nexgen">{category}</span>
          {date && <span className="text-chrome-dim">{date}</span>}
        </div>

        <h3
          className={featured ? 'text-[clamp(1.6rem,3vw,2.4rem)]' : 'text-[clamp(1.2rem,2vw,1.6rem)]'}
        >
          {post.title}
        </h3>

        {post.excerpt && (
          <p className={`text-chrome ${featured ? '' : 'text-small'}`}>{post.excerpt}</p>
        )}

        <div className="mt-auto flex items-center gap-4 pt-2">
          <span className="relative z-20 font-display text-[1.1rem] text-nexgen uppercase transition-colors group-hover:text-ember">
            Read →
          </span>
          {post.externalUrl && (
            <a
              href={post.externalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="relative z-20 font-display text-[1.1rem] text-chrome-bright uppercase underline underline-offset-4 transition-colors hover:text-ember"
            >
              Listen
            </a>
          )}
        </div>
      </div>
    </article>
  )
}
