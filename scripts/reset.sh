#!/usr/bin/env bash
# Wipes local content and reseeds from scratch.
#
# Clearing the upload directory matters: Payload renames a file when one of the
# same name already exists on disk, by incrementing a trailing number. Left in
# place, "onedineth-img-11.webp" quietly becomes "onedineth-img-12.webp" on the
# next run and the seed script can no longer recognise its own uploads.
#
# LOCAL DEVELOPMENT ONLY — this drops the database named in DATABASE_URI.
set -euo pipefail

cd "$(dirname "$0")/.."

if [[ "${1:-}" != "--yes" ]]; then
  echo "This deletes all local content and re-seeds. Re-run with --yes to confirm."
  exit 1
fi

echo "Clearing locally uploaded media…"
rm -rf public/media-uploads media

echo "Recreating the database…"
DB_NAME="$(node -e "
  const uri = process.env.DATABASE_URI || require('fs').readFileSync('.env','utf8').match(/^DATABASE_URI=(.*)$/m)?.[1] || '';
  process.stdout.write(new URL(uri).pathname.replace('/',''));
")"

su postgres -c "psql -h 127.0.0.1 -U postgres -c \"DROP DATABASE IF EXISTS ${DB_NAME}\""
su postgres -c "psql -h 127.0.0.1 -U postgres -c \"CREATE DATABASE ${DB_NAME}\""

echo "Applying migrations…"
NODE_ENV=production pnpm payload migrate

echo "Seeding…"
pnpm seed
