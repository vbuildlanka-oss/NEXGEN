import type { NextRequest } from 'next/server'

import { getPayloadClient } from '@/lib/payload'

/**
 * Contact form endpoint.
 *
 * This is the one piece of the site that genuinely needs a server function
 * (brief §6): the Resend API key must stay server-side, so the browser posts here
 * and this route sends the email.
 *
 * The submission is written to the database first and emailed second. If Resend
 * is down, rate-limited or simply not configured yet, the enquiry is still
 * captured and readable in the admin panel — losing a booking enquiry to a
 * third-party outage is not an acceptable failure mode.
 */

/** Runs on the Node runtime because it uses Payload's local API. */
export const runtime = 'nodejs'

type Payload = {
  name?: unknown
  email?: unknown
  subject?: unknown
  message?: unknown
  website?: unknown
}

const asString = (value: unknown, max: number): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

/** Escapes user-supplied text before it is placed into the notification email. */
const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

export async function POST(request: NextRequest): Promise<Response> {
  let body: Payload

  try {
    body = (await request.json()) as Payload
  } catch {
    return Response.json({ error: 'Invalid request body.' }, { status: 400 })
  }

  // Honeypot: a filled hidden field means a bot. Answer 200 so it learns nothing.
  if (asString(body.website, 200).length > 0) {
    return Response.json({ ok: true })
  }

  const name = asString(body.name, 120)
  const email = asString(body.email, 200)
  const subject = asString(body.subject, 200) || 'Website enquiry'
  const message = asString(body.message, 5000)

  if (!name || !email || !message) {
    return Response.json({ error: 'Please fill in your name, email and message.' }, { status: 400 })
  }

  if (!EMAIL_PATTERN.test(email)) {
    return Response.json({ error: 'That email address does not look right.' }, { status: 400 })
  }

  const payload = await getPayloadClient()

  let recordId: number | string | null = null

  try {
    const created = await payload.create({
      collection: 'contact-messages',
      // The public cannot create these rows directly; this route is trusted.
      overrideAccess: true,
      data: { name, email, subject, message, emailDelivered: false },
    })
    recordId = created.id
  } catch (error) {
    console.error('[contact] could not store the submission', error)
    // Keep going: delivering the email still helps even if the write failed.
  }

  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.CONTACT_EMAIL_TO
  const from = process.env.CONTACT_EMAIL_FROM

  if (!apiKey || !to || !from) {
    console.warn(
      '[contact] Resend is not configured (RESEND_API_KEY / CONTACT_EMAIL_TO / CONTACT_EMAIL_FROM). ' +
        'The message was saved to the admin panel only.',
    )

    // Not an error for the visitor: their message did reach NexGen.
    return Response.json({ ok: true, emailed: false })
  }

  try {
    const { Resend } = await import('resend')
    const resend = new Resend(apiKey)

    const { error } = await resend.emails.send({
      from,
      to: [to],
      // So hitting reply in the mail client answers the sender, not the site.
      replyTo: email,
      subject: `NexGen website — ${subject}`,
      text: [
        `From: ${name} <${email}>`,
        `Subject: ${subject}`,
        '',
        message,
        '',
        '— Sent from the NexGen website contact form.',
      ].join('\n'),
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.6;color:#080808">
          <h2 style="margin:0 0 12px">New message from the NexGen website</h2>
          <p style="margin:0 0 4px"><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 4px"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <p style="margin:0 0 16px"><strong>Subject:</strong> ${escapeHtml(subject)}</p>
          <div style="padding:16px;background:#f4f4f4;border-left:3px solid #D93220;white-space:pre-line">${escapeHtml(
            message,
          )}</div>
        </div>
      `,
    })

    if (error) throw new Error(error.message)

    if (recordId !== null) {
      await payload
        .update({
          collection: 'contact-messages',
          id: recordId,
          overrideAccess: true,
          data: { emailDelivered: true },
        })
        .catch((error) => console.error('[contact] could not flag the email as sent', error))
    }

    return Response.json({ ok: true, emailed: true })
  } catch (error) {
    console.error('[contact] Resend delivery failed', error)

    // The message is safely stored, so do not make the visitor retype it.
    if (recordId !== null) {
      return Response.json({ ok: true, emailed: false })
    }

    return Response.json(
      { error: 'We could not send your message just now. Please email us directly.' },
      { status: 502 },
    )
  }
}
