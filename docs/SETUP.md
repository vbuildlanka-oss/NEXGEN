# NexGen — setup

What the site runs on, and what you have to do yourself because it needs accounts
in your name.

**Going live? Follow [DEPLOYMENT.md](./DEPLOYMENT.md)** — it is the step-by-step
runbook. This page is the overview.

There are four services:

| Service | What it does | Cost |
|---|---|---|
| **Supabase** | Postgres database — every event, post, page and image record | Pro (already purchased) |
| **Cloudflare R2** | Stores the actual image and video files | Free tier: 10 GB, egress always free |
| **Resend** | Sends contact-form emails | Free tier: 3,000/month |
| **Vercel** | Hosts the site and the admin panel | Free (Hobby) is enough |

Total unavoidable extra cost: the domain name, roughly $10–15/year.

---

## Setting up the services

The click-by-click walkthrough — every screen, every value, and what to do when a
step fails — is in **[DEPLOYMENT.md](./DEPLOYMENT.md)**. Work through that once and
the site is live.

Two things to know before you open it:

- **Supabase gives you three connection strings and only one works here.** Use the
  **Session pooler** (port 5432). The direct connection is IPv6-only, which Vercel
  cannot reach without a paid add-on, and the transaction pooler drops the session
  features that database migrations need.
- **Cloudflare asks for a card before enabling R2**, even though the free
  allowance covers this site many times over. R2 bills for overage rather than
  capping usage, so a payment method has to be on file.

You will not need to create tables, write Row Level Security policies, or
configure CORS. The schema is created by migrations on the first deploy, database
credentials never reach a browser, and images load with ordinary `<img>` tags.

## Filling the site with content

The site ships with placeholder content already written — including the contact
details, which are deliberately obvious placeholders for you to replace. To load
it into your live database, run this once from your own machine with the
production values in a local `.env` file:

```bash
pnpm install
pnpm payload migrate   # only if the Vercel build has not already run it
pnpm seed
```

This uploads the processed photographs to R2, creates the seven homepage panels,
five events, six updates, the gallery, and every page's wording. It prints an
admin email and a generated password — **change the password immediately** after
your first login.

If you would rather start completely empty, skip `pnpm seed` and go straight to
`https://your-site.com/admin`, which will ask you to create the first admin
account.

### Where to edit what

| In the admin panel | Controls |
|---|---|
| **Events** | Shows, dates, venues, line-ups, ticket prices |
| **Updates** | News, artist/event announcements, collaborations, milestones, live recordings |
| **Images & Videos** | Every photo. Drag in many at once; tick *Show on the Gallery page* and pick an event to publish them |
| **Homepage** | Hero video and its wording; the scrolling photo panels |
| **Pages** | Our Story wording; contact details and social links |
| **Settings** | Menu, header button, footer, announcement bar, SEO; add colleagues under Admin Users |
| **Inbox** | Contact form submissions |

Every Event and Update keeps a full version history, so an earlier draft can
always be restored. Use **Preview** to see changes side by side before publishing.

---

## Local development

```bash
cp .env.example .env      # then fill in DATABASE_URI and PAYLOAD_SECRET
pnpm install
pnpm dev                  # http://localhost:3000, admin at /admin
```

Leaving the `R2_*` variables blank makes uploads go to `public/media-uploads`
instead of R2, so you need no cloud accounts to work locally.

Regenerating the brand and media assets from the client's original files:

```bash
pnpm assets:process           # photographs and hero video → assets-web/ and public/hero/
node scripts/extract-logo.mjs # re-traces logo.jpeg into the SVG wordmark
```

---

## Things to be aware of

- **Two supplied image files are unusable.** `Gallery/ONEDINETH IMG 343.jpg` and
  `Homepage pic combo/Background pics/ONEDINETH IMG 271.jpg` are 133-byte Git LFS
  pointers, not images. Because of the missing background, homepage panel 7
  currently borrows a landscape frame from the gallery set — swap it from the
  admin panel once you re-supply the real file.
- **The hero video is portrait (1080×1920).** On a desktop screen it is centre-
  cropped, which loses the top and bottom of the frame. A landscape cut for
  desktop would look considerably better; the reference site ships separate
  desktop and mobile encodes for exactly this reason. Upload one under
  **Homepage → Hero** whenever you have it.
- **On-site ticket sales are not built.** Prices display, and there is an
  optional external ticket link per event. The `orders` and `tickets` tables
  already exist so a Stripe checkout can be added later without a schema change.
- Vercel's free tier is enough for launch. R2 egress is always free, so
  photography traffic will not generate a bill.


---

## Verifying a build before you deploy

```bash
pnpm verify
```

That runs, in order: ESLint, a full production build, and an end-to-end smoke
test against the built server. The smoke test boots the site and checks:

- every route returns 200, and an unknown URL returns 404
- the contact form rejects bad input, accepts good input, and absorbs bot
  submissions via its honeypot
- the cron endpoint refuses requests without its token
- the preview route refuses requests without an admin session, and rejects
  attempts to turn it into an open redirect
- `robots.txt` and `sitemap.xml` respond, and the security headers are present
- media files and the hero video serve, including ranged requests
- the page copy is present in the raw HTML — so it is crawlable and readable
  with JavaScript disabled
- nothing renders at more than 390px wide on a phone, and no heading is clipped
  or broken mid-word

`pnpm check:mobile http://localhost:3000` runs just the mobile pass.

One deliberate behaviour worth knowing: **a production build fails if the
database is unreachable.** At runtime a database blip degrades gracefully and
still serves a page, but at build time it aborts — otherwise a mistyped
`DATABASE_URI` would quietly publish a live site with no events, no updates and
an empty gallery.
