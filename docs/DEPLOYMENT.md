# NexGen — deployment runbook

Click-by-click instructions for taking this repository to a live site. Follow the
parts in order; Vercel needs values from Supabase and R2, so those come first.

Set aside about 45 minutes. Nothing here is irreversible.

**Two things that will surprise you if nobody says them first:**

1. Cloudflare asks for a **card before it will enable R2**, even though you will
   pay nothing. R2's free allowance (10 GB storage, 10 million reads/month) is not
   a hard cap — it bills for overage, so a payment method has to be on file. At
   this site's size you are looking at roughly 0.3 GB and a few thousand reads.
2. Supabase gives you **three** connection strings. Only one of them works here.
   Part 1, step 6 explains which and why.

---

## Contents

- [Before you start](#before-you-start)
- [Part 1 — Supabase (database)](#part-1--supabase-database)
- [Part 2 — Cloudflare R2 (image storage)](#part-2--cloudflare-r2-image-storage)
- [Part 3 — Resend (contact form email)](#part-3--resend-contact-form-email)
- [Part 4 — Vercel (hosting)](#part-4--vercel-hosting)
- [Part 5 — Loading the content](#part-5--loading-the-content)
- [Part 6 — Your domain](#part-6--your-domain)
- [Part 7 — Check it all works](#part-7--check-it-all-works)
- [Part 8 — Troubleshooting](#part-8--troubleshooting)
- [Part 9 — Running it day to day](#part-9--running-it-day-to-day)
- [Every environment variable](#every-environment-variable)

---

## Before you start

Open a text file and keep it next to you. You will collect **13 values** as you
go. Paste each one in as you get it — several are shown only once and cannot be
retrieved later.

You need on your own machine (for Part 5 only):

```bash
node --version   # must be 20 or newer
git --version
```

If `pnpm` is missing: `npm install -g pnpm`

Accounts to have ready: GitHub (you have it), Supabase (Pro, done), Cloudflare,
Resend, Vercel. Sign in to all of them in separate tabs now — it saves a lot of
back-and-forth.

---

## Part 1 — Supabase (database)

This holds every event, update, page and image *record*. The image files
themselves go to R2 in Part 2.

### 1.1 Create the project

1. Go to <https://supabase.com/dashboard>.
2. Click **New project**.
3. Pick your organisation (the one with Pro on it).
4. Fill in:
   - **Name**: `nexgen`
   - **Database Password**: click **Generate a password**, then immediately copy it
     into your notes as **`DB_PASSWORD`**.
     > This is shown once. If you lose it you can reset it later under Settings →
     > Database → Reset database password, but that means re-editing your Vercel
     > variables, so save it properly now.
   - **Region**: choose the closest to your audience. For Sri Lanka pick
     **Southeast Asia (Singapore)** or **South Asia (Mumbai)**. This affects how
     fast every page loads and cannot be changed later.
5. Click **Create new project** and wait 2–3 minutes for provisioning.

### 1.2 Get the connection string

6. When the project is ready, click the **Connect** button in the top bar (some
   dashboards show it under **Project Settings → Database → Connection string**).
7. You will see three options. **Choose "Session pooler".**

   | Option | Port | Use it? |
   |---|---|---|
   | Direct connection | 5432 | **No** — IPv6 only. Vercel connects over IPv4, so this fails unless you buy Supabase's paid IPv4 add-on. |
   | Transaction pooler | 6543 | **No** — it drops session features this site needs. Database migrations will fail against it. |
   | **Session pooler** | **5432** | **Yes** — reachable over IPv4 at no cost, and supports everything. |

8. Copy the URI. It looks like:

   ```
   postgresql://postgres.abcdefghijklmnop:[YOUR-PASSWORD]@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres
   ```

9. Replace `[YOUR-PASSWORD]` — including the square brackets — with your
   `DB_PASSWORD` from step 4.

   > If your password contains `@`, `/`, `:` or `#`, it must be percent-encoded or
   > the URL will parse wrongly. Easiest fix: reset the password and let Supabase
   > generate one, which is always URL-safe.

10. Save the finished string as **`DATABASE_URI`**. ✅ *(1 of 13)*

### 1.3 That's genuinely it

You do **not** need to:

- create any tables — the first deploy builds the entire schema via migrations
- write Row Level Security policies — access control lives in the application,
  and the database credentials never reach a browser
- touch Supabase Storage — images go to R2 instead
- enable any Supabase Auth providers — admin login is handled by the CMS

You *can* browse and edit rows later under **Table Editor** if you ever want a
back door to the data. Treat it as a diagnostic tool, not the way to edit content.

---

## Part 2 — Cloudflare R2 (image storage)

Every photo and video uploaded through the admin panel is stored here. Reads are
free and unmetered, which is why it is worth using for a photography-heavy site.

### 2.1 Enable R2

1. Go to <https://dash.cloudflare.com> and sign in.
2. In the left sidebar click **R2 Object Storage**.
3. If you have never used R2, you will see a purchase screen. Click
   **Add R2 subscription** / **Enable R2**.
4. Add a payment method if asked. The checkout will show **$0.00 due today** along
   with the free allowance. This is expected — see the note at the top of this
   document. Confirm.

   > If you get error **1323** here, there is an unpaid invoice on the Cloudflare
   > account blocking new subscriptions. Settle it under Billing first.

### 2.2 Create the bucket

5. Click **Create bucket**.
6. **Bucket name**: `nexgen-media` — save it as **`R2_BUCKET`**. ✅ *(2 of 13)*
7. **Location**: leave as **Automatic**.
8. **Storage class**: leave as **Standard**. (Infrequent Access is cheaper to store
   but charges for reads, which defeats the point here.)
9. Click **Create bucket**.

### 2.3 Make the bucket publicly readable

Visitors' browsers load photographs straight from R2, so the bucket has to serve
public reads. Uploading still requires the API token from step 2.5 — only reading
is public.

10. Open the bucket → **Settings** tab → find **Public access**.
11. Choose one:

    **Option A — quickest.** Under **R2.dev subdomain**, click **Enable**, then
    **Allow** to confirm. Copy the URL it gives you, e.g.
    `https://pub-1a2b3c4d5e.r2.dev`.

    **Option B — better, if your domain is on Cloudflare.** Under **Custom
    domains**, click **Connect domain** and enter something like
    `media.yourdomain.com`. Cloudflare adds the DNS record itself. Your URL is
    then `https://media.yourdomain.com`.

    Option B is faster for visitors, is not rate-limited the way `r2.dev` is, and
    keeps the URL yours. Option A is fine to launch with and can be swapped later
    by changing one variable.

12. Save that URL as **`R2_PUBLIC_URL`** — with `https://`, no trailing slash.
    ✅ *(3 of 13)*

### 2.4 Get your account ID

13. Go back to the **R2 Object Storage** overview page.
14. On the right-hand side, find **Account ID** and copy it.
15. Build and save **`R2_ENDPOINT`**:

    ```
    https://YOUR_ACCOUNT_ID.r2cloudflarestorage.com
    ```

    Written properly, with the dot:

    ```
    https://YOUR_ACCOUNT_ID.r2.cloudflarestorage.com
    ```

    ✅ *(4 of 13)*

### 2.5 Create an API token

16. On the R2 overview page, click **Manage R2 API Tokens** (top right), then
    **Create API token**.
17. Configure it:
    - **Token name**: `nexgen-website`
    - **Permissions**: **Object Read & Write**
    - **Specify bucket(s)**: choose **Apply to specific buckets** → `nexgen-media`
    - **TTL**: leave as forever
18. Click **Create API Token**.
19. The next screen shows your credentials **once**. Copy:
    - **Access Key ID** → **`R2_ACCESS_KEY_ID`** ✅ *(5 of 13)*
    - **Secret Access Key** → **`R2_SECRET_ACCESS_KEY`** ✅ *(6 of 13)*

    Ignore the "S3 Client" endpoint shown here if it differs in format — use the
    one you built in step 15.

### 2.6 CORS — not needed

You may read that R2 needs a CORS policy. It does not here: uploads go from the
server, and photographs are loaded with ordinary `<img>` tags. Leave CORS empty.

---

## Part 3 — Resend (contact form email)

Skip this if you like. The contact form still works without it — submissions are
saved and readable under **Inbox → Contact Messages** in the admin panel. They
simply will not be emailed to you. You can come back and add it any time.

1. Sign up at <https://resend.com>.
2. Click **Domains** → **Add Domain** → enter `yourdomain.com`.
3. Resend shows a set of DNS records (usually MX, and TXT records for SPF and
   DKIM). Add each one at your domain registrar — or, if your DNS is on
   Cloudflare, under that domain's **DNS → Records**.

   > On Cloudflare, set these records to **DNS only** (grey cloud), not proxied.
   > Proxying breaks mail records.

4. Click **Verify DNS Records**. It usually takes a few minutes, occasionally up
   to an hour.
5. Once verified, go to **API Keys** → **Create API Key**.
   - **Name**: `nexgen-website`
   - **Permission**: **Sending access**
   - **Domain**: your verified domain
6. Copy the key (shown once) as **`RESEND_API_KEY`**. ✅ *(7 of 13)*
7. Decide two addresses and save them:
   - **`CONTACT_EMAIL_FROM`** — must be on the domain you just verified. Include a
     display name: `NexGen Website <website@yourdomain.com>` ✅ *(8 of 13)*
   - **`CONTACT_EMAIL_TO`** — where enquiries land. Any inbox, Gmail included.
     ✅ *(9 of 13)*

---

## Part 4 — Vercel (hosting)

### 4.1 Generate three secrets

Run this three times and label the results:

```bash
openssl rand -base64 32
```

- **`PAYLOAD_SECRET`** — encrypts admin login sessions ✅ *(10 of 13)*
- **`PREVIEW_SECRET`** — guards the draft-preview route ✅ *(11 of 13)*
- **`CRON_SECRET`** — guards the health-check endpoint ✅ *(12 of 13)*

No `openssl`? Any long random string works. On Windows PowerShell:
`[Convert]::ToBase64String((1..32|%{Get-Random -Max 256}))`

> Changing `PAYLOAD_SECRET` later logs every admin user out. It does not damage
> any content.

### 4.2 Import the repository

1. Go to <https://vercel.com/new>.
2. Connect GitHub if you have not already, and grant access to
   `vbuildlanka-oss/NEXGEN`.
3. Click **Import** next to that repository.
4. On the configure screen:
   - **Framework Preset**: should auto-detect **Next.js**. If not, set it.
   - **Root Directory**: leave as `./`
   - **Build and Output Settings**: **leave untouched.** The repository's
     `vercel.json` already sets the build command to
     `pnpm payload migrate && pnpm build`, so your database schema is created and
     kept up to date on every deploy.
   - **Node.js Version**: 20 or 22.

### 4.3 Add the environment variables

Still on the configure screen, expand **Environment Variables**. Add each row
below. Leave the environment selector on **All Environments** unless noted.

The thirteenth value is one you decide now: your final site URL.

| Name | Value | Where it came from |
|---|---|---|
| `DATABASE_URI` | your session-pooler string | Part 1, step 10 |
| `PAYLOAD_SECRET` | random string | Part 4.1 |
| `NEXT_PUBLIC_SERVER_URL` | `https://nexgen.lk` — your real domain, or the `.vercel.app` URL for now | ✅ *(13 of 13)* |
| `PREVIEW_SECRET` | random string | Part 4.1 |
| `R2_BUCKET` | `nexgen-media` | Part 2, step 6 |
| `R2_ACCESS_KEY_ID` | access key | Part 2, step 19 |
| `R2_SECRET_ACCESS_KEY` | secret key | Part 2, step 19 |
| `R2_ENDPOINT` | `https://ACCOUNT_ID.r2.cloudflarestorage.com` | Part 2, step 15 |
| `R2_PUBLIC_URL` | `https://pub-xxxx.r2.dev` or your media domain | Part 2, step 12 |
| `RESEND_API_KEY` | Resend key (omit if skipping Part 3) | Part 3, step 6 |
| `CONTACT_EMAIL_FROM` | `NexGen Website <website@yourdomain.com>` | Part 3, step 7 |
| `CONTACT_EMAIL_TO` | your inbox | Part 3, step 7 |
| `CRON_SECRET` | random string | Part 4.1 |

Two that matter more than they look:

- **`NEXT_PUBLIC_SERVER_URL` must be the URL you actually visit** — right
  protocol, no trailing slash, and not a placeholder. This one bit us on the first
  deploy: it was left as `https://placeholder.vercel.app`, which pointed the
  sitemap at a domain that does not exist and made the **entire admin panel render
  as a blank page** — Payload validates the request origin against this value, so
  the panel could not call its own API. The site now also trusts Vercel's own
  hostnames as a fallback, so a wrong value here no longer breaks the admin, but
  it will still put the wrong URL in your sitemap and share links.
- **The `R2_*` variables must all be present.** If any is missing, the site falls
  back to writing uploads to local disk, and Vercel's filesystem is read-only —
  so every image upload fails.

### 4.4 Deploy

5. Click **Deploy**.
6. Watch the log. A healthy first build shows:

   ```
   Reading migration files from src/migrations
   Migrating: 20260910_221524_initial
   Migrated:  20260910_221524_initial
   ✓ Compiled successfully
   ✓ Generating static pages
   ```

7. It takes 2–4 minutes. If it fails, go to [Part 8](#part-8--troubleshooting) —
   the error message maps to a specific fix.

Your site is now live, with no content in it yet. That is Part 5.

---

## Part 5 — Loading the content

**Nothing to do — this happens automatically.**

The first production deployment seeds itself. The build runs migrations, then
loads the placeholder content: seven homepage panels, five events, six updates, a
fourteen-photo gallery, and every page's wording. The photographs are uploaded to
your R2 bucket as part of that. Look for it in the build log:

```
+ event: NexGen Presents: Ember Nights
+ media: onedineth-img-11.webp
+ panel 1: Nights that start where the playlist ends
+ globals: homepage, our story, contact, site settings
```

It is idempotent: every later deploy checks what already exists and adds nothing,
so editing content in the admin panel is never overwritten by a deployment.

If the log instead shows `seeding did not complete`, the content is missing but
the site still deployed. The cause is almost always an R2 variable — check the
warning above that line in the log, then [Part 8](#part-8--troubleshooting).

### Create your admin login

The seed deliberately does **not** create an admin account, because a generated
password would end up in the build log where anyone with project access could
read it. Instead:

1. Go to `https://your-site.com/admin`
2. It shows **"Welcome — to begin, create your first user"**
3. Enter your email, a password you choose, and your name

That screen only appears while no account exists, so whoever gets there first
owns the site. Do it now rather than later.

### Starting from scratch instead

Prefer an empty site with no placeholder content? Set `SEED_SKIP=1` in your
Vercel environment variables before the first deploy, and only the schema is
created.

### Running the seed by hand

Only needed if you ever want to reload the placeholder content deliberately:

```bash
git clone https://github.com/vbuildlanka-oss/NEXGEN.git
cd NEXGEN && pnpm install
# create .env with your production DATABASE_URI and R2_* values
pnpm seed
```

## Part 6 — Your domain

1. In Vercel: your project → **Settings** → **Domains** → **Add**.
2. Enter `yourdomain.com`. Vercel shows the DNS records to create.
3. Add them at your registrar (or Cloudflare **DNS → Records**).

   > On Cloudflare, set the record for the site to **DNS only** (grey cloud) while
   > it verifies. Proxying Cloudflare in front of Vercel can be made to work, but
   > it complicates certificates for no benefit here.

4. Wait for **Valid Configuration**. Usually minutes.
5. **Then go back and update `NEXT_PUBLIC_SERVER_URL`** to the new domain
   (Settings → Environment Variables → edit → Save).
6. **Redeploy**: Deployments → the latest one → **⋯** → **Redeploy**.
   Environment variables are read at build time, so the change does not take
   effect until you do this.

Also update Resend's `CONTACT_EMAIL_FROM` if your email domain changed.

---

## Part 7 — Check it all works

Walk this list on the live site. It takes five minutes and catches everything that
commonly goes wrong.

**The public site**

- [ ] Homepage loads and the hero video plays automatically, muted
- [ ] Scrolling shrinks the video and the navigation bar appears
- [ ] Scrolling further moves through seven photo panels, each with a heading
- [ ] `/events` lists three upcoming and two past events, with prices
- [ ] `/gallery` shows photographs; clicking one opens the lightbox; arrow keys move
- [ ] `/our-story`, `/updates`, `/contact` all load
- [ ] `/robots.txt` and `/sitemap.xml` both return content
- [ ] On your phone: no sideways scrolling, no text cut off

**Images are coming from R2** — the real test that Part 2 worked:

- [ ] Right-click any photo → **Open image in new tab**. The URL should start with
      your `R2_PUBLIC_URL`. If it starts with your site domain and `/api/media/`,
      R2 is not configured and you are on the disk fallback.

**The admin panel**

- [ ] `/admin` logs you in
- [ ] **Events** → open one → change the tagline → **Save** → the public page shows
      the change within seconds
- [ ] **Images & Videos** → drag in a photo → it uploads without error
      *(this is the step that proves R2 write access works)*
- [ ] Open an event and click **Preview** — the real page appears alongside the form
- [ ] **Inbox → Contact Messages** exists

**The contact form**

- [ ] Submit it on `/contact` with your own email
- [ ] The success message appears
- [ ] The message shows under **Inbox → Contact Messages**
- [ ] If you set up Resend: the email arrives at `CONTACT_EMAIL_TO` (check spam
      the first time)

---

## Part 8 — Troubleshooting

Matched to the actual error text you will see.

### Build fails: `cannot connect to Postgres` / `ECONNREFUSED`

Your `DATABASE_URI` is wrong or unreachable. In order of likelihood:

1. You used the **direct connection** or **transaction pooler** string. Go back to
   Part 1 step 7 and take the **Session pooler** one.
2. `[YOUR-PASSWORD]` is still literally in the string, brackets and all.
3. The password contains a character that needs URL-encoding — regenerate it.

### Build fails: `"site-settings" failed during the production build`

This is deliberate. The build refuses to publish a site with missing content
rather than quietly shipping an empty one. The cause is the same as above, or
migrations have not run. Check the build log a few lines earlier for the real
database error.

### Uploading an image fails: `EROFS: read-only file system`

One or more `R2_*` variables are missing or misspelled, so the site is trying to
write to local disk. Check all five in Vercel, then redeploy.

### Uploaded images give 404 or "Access Denied"

The bucket is not publicly readable, or `R2_PUBLIC_URL` is wrong.

1. Bucket → **Settings** → **Public access** → confirm r2.dev is **enabled** or a
   custom domain is connected.
2. Confirm `R2_PUBLIC_URL` has `https://` and **no trailing slash**.
3. Open `R2_PUBLIC_URL` + `/` + a filename from the bucket directly in a browser.
   If that 404s, the problem is the bucket, not the site.

### Images upload but the site shows broken image icons

`R2_PUBLIC_URL` does not match the URL the browser is being given. Redeploy after
correcting it — `next.config.ts` reads this at build time to allow the host.

### The whole admin panel is a blank white page

The page returns 200 and the HTML is correct, but nothing renders. Payload checks
the request origin against `NEXT_PUBLIC_SERVER_URL`; if that does not match the
host you are on, the admin cannot call its own API and never starts.

Set `NEXT_PUBLIC_SERVER_URL` to your real URL and redeploy. Confirm which value is
live by opening `/robots.txt` — the `Host:` line shows exactly what the site
thinks its address is.

### Admin live preview pane is blank

`NEXT_PUBLIC_SERVER_URL` does not match the URL you are actually on (often `http`
vs `https`, a trailing slash, or still the `.vercel.app` URL after adding a
domain). Fix it and redeploy.

### Preview says "You must be logged in to the admin panel"

Expected if you are not logged in. If you *are* logged in, `PREVIEW_SECRET` is
missing from Vercel.

### Contact form: "We could not send your message"

Resend rejected it. Almost always the domain in `CONTACT_EMAIL_FROM` is not
verified in Resend, or does not match the verified domain. The submission is still
saved in the admin panel.

### Hero video does not play

Some browsers block autoplay with sound. This video is muted and inline, so it
should always play — if it does not, the poster image shows instead and the page
still works. On a slow connection the poster is deliberately visible until enough
video has arrived.

### Everything worked, then the site went blank after a content change

Open the admin panel and check the document you last edited. Failing that, every
Event and Update keeps full version history: open it, click **Versions**, and
restore an earlier one.

---

## Part 9 — Running it day to day

**Adding a colleague.** Admin → **Admin Users** → **Create New**. Set a password
and send it to them; they can change it under Account. Everyone has the same full
access — there is one role by design.

**Deploying a change.** Any push to `main` deploys automatically. Vercel keeps
every previous deployment, so **Deployments → ⋯ → Promote to Production** rolls
back instantly if something is wrong.

**Backups.** Supabase Pro takes daily automatic backups with point-in-time
recovery — nothing to configure. R2 is not backed up: keep the original
photographs somewhere safe (you have the masters in this repository).

**What it costs.** Supabase Pro is your only committed spend. Vercel Hobby covers
this traffic. R2 will read about 0.3 GB of the 10 GB free allowance. Resend's free
tier is 3,000 emails a month. Add the domain, ~$10–15/year.

**If you ever downgrade Supabase to Free**, projects pause after ~7 days of
inactivity and the site's content goes offline until resumed. The site includes a
health-check endpoint for exactly this; re-enable a scheduled ping by adding to
`vercel.json`:

```json
"crons": [{ "path": "/api/cron/keep-alive", "schedule": "0 6 */3 * *" }]
```

**Checking a change before it goes live.** From a clone with a `.env`:

```bash
pnpm verify
```

Runs lint, a production build, and an end-to-end smoke test of every route, the
contact form, the protected endpoints, the security headers and mobile layout.

---

## Every environment variable

Authoritative list, taken from the code.

| Variable | Required? | Consequence if missing |
|---|---|---|
| `DATABASE_URI` | **Yes** | Build fails. Nothing works. |
| `PAYLOAD_SECRET` | **Yes** | Admin login cannot issue sessions. |
| `NEXT_PUBLIC_SERVER_URL` | **Yes** | Live preview breaks; social share links point at localhost. |
| `R2_BUCKET` | **Yes** in production | Uploads fall back to disk → fail on Vercel. |
| `R2_ACCESS_KEY_ID` | **Yes** in production | As above. |
| `R2_SECRET_ACCESS_KEY` | **Yes** in production | As above. |
| `R2_ENDPOINT` | **Yes** in production | As above. |
| `R2_PUBLIC_URL` | **Yes** in production | Images upload but do not display. |
| `PREVIEW_SECRET` | Recommended | The Preview button returns an error. |
| `RESEND_API_KEY` | Optional | Form still saves; no email sent. |
| `CONTACT_EMAIL_FROM` | With Resend | No email sent. |
| `CONTACT_EMAIL_TO` | With Resend | No email sent. |
| `CRON_SECRET` | Optional | Health-check endpoint becomes unauthenticated. |
| `PAYLOAD_ADMIN_EMAIL` | Optional, local | Seed defaults to `vbuildlanka@gmail.com`. |
| `PAYLOAD_ADMIN_PASSWORD` | Optional, local | Seed generates and prints one. |

For local development, copy `.env.example` to `.env` and fill in just
`DATABASE_URI` and `PAYLOAD_SECRET`. Leave the `R2_*` variables blank and uploads
go to `public/media-uploads` on your own disk, so you need no cloud accounts to
work on the site.
