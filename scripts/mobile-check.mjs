/**
 * True mobile-width verification.
 *
 * agent-browser cannot resize its viewport, so this drives Chrome over the
 * DevTools protocol directly: it sets a 390x844 device viewport (iPhone-class),
 * loads each page, screenshots it and reports any horizontal overflow.
 *
 *   node scripts/mobile-check.mjs http://127.0.0.1:3000
 */
import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.argv[2] || 'http://127.0.0.1:3000'
const SHOTS = process.env.SHOTS || '/projects/sandbox/.kiro/artifacts/screenshots'
const CHROME = process.env.AGENT_BROWSER_EXECUTABLE_PATH || '/usr/local/bin/chrome'
const PORT = 9333

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    `--remote-debugging-port=${PORT}`,
    '--no-sandbox',
    '--disable-gpu',
    '--hide-scrollbars',
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function endpoint() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${PORT}/json/version`)
      return (await response.json()).webSocketDebuggerUrl
    } catch {
      // Chrome is still starting up.
    }
    await sleep(250)
  }
  throw new Error('Chrome did not expose a debugging endpoint')
}

async function main() {
  const wsUrl = await endpoint()
  const { default: WebSocket } = await import('ws').catch(() => ({ default: null }))
  if (!WebSocket) throw new Error('ws module unavailable')

  const socket = new WebSocket(wsUrl)
  let id = 0
  const pending = new Map()

  socket.on('message', (raw) => {
    const message = JSON.parse(raw.toString())
    if (message.id && pending.has(message.id)) {
      pending.get(message.id)(message)
      pending.delete(message.id)
    }
  })

  await new Promise((resolve) => socket.on('open', resolve))

  const send = (method, params = {}, sessionId) =>
    new Promise((resolve) => {
      id += 1
      pending.set(id, resolve)
      socket.send(JSON.stringify({ id, method, params, sessionId }))
    })

  const { result: target } = await send('Target.createTarget', { url: 'about:blank' })
  const { result: attached } = await send('Target.attachToTarget', {
    targetId: target.targetId,
    flatten: true,
  })
  const session = attached.sessionId

  await send('Page.enable', {}, session)
  await send('Runtime.enable', {}, session)
  await send(
    'Emulation.setDeviceMetricsOverride',
    { width: 390, height: 844, deviceScaleFactor: 2, mobile: true },
    session,
  )

  await mkdir(SHOTS, { recursive: true })

  const pages = [
    '/',
    '/events',
    '/events/ember-nights',
    '/gallery',
    '/contact',
    '/our-story',
    '/updates',
    '/updates/next-run-of-nights',
  ]
  let failures = 0

  for (const page of pages) {
    await send('Page.navigate', { url: `${BASE}${page}` }, session)
    await sleep(2500)

    // Scroll through the page as a visitor would: elements revealed or pinned
    // further down can overflow even when the initial viewport is clean.
    for (let i = 0; i < 4; i += 1) {
      await send(
        'Runtime.evaluate',
        { expression: 'window.scrollBy(0, window.innerHeight * 0.9)' },
        session,
      )
      await sleep(500)
    }
    await send('Runtime.evaluate', { expression: 'window.scrollTo(0, 0)' }, session)
    await sleep(600)

    const { result: viewport } = await send(
      'Runtime.evaluate',
      { expression: 'window.innerWidth + "x" + window.innerHeight', returnByValue: true },
      session,
    )
    const { result: overflow } = await send(
      'Runtime.evaluate',
      {
        expression: 'document.documentElement.scrollWidth - window.innerWidth',
        returnByValue: true,
      },
      session,
    )

    /**
     * Document scroll width alone is not enough: `overflow-x: clip` on the body
     * means an element wider than the screen is silently cut off instead of
     * producing a scrollbar. So also check every text element against its own
     * container, which is what catches a headline running off the edge.
     */
    const { result: clipped } = await send(
      'Runtime.evaluate',
      {
        expression: `(() => {
          const bad = []
          for (const el of document.querySelectorAll('h1,h2,h3,h4,p,a,span,li')) {
            // Screen-reader-only text is deliberately collapsed to a 1px box and
            // clipped, so it always "overflows". Only elements laid out at a real
            // width can genuinely be cut off.
            if (el.clientWidth < 40) continue
            const over = el.scrollWidth - el.clientWidth
            if (over > 2) {
              bad.push(el.tagName.toLowerCase() + ' +' + over + 'px: ' + el.textContent.trim().slice(0, 40))
            }
          }
          return bad.slice(0, 4)
        })()`,
        returnByValue: true,
      },
      session,
    )

    /**
     * `overflow-wrap: break-word` stops a long word overflowing, but it does so
     * by breaking it mid-word — "ENTERTAINMEN / T" — which looks like a bug.
     * The guard should never actually fire, so this measures the longest word in
     * each heading against its container using that element's real font.
     */
    const { result: broken } = await send(
      'Runtime.evaluate',
      {
        expression: `(() => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')
          const bad = []
          for (const el of document.querySelectorAll('h1,h2,h3')) {
            if (el.clientWidth < 40) continue
            const style = getComputedStyle(el)
            ctx.font = style.fontWeight + ' ' + style.fontSize + ' ' + style.fontFamily
            const words = el.textContent.trim().split(/\\s+/)
            for (const word of words) {
              const width = ctx.measureText(word).width
              if (width > el.clientWidth) {
                bad.push(el.tagName.toLowerCase() + ' "' + word + '" ' + Math.round(width) + 'px > ' + el.clientWidth + 'px')
              }
            }
          }
          return bad.slice(0, 3)
        })()`,
        returnByValue: true,
      },
      session,
    )

    const brokenWords = broken.result.value || []
    const clippedElements = clipped.result.value || []
    const amount = overflow.result.value
    const label = page === '/' ? 'home' : page.replace(/\//g, '')
    const status = amount > 1 ? `OVERFLOW +${amount}px` : 'ok'
    if (amount > 1 || clippedElements.length > 0 || brokenWords.length > 0) failures += 1

    let label2 = status
    if (clippedElements.length > 0) label2 = 'CLIPPED TEXT'
    else if (brokenWords.length > 0) label2 = 'WORD TOO WIDE (will break mid-word)'

    console.log(`  ${viewport.result.value}  ${page.padEnd(12)} ${label2}`)
    clippedElements.forEach((entry) => console.log(`      ${entry}`))
    brokenWords.forEach((entry) => console.log(`      ${entry}`))

    const { result: shot } = await send(
      'Page.captureScreenshot',
      { format: 'png', captureBeyondViewport: false },
      session,
    )
    await writeFile(path.join(SHOTS, `mobile-${label}.png`), Buffer.from(shot.data, 'base64'))
  }

  socket.close()
  chrome.kill()

  if (failures > 0) {
    console.error(`\n  ${failures} page(s) have content wider than a 390px screen.`)
    process.exit(1)
  }
  console.log('\n  no horizontal overflow or clipped text at 390px')
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  chrome.kill()
  process.exit(1)
})
