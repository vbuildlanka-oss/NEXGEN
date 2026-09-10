import { RichText as LexicalRichText } from '@payloadcms/richtext-lexical/react'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import React from 'react'

type Props = {
  data?: SerializedEditorState | null
  className?: string
}

/**
 * Renders the rich text the client writes in the admin panel.
 *
 * Payload stores rich text as a Lexical document rather than HTML, so this uses
 * the official renderer and leaves the typography to the `.prose-nexgen` styles.
 * No `dangerouslySetInnerHTML` anywhere: editor content is rendered as React
 * elements, which removes the whole class of injection risk that comes with
 * storing raw HTML.
 */
export const RichText: React.FC<Props> = ({ data, className = '' }) => {
  if (!data) return null

  return <LexicalRichText data={data} className={`prose-nexgen ${className}`} />
}
