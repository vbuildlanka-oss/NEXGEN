/**
 * CLI entry point for seeding.
 *
 *   pnpm seed          # local or manual use, creates an admin account
 *   pnpm seed:deploy   # what the production build runs
 *
 * The work itself lives in src/lib/seed.ts so that the build, this script and the
 * protected /api/admin/seed endpoint all share one implementation.
 */
import 'dotenv/config'

import { getPayload } from 'payload'

import config from '../src/payload.config'
import { runSeed } from '../src/lib/seed'

async function main() {
  /**
   * Preview deployments usually share production environment variables on Vercel,
   * so seeding from one would write into the live database. Only production
   * deployments and local runs may seed.
   */
  if (process.env.VERCEL_ENV === 'preview') {
    console.log('Skipping seed: this is a preview deployment.')
    process.exit(0)
  }

  // Opt out entirely — for an operator who wants to start from an empty site.
  if (process.env.SEED_SKIP === '1') {
    console.log('Skipping seed: SEED_SKIP=1 is set.')
    process.exit(0)
  }

  const payload = await getPayload({ config })

  const result = await runSeed(payload, {
    // During a deployment, do not invent an admin account: the generated password
    // would be written into the build log.
    skipUser: process.env.SEED_SKIP_USER === '1',
  })

  if (result.warnings.length > 0) {
    console.warn(`\nSeeding finished with ${result.warnings.length} warning(s):`)
    result.warnings.forEach((warning) => console.warn(`  • ${warning}`))
  }

  process.exit(0)
}

main().catch((error) => {
  // Printed in full, and deliberately loud: when this runs inside a Vercel build
  // the log is the only diagnostic available.
  console.error('\n────────────────────────────────────────────────────────')
  console.error('SEEDING FAILED')
  console.error('────────────────────────────────────────────────────────')
  console.error(error instanceof Error ? `${error.name}: ${error.message}` : String(error))

  if (error instanceof Error && error.stack) {
    console.error('\nStack:')
    console.error(error.stack)
  }

  // The two things that actually cause this in practice.
  console.error('\nMost likely causes:')
  console.error(
    '  1. Cloudflare R2 is not configured or the credentials are wrong — the site',
  )
  console.error(
    '     cannot upload the photographs. Check R2_BUCKET, R2_ACCESS_KEY_ID,',
  )
  console.error('     R2_SECRET_ACCESS_KEY, R2_ENDPOINT and R2_PUBLIC_URL.')
  console.error('  2. DATABASE_URI is unreachable — check it is the Session pooler URI.')
  console.error(
    '\nThe site will still deploy. Once fixed, seed without redeploying by calling:',
  )
  console.error('  curl -X POST https://your-site.com/api/admin/seed \\')
  console.error('    -H "Authorization: Bearer $CRON_SECRET"\n')

  process.exit(1)
})
