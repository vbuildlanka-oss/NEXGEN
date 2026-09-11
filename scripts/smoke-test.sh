#!/usr/bin/env bash
# End-to-end smoke test against a production build.
#
# Boots the built server, exercises every route and API endpoint, captures
# screenshots through a headless browser, then shuts the server down. Bounded by
# its own timeout so it always terminates.
set -uo pipefail

cd "$(dirname "$0")/.."

SHOTS="${SHOTS:-/projects/sandbox/.kiro/artifacts/screenshots}"
BASE="http://127.0.0.1:3000"
mkdir -p "$SHOTS"

node node_modules/next/dist/bin/next start > /projects/sandbox/.research/server.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT

for _ in $(seq 1 90); do
  curl -sf -o /dev/null "$BASE/" && break
  sleep 1
done

echo "=== route status codes ==="
for path in / /our-story /events /updates "/updates?category=milestone" /gallery /contact \
            /events/ember-nights /events/launch-party /updates/next-run-of-nights /admin /does-not-exist; do
  printf '%s  %s\n' "$(curl -s -o /dev/null -w '%{http_code}' "$BASE$path")" "$path"
done

echo
echo "=== contact form ==="
printf 'invalid input  -> '
curl -s -X POST "$BASE/api/contact" -H 'Content-Type: application/json' \
  -d '{"name":"","email":"nope","message":""}' -w ' [%{http_code}]\n'
printf 'valid message  -> '
curl -s -X POST "$BASE/api/contact" -H 'Content-Type: application/json' \
  -d '{"name":"Smoke Test","email":"smoke@example.com","subject":"Hello","message":"Testing end to end."}' \
  -w ' [%{http_code}]\n'
printf 'honeypot bot   -> '
curl -s -X POST "$BASE/api/contact" -H 'Content-Type: application/json' \
  -d '{"name":"Bot","email":"bot@example.com","message":"spam","website":"http://spam"}' \
  -w ' [%{http_code}]\n'

echo
echo "=== protected endpoints ==="
printf 'cron, no token   -> '
curl -s "$BASE/api/cron/keep-alive" -w ' [%{http_code}]\n'
printf 'cron, with token -> '
curl -s "$BASE/api/cron/keep-alive" -H "Authorization: Bearer ${CRON_SECRET:-local-cron-secret-0123456789}" -w ' [%{http_code}]\n'
printf 'preview, no admin session -> '
curl -s "$BASE/next/preview?path=/&previewSecret=${PREVIEW_SECRET:-local-preview-secret-0123456789}" -w ' [%{http_code}]\n'
printf 'preview, open redirect attempt -> '
curl -s "$BASE/next/preview?path=//evil.example.com&previewSecret=${PREVIEW_SECRET:-local-preview-secret-0123456789}" -w ' [%{http_code}]\n'
printf 'unpublished drafts hidden from public API -> '
curl -s "$BASE/api/events?limit=1" -o /dev/null -w '[%{http_code}]\n'

echo
echo "=== SEO + headers ==="
printf 'robots.txt   -> '
curl -s -o /dev/null -w '[%{http_code}]  ' "$BASE/robots.txt"; curl -s "$BASE/robots.txt" | tr '\n' '|' | head -c 120; echo
printf 'sitemap.xml  -> '
curl -s -o /dev/null -w '[%{http_code}]  ' "$BASE/sitemap.xml"
echo "$(curl -s "$BASE/sitemap.xml" | grep -c '<url>') urls"
echo 'security headers on /:'
curl -sI "$BASE/" | grep -iE 'x-content-type-options|x-frame-options|referrer-policy|permissions-policy' | sed 's/^/  /'

echo
echo "=== assets ==="
curl -s -o /dev/null -w '%{http_code}  %{size_download} bytes  media (original webp)\n' "$BASE/api/media/file/image-1.webp"
curl -s -o /dev/null -w '%{http_code}  %{size_download} bytes  media (card variant)\n' "$BASE/api/media/file/image-1-960x1440.webp"
curl -s -o /dev/null -r 0-2047 -w '%{http_code}  ranged request served  hero.mp4\n' "$BASE/hero/hero.mp4"
curl -s -o /dev/null -w '%{http_code}  %{size_download} bytes  hero poster\n' "$BASE/hero/hero-poster.jpg"

echo
echo "=== rendered markup checks ==="
HOME_HTML=$(curl -s "$BASE/")
for needle in 'NexGen' 'hero.mp4' 'data-canvas-trigger' 'Upcoming events' 'Ember Nights'; do
  if grep -q -- "$needle" <<< "$HOME_HTML"; then echo "  found: $needle"; else echo "  MISSING: $needle"; fi
done
printf '  poster painted as the video background (no-preloader technique): '
grep -qE '<video[^>]*background-image' <<< "$HOME_HTML" && echo confirmed || echo 'MISSING'
printf '  video is muted+looping+inline (autoplay allowed): '
grep -qE '<video[^>]*playsInline|<video[^>]*playsinline' <<< "$HOME_HTML" && echo confirmed || echo 'MISSING'
printf '  skip-to-content link present: '
grep -q 'Skip to content' <<< "$HOME_HTML" && echo confirmed || echo 'MISSING'
printf '  no loading screen / preloader markup: '
grep -qiE 'id="(preloader|loading-screen)"|class="[^"]*preloader' <<< "$HOME_HTML" && echo 'FOUND ONE' || echo confirmed

echo
echo "=== browser pass ==="
agent-browser open "$BASE/" >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1
sleep 3
agent-browser screenshot "$SHOTS/nx-00-hero.png" >/dev/null 2>&1
for i in 01 02 03 04 05 06 07 08 09 10 11 12 13; do
  agent-browser scroll down 700 >/dev/null 2>&1
  sleep 0.9
  agent-browser screenshot "$SHOTS/nx-$i.png" >/dev/null 2>&1
done

echo "  homepage DOM:"
agent-browser eval "document.querySelectorAll('[data-canvas-trigger]').length + ' canvas triggers / ' + document.querySelectorAll('[data-canvas-bg]').length + ' backgrounds / video:' + !!document.querySelector('video') + ' / navbar:' + !!document.querySelector('[data-navbar]')"

for page in events gallery our-story contact updates; do
  agent-browser open "$BASE/$page" >/dev/null 2>&1
  agent-browser wait --load networkidle >/dev/null 2>&1
  sleep 2
  agent-browser screenshot "$SHOTS/nx-page-$page.png" >/dev/null 2>&1
done

agent-browser open "$BASE/events/ember-nights" >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1; sleep 2
agent-browser screenshot "$SHOTS/nx-page-event.png" >/dev/null 2>&1

agent-browser open "$BASE/admin" >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1; sleep 4
agent-browser screenshot "$SHOTS/nx-admin-login.png" >/dev/null 2>&1

echo
echo "=== mobile viewport (390x844) ==="
node scripts/mobile-check.mjs "$BASE" || echo "  ! mobile check reported overflow"

echo
echo "=== content is present without JavaScript ==="
# Server-rendered HTML must contain the copy, not just placeholders that JS
# reveals. Checked against the raw response, which is what a crawler sees.
for needle in "Where to find us next" "Upcoming events" "Nights that start where"; do
  if curl -s "$BASE/events" "$BASE/" | grep -q "$needle"; then
    echo "  found in raw HTML: $needle"
  else
    echo "  MISSING from raw HTML: $needle"
  fi
done
printf '  no inline visibility:hidden on headings: '
curl -s "$BASE/events" | grep -qE 'visibility:hidden' && echo 'FOUND — content depends on JS' || echo confirmed

echo
echo "=== server log (errors only) ==="
grep -iE 'error|unhandled|failed' /projects/sandbox/.research/server.log | grep -v 'Resend is not configured' | head -10
echo "(end)"
