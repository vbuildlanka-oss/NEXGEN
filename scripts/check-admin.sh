#!/usr/bin/env bash
# Verifies the admin panel actually renders, not just that /admin returns 200.
#
# Exists because a 200 response is not evidence here. On the first deployment the
# admin returned 200 with 105 KB of correct HTML and still rendered as a blank
# page: NEXT_PUBLIC_SERVER_URL was a placeholder, so Payload rejected the admin's
# own API calls on CSRF grounds and the panel never bootstrapped. Only a real
# browser, checking for laid-out text and focusable inputs, catches that.
set -uo pipefail

cd "$(dirname "$0")/.."

BASE="${1:-http://127.0.0.1:3000}"
START_SERVER="${START_SERVER:-1}"

if [[ "$START_SERVER" == "1" ]]; then
  node node_modules/next/dist/bin/next start > /projects/sandbox/.research/admin-srv.log 2>&1 &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null' EXIT
  for _ in $(seq 1 90); do
    curl -sf -o /dev/null "$BASE/" && break
    sleep 1
  done
fi

agent-browser open "$BASE/admin" >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1
sleep 7

echo "admin panel at $BASE/admin:"
agent-browser eval "(()=>{
  let total = 0;
  const counts = [...document.querySelectorAll('link[rel=stylesheet]')].map((l) => {
    let n = 0;
    try { n = l.sheet ? l.sheet.cssRules.length : -1 } catch (e) { n = -2 }
    total += Math.max(n, 0);
    return n;
  });
  return JSON.stringify({
    stylesheets: counts.length,
    ruleCounts: counts,
    totalRules: total,
    visibleTextLength: document.body.innerText.length,
    inputs: document.querySelectorAll('input').length,
    bodyHeight: Math.round(document.body.getBoundingClientRect().height),
    verdict:
      document.body.innerText.length > 20 && document.querySelectorAll('input').length > 0
        ? 'RENDERS'
        : 'BLANK — the admin panel is not usable'
  })
})()"

agent-browser screenshot /projects/sandbox/.kiro/artifacts/screenshots/admin-check.png >/dev/null 2>&1
echo "screenshot: .kiro/artifacts/screenshots/admin-check.png"
