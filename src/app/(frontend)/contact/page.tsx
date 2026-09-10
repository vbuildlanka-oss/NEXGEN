import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'

import { ContactForm } from '@/components/contact/ContactForm'
import { SplitHeading } from '@/components/motion/SplitHeading'
import { PageHeader } from '@/components/ui/PageHeader'
import { SOCIAL_LABELS } from '@/components/site/types'
import { getContactInfo } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Contact Us',
  description: 'Get in touch with NexGen Entertainment about bookings, collaborations and press.',
}

export default async function ContactPage() {
  const { isEnabled: draft } = await draftMode()
  const contact = await getContactInfo({ draft })

  const details = [
    { label: 'General enquiries', value: contact?.email, href: `mailto:${contact?.email}` },
    {
      label: 'Bookings & artists',
      value: contact?.bookingEmail,
      href: `mailto:${contact?.bookingEmail}`,
    },
    { label: 'Phone', value: contact?.phone, href: `tel:${contact?.phone?.replace(/\s+/g, '')}` },
  ].filter((detail) => Boolean(detail.value))

  return (
    <>
      <PageHeader
        eyebrow={contact?.eyebrow ?? 'Contact Us'}
        heading={contact?.heading ?? 'Get in touch'}
        standfirst={contact?.standfirst}
        image={contact?.image}
      />

      <section className="section-pad">
        <div className="container-site grid gap-[clamp(2.5rem,6vw,5rem)] lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div>
            <SplitHeading as="h2" className="mb-8 text-[clamp(1.6rem,3.2vw,2.4rem)]">
              Send us a message
            </SplitHeading>
            <ContactForm
              successMessage={
                contact?.formSuccessMessage ??
                'Thanks — your message is on its way. We’ll come back to you shortly.'
              }
            />
          </div>

          <aside className="flex flex-col gap-8">
            {details.length > 0 && (
              <div className="border border-hairline bg-surface p-6">
                <p className="eyebrow mb-5">Reach us directly</p>
                <dl className="flex flex-col gap-5">
                  {details.map((detail) => (
                    <div key={detail.label}>
                      <dt className="text-small tracking-[0.14em] text-chrome-dim uppercase">
                        {detail.label}
                      </dt>
                      <dd className="mt-1">
                        <a
                          href={detail.href}
                          className="text-body-lg text-chrome-bright underline decoration-transparent underline-offset-4 transition-colors hover:text-ember hover:decoration-current"
                        >
                          {detail.value}
                        </a>
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {(contact?.address || contact?.openingHours) && (
              <div className="border border-hairline p-6">
                <p className="eyebrow mb-4">Where we are</p>
                {contact?.address && (
                  // Preserve the line breaks exactly as typed in the admin panel.
                  <p className="whitespace-pre-line text-chrome">{contact.address}</p>
                )}
                {contact?.openingHours && (
                  <p className="mt-4 text-small text-chrome-dim">{contact.openingHours}</p>
                )}
              </div>
            )}

            {(contact?.socials ?? []).length > 0 && (
              <div className="border border-hairline p-6">
                <p className="eyebrow mb-4">Follow NexGen</p>
                <ul className="flex flex-col gap-2">
                  {(contact?.socials ?? []).map((social) => (
                    <li key={social.url}>
                      <a
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group inline-flex items-center gap-2 text-chrome transition-colors hover:text-ember"
                      >
                        <span
                          aria-hidden
                          className="h-[2px] w-4 bg-nexgen transition-all duration-300 group-hover:w-7"
                        />
                        {social.label || SOCIAL_LABELS[social.platform] || social.platform}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      </section>
    </>
  )
}
