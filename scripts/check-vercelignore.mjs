#!/usr/bin/env node
/**
 * Guards against .vercelignore excluding source code.
 *
 * This exists because of a real production failure. `.vercelignore` uses
 * gitignore syntax, where a pattern without a leading slash matches a directory
 * of that name at *any* depth — and Vercel's matching is case-insensitive. The
 * entry `Gallery/`, intended to keep 1.3 GB of camera masters out of the
 * deployment, therefore also excluded:
 *
 *   src/components/gallery/       (the GalleryGrid component)
 *   src/app/(frontend)/gallery/   (the Gallery page itself)
 *   assets-web/gallery/           (the seed photographs)
 *
 * The local build was unaffected, so this only surfaced as a module-not-found
 * error in Vercel's build log. The fix is to anchor every pattern with a leading
 * slash; this script fails the build if one is not, or if any pattern matches
 * something inside a directory the site needs.
 *
 *   node scripts/check-vercelignore.mjs
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Directories whose contents must always reach the deployment. */
const PROTECTED = ['src', 'public', 'assets-web', 'scripts', 'docs']

async function directoriesUnder(dir) {
  const found = []

  async function walk(current) {
    let entries
    try {
      entries = await readdir(current, { withFileTypes: true })
    } catch {
      return
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue
      if (entry.name === 'node_modules' || entry.name === '.next') continue

      const full = path.join(current, entry.name)
      found.push({ name: entry.name, relative: path.relative(root, full) })
      await walk(full)
    }
  }

  await walk(path.join(root, dir))
  return found
}

async function main() {
  const raw = await readFile(path.join(root, '.vercelignore'), 'utf8')

  const patterns = raw
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith('#'))

  const problems = []

  // 1. Every pattern must be anchored to the repository root.
  for (const pattern of patterns) {
    if (!pattern.startsWith('/') && !pattern.startsWith('!')) {
      problems.push(
        `"${pattern}" is not anchored. Write "/${pattern}" so it only matches at the ` +
          'repository root, not a directory of that name anywhere in the tree.',
      )
    }
  }

  // 2. No pattern may match anything inside a directory the build needs.
  const candidates = (await Promise.all(PROTECTED.map(directoriesUnder))).flat()

  for (const pattern of patterns) {
    if (pattern.startsWith('!')) continue

    const bare = pattern.replace(/^\//, '').replace(/\/$/, '')
    // Only single-segment patterns can match at arbitrary depth.
    if (bare.includes('/')) continue

    for (const candidate of candidates) {
      // Case-insensitive, matching Vercel's behaviour.
      if (candidate.name.toLowerCase() !== bare.toLowerCase()) continue
      if (pattern.startsWith('/')) continue // anchored, so it cannot reach this far

      problems.push(
        `"${pattern}" would also exclude ${candidate.relative} — the deployment would ` +
          'be missing source files that the local build has.',
      )
    }
  }

  if (problems.length > 0) {
    console.error('\n.vercelignore would break the deployment:\n')
    problems.forEach((problem) => console.error(`  • ${problem}`))
    console.error('')
    process.exit(1)
  }

  console.log(
    `.vercelignore ok — ${patterns.length} patterns, all anchored, none matching source directories`,
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
