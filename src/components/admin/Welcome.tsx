import React from 'react'

/**
 * A short orientation panel on the admin dashboard.
 *
 * The client is non-technical and asked to be able to "change everything with
 * ease", so the dashboard opens with plain-English pointers to where each thing
 * lives instead of assuming the collection names are self-explanatory.
 */
export const Welcome: React.FC = () => (
  <div
    style={{
      border: '1px solid var(--theme-elevation-150)',
      borderRadius: '4px',
      padding: '1.5rem',
      marginBottom: '2rem',
      background: 'var(--theme-elevation-50)',
    }}
  >
    <h2 style={{ marginTop: 0, marginBottom: '0.5rem' }}>Welcome to the NexGen admin</h2>
    <p style={{ marginTop: 0, marginBottom: '1rem', maxWidth: '60ch' }}>
      Everything on the public website is edited from here. Changes go live as soon as you press
      Save — use <strong>Preview</strong> on any page to see them side by side before you do.
    </p>
    <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.7, maxWidth: '70ch' }}>
      <li>
        <strong>Events</strong> — add a show, set its date, venue, line-up and ticket price. Anything
        dated in the future appears under Upcoming; past dates move to the archive on their own.
      </li>
      <li>
        <strong>Updates</strong> — news, artist and event announcements, collaborations, milestones
        and live recordings. Pick the category and it files itself in the right section.
      </li>
      <li>
        <strong>Images &amp; Videos</strong> — drag in as many photos as you like at once. Tick{' '}
        <em>Show on the Gallery page</em> and choose an event to publish them to the Gallery.
      </li>
      <li>
        <strong>Homepage</strong> — the hero video and its wording, plus the scrolling photo panels.
      </li>
      <li>
        <strong>Pages</strong> — the Our Story wording and your contact details and social links.
      </li>
      <li>
        <strong>Settings</strong> — the menu, header button, footer, announcement bar and the text
        search engines show. Add colleagues under Admin Users.
      </li>
    </ul>
    <p style={{ marginBottom: 0, marginTop: '1rem', maxWidth: '60ch' }}>
      Nothing here can be permanently broken: every Event and Update keeps a full version history, so
      an earlier draft can always be restored.
    </p>
  </div>
)

export default Welcome
