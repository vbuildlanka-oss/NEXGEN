#!/usr/bin/env node
/**
 * Verifies the committed import map covers every component the admin panel needs.
 *
 * Payload assembles its admin UI from a generated, committed import map. If a
 * component is registered in the config but missing from that map, the lookup
 * fails during the server render and the *entire admin panel renders as a blank
 * page* — with correct HTML, every chunk returning 200, and no browser error. The
 * only trace is one line in the server logs:
 *
 *   getFromImportMap: PayloadComponent not found in importMap
 *
 * That happened here. The storage plugin was registered conditionally on R2 being
 * configured, the map was generated on a machine where it was not, and the missing
 * entry went unnoticed until it was deployed somewhere R2 *was* configured.
 *
 * This is a build-time check because it cannot be caught by a local build: the same
 * bundle is correct or broken depending only on which environment variables happen
 * to be set when the map is generated.
 *
 *   node scripts/check-importmap.mjs
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

const IMPORT_MAP = path.join(root, 'src/app/(payload)/admin/importMap.js')
const CONFIG = path.join(root, 'src/payload.config.ts')

/**
 * Components that must always be present, regardless of what the config parse
 * finds. These come from plugins rather than from literal strings in the config.
 */
const REQUIRED = ['@payloadcms/storage-s3/client#S3ClientUploadHandler']

async function main() {
  const [map, config] = await Promise.all([
    readFile(IMPORT_MAP, 'utf8'),
    readFile(CONFIG, 'utf8'),
  ])

  const missing = []

  for (const key of REQUIRED) {
    if (!map.includes(key)) missing.push(key)
  }

  /**
   * Any component the config references by path, e.g.
   * '@/components/admin/Logo#AdminLogo'. Commented-out lines are skipped, since
   * those components are deliberately not registered.
   */
  const referenced = new Set()

  for (const line of config.split('\n')) {
    if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue

    for (const match of line.matchAll(/'(@\/[^']+#[A-Za-z0-9_]+)'/g)) {
      referenced.add(match[1])
    }
  }

  for (const key of referenced) {
    if (!map.includes(key)) missing.push(key)
  }

  if (missing.length > 0) {
    console.error('\nThe admin import map is missing components:\n')
    missing.forEach((key) => console.error(`  • ${key}`))
    console.error(
      '\nThe admin panel will render as a blank page. Regenerate the map with the\n' +
        'same plugins active as in production:\n\n' +
        '  pnpm generate:importmap\n',
    )
    process.exit(1)
  }

  console.log(
    `import map ok — ${REQUIRED.length + referenced.size} required component(s) present`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
