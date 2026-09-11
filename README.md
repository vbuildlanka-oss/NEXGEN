# NexGen Entertainment

The NexGen website and its admin panel: a public marketing and events site with a
content management system behind it, so every word, photograph, event and price on
the site can be edited without a developer.

## Documentation

| Document | What it covers |
|---|---|
| **[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)** | **Start here to go live.** Click-by-click setup for Supabase, Cloudflare R2, Resend and Vercel, plus troubleshooting keyed to the actual error messages. |
| [docs/SETUP.md](docs/SETUP.md) | Overview of the services, local development, and known limitations. |
| [docs/PLAN.md](docs/PLAN.md) | How the reference site's scroll animations were analysed and rebuilt, the data model, and the decisions behind the build. |

## What it is built with

- **Next.js 16** (App Router) and **React 19**, deployed on **Vercel**
- **Payload CMS 3** mounted inside the same application — one codebase, one deploy
- **Supabase** Postgres for content, **Cloudflare R2** for image and video files
- **GSAP** + ScrollTrigger for the scroll-driven homepage
- **Tailwind CSS 4**, with the brand palette as theme tokens

## Running it locally

```bash
cp .env.example .env      # fill in DATABASE_URI and PAYLOAD_SECRET
pnpm install
pnpm dev                  # site on :3000, admin panel at /admin
```

Leave the `R2_*` variables blank and uploads are written to
`public/media-uploads`, so no cloud accounts are needed to work on the site.

```bash
pnpm verify        # lint, production build, and an end-to-end smoke test
pnpm seed          # load the placeholder content and create an admin user
```

## Editing the site

Log in at `/admin`.

| Section | Controls |
|---|---|
| **Events** | Shows, dates, venues, line-ups, ticket prices |
| **Updates** | News, artist and event announcements, collaborations, milestones, live recordings |
| **Images & Videos** | Every photo. Drag in many at once; tick *Show on the Gallery page* and pick an event to publish them |
| **Homepage** | The hero video and its wording; the seven scrolling photo panels |
| **Pages** | Our Story wording; contact details and social links |
| **Settings** | Menu, header button, footer, announcement bar, SEO; colleagues under Admin Users |
| **Inbox** | Contact form submissions |

Events and Updates keep full version history, so any earlier draft can be
restored. **Preview** shows a page as it will look before publishing.

## Regenerating assets

The client's original photographs and video are the masters in `Gallery/`,
`Homepage pic combo/` and `Starting video/`. They are never deployed — the web
versions in `assets-web/` and `public/` are generated from them:

```bash
pnpm assets:process              # photographs and hero video
node scripts/extract-logo.mjs    # re-traces logo.jpeg into the SVG wordmark
```

## Not in scope

On-site ticket checkout (prices display, and each event can link out to an
external ticket seller; the `orders` and `tickets` tables exist so a payment
provider can be added later without a schema change) and a merchandise section.
