# NexGen — setup and deployment

Everything below is the part I cannot do for you, because it needs accounts in
your name. Each step says exactly which value to copy and where it goes.

There are four services:

| Service | What it does | Cost |
|---|---|---|
| **Supabase** | Postgres database — every event, post, page and image record | Pro (already purchased) |
| **Cloudflare R2** | Stores the actual image and video files | Free tier: 10 GB, egress always free |
| **Resend** | Sends contact-form emails | Free tier: 3,000/month |
| **Vercel** | Hosts the site and the admin panel | Free (Hobby) is enough |

Total unavoidable extra cost: the domain name, roughly $10–15/year.

---

## 1. Supabase — the database

You already have Pro, so the free tier's seven-day pausing does not apply and no
keep-alive cron is scheduled.

1. Go to <https://supabase.com/dashboard> → **New project**.
   - Name: `nexgen`
   - Database password: generate a strong one and **save it** — you need it in a
     moment and it is not recoverable.
   - Region: pick the one closest to your audience (Singapore or Mumbai for Sri
     Lanka).
2. Once the project is ready, go to **Project Settings → Database →
   Connection string** and choose the **URI** tab.
3. Select the **Session pooler** option (port `5432`). Copy that string and
   replace `[YOUR-PASSWORD]` with the password from step 1.

   It looks like:
   ```
   postgresql://postgres.abcdefghijkl:YOUR-PASSWORD@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
   ```

   → This is your **`DATABASE_URI`**.

   Use the *Session pooler*, not the direct connection: serverless functions open
   and close connections constantly and would exhaust the direct connection limit.

**Nothing else in Supabase needs configuring.** No tables to create, no Row Level
Security policies to write — the site owns its schema and creates it for you via
migrations on first deploy. You can still browse and edit rows in the Supabase
**Table Editor** if you ever want to, as a backup to the admin panel.

---

## 2. Cloudflare R2 — the image storage

1. Go to <https://dash.cloudflare.com> → **R2** in the sidebar → **Create bucket**.
   - Name: `nexgen-media`
   - Location: Automatic
2. Open the bucket → **Settings** → find **Public access**.
   - Either enable the **r2.dev subdomain** (quickest), or connect a custom
     domain such as `media.yourdomain.com` (better — faster, and the URL is
     yours). Copy whichever URL it gives you.

   → This is your **`R2_PUBLIC_URL`**, e.g. `https://pub-xxxxxxxx.r2.dev`

   The bucket must be publicly readable, because visitors' browsers load the
   photographs directly from it. Only *reads* are public; uploading still
   requires the API token below.
3. Back on the R2 overview page, note the **Account ID** shown on the right.

   → Your **`R2_ENDPOINT`** is `https://<ACCOUNT_ID>.r2.cloudflarestorage.com`
4. Click **Manage R2 API Tokens** → **Create API token**.
   - Permission: **Object Read & Write**
   - Scope it to the `nexgen-media` bucket only.
   - Create it, then copy both values shown — they are displayed **once**.

   → **`R2_ACCESS_KEY_ID`** and **`R2_SECRET_ACCESS_KEY`**
5. → **`R2_BUCKET`** is `nexgen-media`

If all five R2 variables are absent the site falls back to storing uploads on
local disk, which is fine for development but **will not work on Vercel** —
its filesystem is read-only. R2 is required in production.

---

## 3. Resend — contact form email

1. Go to <https://resend.com> → sign up.
2. **Domains** → **Add domain** → enter your domain, then add the DNS records it
   shows you at your domain registrar. Wait for it to verify.
3. **API Keys** → **Create API key** → permission **Sending access**. Copy it.

   → **`RESEND_API_KEY`**
4. → **`CONTACT_EMAIL_FROM`** must be an address on the domain you just verified,
   e.g. `NexGen Website <website@yourdomain.com>`
5. → **`CONTACT_EMAIL_TO`** is wherever you want enquiries delivered — any
   inbox, including Gmail.

If you skip this, the contact form still works: submissions are saved and appear
under **Inbox → Contact Messages** in the admin panel. They just are not emailed
to you.

---

## 4. Vercel — deploying

1. Go to <https://vercel.com/new> and import the `vbuildlanka-oss/NEXGEN`
   repository.
2. Framework preset: **Next.js**. Leave the build settings alone — `vercel.json`
   already sets the build command to run database migrations before building.
3. Before clicking Deploy, add these **Environment Variables**:

   | Name | Value |
   |---|---|
   | `DATABASE_URI` | from step 1 |
   | `PAYLOAD_SECRET` | any long random string — run `openssl rand -base64 32` |
   | `NEXT_PUBLIC_SERVER_URL` | your final site URL, e.g. `https://nexgen.lk` |
   | `PREVIEW_SECRET` | another long random string |
   | `R2_BUCKET` | `nexgen-media` |
   | `R2_ACCESS_KEY_ID` | from step 2 |
   | `R2_SECRET_ACCESS_KEY` | from step 2 |
   | `R2_ENDPOINT` | from step 2 |
   | `R2_PUBLIC_URL` | from step 2 |
   | `RESEND_API_KEY` | from step 3 |
   | `CONTACT_EMAIL_FROM` | from step 3 |
   | `CONTACT_EMAIL_TO` | from step 3 |
   | `CRON_SECRET` | another long random string |

   `PAYLOAD_SECRET` encrypts admin login sessions — changing it later logs
   everyone out. `NEXT_PUBLIC_SERVER_URL` must match the real URL or the admin
   panel's live preview will not load.

4. Deploy. The first build runs the migrations and creates every table.

5. **Add your domain**: Vercel → project → **Settings → Domains**. Then update
   `NEXT_PUBLIC_SERVER_URL` to the custom domain and redeploy.

---

## 5. Filling the site with content

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

## 6. Local development

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

## 7. Things to be aware of

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

## 8. Verifying a build before you deploy

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
