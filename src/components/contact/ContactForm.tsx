'use client'

import React, { useState } from 'react'

type Props = {
  successMessage: string
}

type Status = 'idle' | 'sending' | 'sent' | 'error'

const fieldClasses =
  'w-full border border-hairline bg-ink px-4 py-3 text-body text-chrome-bright transition-colors duration-200 placeholder:text-chrome-dim focus:border-nexgen focus:outline-none'

/**
 * The contact form.
 *
 * Posts to /api/contact — a server route — rather than talking to an email
 * provider from the browser, so the Resend API key is never exposed (brief §6).
 */
export const ContactForm: React.FC<Props> = ({ successMessage }) => {
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState<string | null>(null)

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const form = event.currentTarget
    const data = new FormData(form)

    setStatus('sending')
    setError(null)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.get('name'),
          email: data.get('email'),
          subject: data.get('subject'),
          message: data.get('message'),
          // Honeypot: bots fill hidden fields, humans never see this one.
          website: data.get('website'),
        }),
      })

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as { error?: string } | null
        throw new Error(body?.error || 'Something went wrong sending your message.')
      }

      form.reset()
      setStatus('sent')
    } catch (caught) {
      setStatus('error')
      setError(caught instanceof Error ? caught.message : 'Something went wrong.')
    }
  }

  if (status === 'sent') {
    return (
      <div
        role="status"
        className="border-2 border-nexgen bg-surface p-8"
      >
        <p className="font-display text-[1.75rem] text-chrome-bright uppercase">Message sent</p>
        <p className="mt-2 text-chrome">{successMessage}</p>
        <button
          type="button"
          onClick={() => setStatus('idle')}
          className="mt-5 font-display text-[1.1rem] text-nexgen uppercase underline underline-offset-4 transition-colors hover:text-ember"
        >
          Send another
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5" noValidate={false}>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="eyebrow mb-2 block">
            Your name
          </label>
          <input
            id="contact-name"
            name="name"
            type="text"
            required
            autoComplete="name"
            className={fieldClasses}
            placeholder="Jane Perera"
          />
        </div>
        <div>
          <label htmlFor="contact-email" className="eyebrow mb-2 block">
            Email
          </label>
          <input
            id="contact-email"
            name="email"
            type="email"
            required
            autoComplete="email"
            className={fieldClasses}
            placeholder="you@example.com"
          />
        </div>
      </div>

      <div>
        <label htmlFor="contact-subject" className="eyebrow mb-2 block">
          Subject
        </label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          className={fieldClasses}
          placeholder="Booking, collaboration, press…"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="eyebrow mb-2 block">
          Message
        </label>
        <textarea
          id="contact-message"
          name="message"
          required
          rows={6}
          className={`${fieldClasses} resize-y`}
          placeholder="Tell us what you have in mind."
        />
      </div>

      {/* Honeypot — hidden from people, irresistible to bots. */}
      <div aria-hidden className="absolute h-0 w-0 overflow-hidden opacity-0">
        <label htmlFor="contact-website">Website</label>
        <input id="contact-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      {error && (
        <p role="alert" className="border-l-2 border-ember pl-3 text-small text-ember">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'sending'}
        className="inline-flex w-fit items-center justify-center rounded-[2px] border-2 border-nexgen bg-nexgen px-7 py-4 font-display text-[1.5rem] uppercase text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-ember hover:bg-ember disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'sending' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
