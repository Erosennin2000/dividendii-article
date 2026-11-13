import React from 'react'
import { usePageMeta } from '../../lib/pageMeta.js'
import { SITE } from '../../site.js'

/**
 * On dividendii.com, /check is served by the separate check app (see vercel.json).
 * This page only shows if that rewrite is missing, for example on a local preview.
 */
export default function Check() {
  usePageMeta({ title: 'Check for unclaimed dividends | Dividendii', description: 'Tell us the companies you hold shares in and we send your registrar forms for you.' })
  return (
    <section className="hero"><div className="wrap"><div>
      <h1>Find dividends in your name.</h1>
      <p className="lede">The dividend check is not available on this address right now. You can message us on WhatsApp and we will start it with you.</p>
      <a className="btn btn-g btn-l" href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a>
    </div></div></section>
  )
}
