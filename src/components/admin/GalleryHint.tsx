import React from 'react'

/**
 * Explains, in the place where the question actually arises, that an event's
 * photo set is built by tagging photos in the media library rather than by
 * attaching a second list of images here.
 */
export const GalleryHint: React.FC = () => (
  <div
    style={{
      border: '1px dashed var(--theme-elevation-200)',
      borderRadius: '4px',
      padding: '1rem 1.25rem',
      marginTop: '0.5rem',
      color: 'var(--theme-elevation-700)',
    }}
  >
    <strong style={{ display: 'block', marginBottom: '0.35rem' }}>
      Adding this event’s photos
    </strong>
    <span style={{ lineHeight: 1.6 }}>
      Photos are not attached here. Go to <em>Images &amp; Videos</em>, drag in the shots from this
      event (you can select many at once), then set their <em>Event</em> to this one. Tick{' '}
      <em>Show on the Gallery page</em> on the ones you want in the public Gallery. They will appear
      on this event’s page automatically.
    </span>
  </div>
)

export default GalleryHint
