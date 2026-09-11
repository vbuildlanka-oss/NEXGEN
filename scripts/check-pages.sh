#!/usr/bin/env bash
# Screenshots a list of pages against a locally started production build.
#
#   ./scripts/check-pages.sh /our-story /gallery
#
# Starts the server itself and keeps it alive for the whole run — capturing
# screenshots from a server that has already exited produces a page of
# ERR_CONNECTION_REFUSED, which is easy to mistake for a broken layout.
set -uo pipefail

cd "$(dirname "$0")/.."

BASE="http://127.0.0.1:3000"
SHOTS="${SHOTS:-/projects/sandbox/.kiro/artifacts/screenshots}"
mkdir -p "$SHOTS"

node node_modules/next/dist/bin/next start > /projects/sandbox/.research/pages-srv.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null' EXIT

for _ in $(seq 1 90); do
  curl -sf -o /dev/null "$BASE/" && break
  sleep 1
done

if ! curl -sf -o /dev/null "$BASE/"; then
  echo "server never came up; see /projects/sandbox/.research/pages-srv.log"
  exit 1
fi

for path in "$@"; do
  label="$(echo "${path#/}" | tr '/' '-')"
  [[ -z "$label" ]] && label="home"

  agent-browser open "$BASE$path" >/dev/null 2>&1
  agent-browser wait --load networkidle >/dev/null 2>&1
  sleep 3
  agent-browser screenshot "$SHOTS/page-$label-top.png" >/dev/null 2>&1

  agent-browser scroll down 900 >/dev/null 2>&1
  sleep 1.5
  agent-browser screenshot "$SHOTS/page-$label-mid.png" >/dev/null 2>&1

  agent-browser scroll down 900 >/dev/null 2>&1
  sleep 1.5
  agent-browser screenshot "$SHOTS/page-$label-low.png" >/dev/null 2>&1

  echo "  captured $path"
done
