# NexGen Entertainment — Build Plan

Status: **awaiting sign-off before code is written.**

---

## 1. What I found on lollapalooza.com (actual technique, not guesswork)

I pulled the live page + its compiled stylesheet and read the animation source. The reference site is a Webflow build with hand-written GSAP. The relevant facts:

**Libraries in use**

| Library | Version on reference site | What it drives |
|---|---|---|
| GSAP + ScrollTrigger | 3.12.3 | every scroll-linked animation |
| SplitType | 0.3.4 | per-line / per-char heading reveals |
| Swiper | 11 | hero lineup carousel |
| imagesLoaded | 5.0.0 | `ScrollTrigger.refresh()` after images settle |

**Design tokens (from their CSS `:root`)**

- Headings: `Anton 400`, `text-transform: uppercase`, `font-weight: 400`, `line-height: 110%`
- Body: `Golos Text`
- Type scale as CSS variables with explicit mobile twins — `--font-size--h1: 3.875rem` / `--font-size--h1-mob: 2.875rem`, down to `--font-size--text-regular: 1.13rem`
- `--border-radius--cards: 2px`, `--border-radius--images: 2px` — hard, near-square corners
- Buttons: `--button--font-size: 1.75rem`, `2px` border, `2px` radius, `.75rem/1rem` padding
- Dark base (`#17120f`) + one loud accent (`#32c3e2` teal), off-white `#f6f6f6`. Exactly the structure our 4-colour palette maps onto.

**The video section transform** (`.pillars_video`) — it is scroll-scrubbed, `scrub: 1`, and animates four properties on one timeline: `rotateX → 0`, wrapper `width: 60% → 100%`, `borderRadius → .75rem`, `height → 100%`. The card sits in a `perspective(1266px)` context and uses a `padding-top: 60%` aspect box. So the "hero video" move is a **tilted card un-tilting and growing to full-bleed**. Our brief wants the inverse direction (full-screen → shrink as nav appears); same technique, timeline reversed.

**The 7-panel photo canvas** — this is the part worth documenting precisely, because it is *not* a cross-fade:

```
.pillars_wrapper                         (position: relative — the scroll track)
├── .pillars_slider                      (position: sticky; top: 84px; height: 100vh)
│   ├── .pillars_slides-wrap.is-large-img    (absolute, inset 0, 100vh)
│   │   └── one <img> per panel, object-fit: cover, stacked
│   └── .pillars_slides-wrap.is-text         (absolute, centred)
│       ├── .pillar_slide-central-img        (foreground photo, 26.5rem × 22rem box, aspect-ratio 1.4)
│       ├── .pillars_slide-heading-wrap      (coloured block behind the h3)
│       └── .pillars_heading-decor           (torn-paper SVG, fill matches the block colour)
└── .pillars_slides-trigger-wrap         (top: -200%)
    └── .pillars_slides-trigger × N      (height: 100vh each; :first-child 0; :last-child 130vh)
```

Each panel gets an **invisible 100vh trigger div**. `ScrollTrigger.create({ start: 'top 30%', end: 'top 0%' })` on each trigger fires `onEnter` / `onLeaveBack`, and each of those builds a GSAP timeline that runs the outgoing and incoming panel simultaneously at position `0`:

- background image: `y: 110% → 0%` **and** `width: 80% → 100%` (outgoing goes `y: -110%`, back to `width: 80%`) — a vertical reel wipe where the image also narrows as it leaves
- foreground photo: `scale/opacity: 0 → 1` (outgoing `→ 0`), `duration: .6`
- heading: SplitType lines, each masked by `.overflow-hidden`, `y: 100% → 0%`, `duration: .4`
- the heading block's `background-color` and the SVG's `fill` tween to that panel's colour, read off a `data-slide-bg-color` attribute

Plus a `position: sticky` progress bar whose handle width is driven by a separate ScrollTrigger's `self.progress`.

**No preloader, confirmed.** The `<video>` tags are `autoplay loop muted playsinline` with the poster frame applied as a CSS `background-image` on the video element itself — so the first frame is painted before a single byte of video arrives. Two sources per video (mp4 + webm) and a **separate mobile encode** swapped by CSS. That is the whole "no loading screen" trick, and we will copy it exactly.

Screenshots I captured for reference are in `.kiro/artifacts/screenshots/` (homepage scroll sequence, an interior page, the overlay menu).

**Interior-page language** (so the whole site matches, per the brief): fixed dark bar — hamburger left, centred wordmark, single accent CTA right; full-height overlay menu (`height: 100svh; padding: 5rem 3rem 6rem`) sliding in from the left over decorative graphic panels; content pages are light near-square cards on the dark base in a 4-column grid, condensed uppercase headings, generous vertical rhythm.

---

## 2. Client assets — audit and required work

| Asset | Reality | Action |
|---|---|---|
| `Starting video/IMG_8459.MOV` | h264, **1080×1920 portrait**, 24fps, 30.25s, 40 MB, 10.5 Mbps, has an audio track | Needs encoding. See Q2 — the portrait aspect is a real design decision. |
| `Homepage pic combo/Artist pics/image 1–7.jpg` | 6 portrait, 1 landscape (`image 2`), ~6336×9504, 27–35 MB each | Sequence order 1→7 as briefed |
| `Homepage pic combo/Background pics/*.jpg` | **6 usable**, 1 is a broken Git LFS pointer (`ONEDINETH IMG 271.jpg`, 133 bytes) | Need 7 for 7 panels. See Q3 |
| `Gallery/*.jpg` | **14 usable**, 1 broken LFS pointer (`ONEDINETH IMG 343.jpg`, 133 bytes) | See Q3 |

Every photo is a ~60-megapixel export, 26–52 MB. Total raw payload is roughly **1.3 GB**. Nothing ships as-is; they go through a build-time pipeline (`sharp`) producing AVIF + WebP at 480/960/1600/2400px with LQIP placeholders. Expected result: a full-screen background photo drops from ~40 MB to well under 300 KB.

The video gets `ffmpeg` treatment: h264 mp4 + VP9 webm, audio stripped (it is a muted loop), CRF-targeted to roughly 4–6 MB, plus a poster JPEG for the background-image trick above.

Content is dark club/DJ photography with red and magenta stage light — it sits naturally on the `#080808` base with the two reds as accents. The palette and the assets agree with each other, which is lucky.

---

## 3. Stack

Locked from the brief, with current versions:

- **Next.js 16.3** App Router + TypeScript on **Vercel**
- **Tailwind CSS v4**, palette as `@theme` tokens so all four colours are centrally adjustable
- **GSAP 3.15** + ScrollTrigger + SplitText (SplitText is bundled free since 3.13, so no `split-type` dependency)
- **Supabase** Postgres for structured data; **Cloudflare R2** for every uploaded image, referenced by URL/key only — never a blob in the DB
- **Resend** via a Next route handler, API key server-side only
- R2 uploads go through a server-issued **presigned PUT URL**, so R2 credentials also never reach the browser
- Vercel Cron hitting a trivial Supabase read every 3 days to stop the free-tier project pausing

Fonts: Anton is the reference's actual heading face and is free on Google Fonts. I'd rather not clone it outright — see Q5.

---

## 4. Admin panel — the decision I need from you

You said: *forget the budget, I need an admin page where I can easily edit text, add images and pretty much change everything with ease.* That single sentence changes the recommendation, so I want your call before building.

### Option A — custom admin (what the brief originally specified)

`/admin` routes in the same Next app, Supabase Auth login, Supabase JS from the browser guarded by RLS.

- Everything is hand-built: forms, image uploader, rich text (Tiptap), list reordering (dnd-kit), validation
- No draft/publish workflow, no version history, no rollback, no live preview unless I build each one
- Roughly 40% of total build effort spent rebuilding a CMS by hand, and it will still be the weakest part of the site

### Option B — Payload CMS 3.89 mounted inside the same Next app ✅ my recommendation

Payload 3 installs into the Next `app` directory. One repo, one Vercel deployment, no extra SaaS.

- **Postgres adapter points at your Supabase database** — the brief's database choice is unchanged
- **S3 storage adapter points at Cloudflare R2** (R2 is S3-compatible) — the brief's image choice is unchanged
- Out of the box, zero custom code: drag-and-drop media library with focal-point cropping, block-based rich text, **live visual preview of the real page while you type**, drafts vs published, autosave, full version history with rollback, drag-to-reorder, relationship pickers, field-level validation
- Every text string on the site becomes an editable field, including the 7 canvas panels and the hero copy
- Auth is Payload's own (email/password, invite links, password reset) instead of Supabase Auth — **this is the one deviation from the brief and it needs your yes**

Cost either way is £0 beyond the domain: Payload is open source and self-hosts inside the Vercel deployment you were already paying nothing for.

The public site is identical under both options — this only changes who builds the editing UI.

---

## 5. Data model

Same shape under either option (Payload collection names shown; they map 1:1 to Postgres tables).

```
media            id, r2_key, url, width, height, alt, focal_x, focal_y, lqip
                 ↑ every image in the system lives here once

events           id, slug, title, artists[], starts_at, ends_at, venue, city,
                 description (rich text), cover_image → media,
                 gallery_images[] → media, ticket_price (numeric),
                 currency, external_ticket_url, status (published/draft), sort
                 ↑ upcoming vs past derived from starts_at, not a manual flag

posts            id, slug, title, excerpt, body (rich text), cover_image → media,
                 category (enum: news | artist_announcement | event_announcement |
                 collaboration | milestone | live_recording),
                 published_at, status (published/draft)
                 ↑ one model, six Updates subsections, as the brief allows

gallery_images   id, image → media, caption, event → events (nullable), sort

home_panels      id, sort (1–7), artist_image → media, background_image → media,
                 heading, accent (nexgen_red | ember_red | grey), subheading
                 ↑ so the 7-panel canvas is editable, not hard-coded

globals          home_hero (video, headline, sub, CTAs)
                 our_story (4 rich-text sections: what / why / stand for / community)
                 contact (email, phone, address, social links[])
                 site (nav labels, footer, SEO defaults)

orders           id, event → events, email, qty, amount_total, currency,
                 status, stripe_checkout_session_id, created_at
tickets          id, order → orders, event → events, code, holder_name, status
                 ↑ created empty now. A future Stripe checkout writes here.
                   No gateway, no keys, no schema change needed later.

contact_messages id, name, email, subject, message, created_at
                 ↑ logged as well as emailed, so nothing is lost if Resend hiccups
```

Public read is restricted to `status = published`; all writes require an authenticated admin. Under Option A that is Supabase RLS policies; under Option B it is Payload access-control functions plus RLS as a second layer.

---

## 6. Pages and components

**Home** — `<HeroVideo>` (scroll-scrubbed shrink + nav reveal), `<PhotoCanvas>` (the 7-panel sticky/trigger system described in §1), `<ScrollProgress>`, then teaser rails into Events / Updates / Gallery.

**Our Story** — four scroll-revealed sections, alternating full-bleed photo bands, SplitText headings.

**Events** — Upcoming grid (date, venue, artists, ticket price, no checkout) and a Past archive that deep-links into the matching Gallery group.

**Updates** — category-filtered grid over one `posts` collection, plus a post detail route.

**Gallery** — masonry grid grouped by event, keyboard-navigable lightbox. The source photos are a good mix of portrait and landscape, so masonry beats a fixed grid here.

**Contact** — form → route handler → Resend, plus social links.

Shared: `<Navbar>` (hamburger / centred wordmark / accent CTA), `<OverlayMenu>` (100svh, slide-in), `<Footer>`, `<Reveal>`, `<SplitHeading>`, `<ResponsiveImage>`, and a `useScrollTimeline` hook wrapping the GSAP context/cleanup so animations behave with App Router navigation.

Motion respects `prefers-reduced-motion`: scrubbed timelines collapse to their end state rather than being removed.

---

## 7. Palette

```css
--nexgen-red:  #D93220;   /* primary accent, CTAs */
--ember-red:   #EB4F2F;   /* hover / gradient partner / highlights */
--chrome-grey: #999999;   /* secondary text, dividers, muted surfaces */
--chrome-black:#080808;   /* base background, cards, overlay menu */
```

Dark base carrying one loud accent, mirroring the reference's structure. No fifth colour anywhere — white text is `--chrome-grey` lightened via opacity on the black base rather than a new token, and I will keep an eye on contrast ratios so body copy stays legible (pure `#999999` on `#080808` passes AA for large text but is marginal for small; I may need to allow an opacity-derived lighter grey, which I'll flag rather than silently add).

---

## 8. Build order

1. Repo scaffold, Tailwind theme tokens, fonts, layout shell, Navbar + OverlayMenu
2. Asset pipeline; encode video; process all 27 photos
3. `<HeroVideo>` and `<PhotoCanvas>` — the two signature interactions, built first because they carry the most risk
4. Supabase project, schema, seed
5. Admin (per your Option A / B answer)
6. Remaining pages against real data
7. Contact form + Resend + Vercel Cron keep-alive
8. Lighthouse / mobile / reduced-motion pass, then deploy

---

## 9. Questions before I start

1. **Admin: Option A or Option B?** I recommend B. It is the only honest route to "change everything with ease", and its one cost is that admin login moves from Supabase Auth to Payload's own auth.
2. **The hero video is portrait 1080×1920.** On a desktop 16:9 screen, `object-fit: cover` keeps only a central horizontal band and crops most of the frame away. Options: (a) accept the centre crop, (b) letterbox the portrait video centred with a blurred copy of itself filling the sides, (c) you send a landscape cut for desktop and I keep the portrait one for mobile — which is what the reference site does, and what I'd recommend. Which?
3. **Two asset files are broken Git LFS pointers** (133 bytes, no image data): `Gallery/ONEDINETH IMG 343.jpg` and `Homepage pic combo/Background pics/ONEDINETH IMG 271.jpg`. Can you re-upload them? Without 271 I have 6 backgrounds for 7 panels, so panel 7 would reuse a background unless you send another.
4. **Copy.** Do you have written text for Our Story (the four sections), the 7 panel headings, and real event/news entries? If not I will write clearly-marked placeholder copy in NexGen's voice for you to overwrite in the admin.
5. **Fonts.** The reference uses Anton for headings. I can use Anton (identical feel, free, but it *is* their font) or pick a comparable condensed display face so NexGen has its own voice — e.g. Archivo Black, Bebas Neue, or Oswald. Preference?
6. **Practical bits:** social media URLs, the destination inbox for contact form emails, and whether you have the domain yet.

Sensible defaults if you'd rather not answer individually: **B, 2(c) with the centre crop as a stand-in until you send a landscape cut, placeholder copy, and Anton.** Say "go with your defaults" and I'll start.
