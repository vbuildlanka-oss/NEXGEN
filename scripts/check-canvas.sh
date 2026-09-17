#!/usr/bin/env bash
# Visual check for the menu and the homepage photo-canvas section.
set -uo pipefail

cd "$(dirname "$0")/.."

BASE="${1:-http://127.0.0.1:3000}"
SHOTS="${SHOTS:-.artifacts/screenshots}"
mkdir -p "$SHOTS"

if [[ "${START_SERVER:-1}" == "1" ]]; then
  node node_modules/next/dist/bin/next start > /projects/sandbox/.research/canvas-srv.log 2>&1 &
  SERVER_PID=$!
  trap 'kill "$SERVER_PID" 2>/dev/null' EXIT
  for _ in $(seq 1 90); do curl -sf -o /dev/null "$BASE/" && break; sleep 1; done
fi

echo "=== menu ==="
agent-browser open "$BASE/" >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1
sleep 3
agent-browser scroll down 900 >/dev/null 2>&1
sleep 2
agent-browser click "[aria-controls='site-menu']" >/dev/null 2>&1
sleep 2

# The panel must be on screen with visible links. Measured rather than eyeballed,
# because the previous GSAP implementation left both off-screen and at zero
# opacity while still reporting the menu as "open".
agent-browser eval "(()=>{
  const panel = document.querySelector('#site-menu');
  const style = getComputedStyle(panel);
  const links = [...panel.querySelectorAll('[data-menu-link]')];
  const first = links[0];
  const rect = first ? first.getBoundingClientRect() : null;
  return JSON.stringify({
    expanded: document.querySelector('[aria-controls=site-menu]').getAttribute('aria-expanded'),
    panelOpacity: style.opacity,
    panelTransform: style.transform,
    linkCount: links.length,
    firstLinkOpacity: first ? getComputedStyle(first).opacity : null,
    firstLinkOnScreen: rect ? rect.left >= 0 && rect.right <= window.innerWidth : null,
    verdict:
      rect && rect.left >= 0 && Number(getComputedStyle(first).opacity) > 0.9
        ? 'MENU VISIBLE'
        : 'MENU NOT USABLE'
  })
})()"
agent-browser screenshot "$SHOTS/canvas-menu.png" >/dev/null 2>&1

echo
echo "=== photo canvas: brightness of the background at each panel ==="
agent-browser open "$BASE/" >/dev/null 2>&1
agent-browser wait --load networkidle >/dev/null 2>&1
sleep 3

# Step through the canvas, capturing a frame mid-transition as well as settled.
for step in 1 2 3 4 5 6 7 8 9 10; do
  agent-browser scroll down 620 >/dev/null 2>&1
  sleep 0.7
  agent-browser screenshot "$SHOTS/canvas-step-$step.png" >/dev/null 2>&1
done

echo "  captured 10 frames through the section"
