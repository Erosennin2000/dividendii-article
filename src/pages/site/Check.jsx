import React from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import DividendChecker from '../../components/DividendChecker.jsx'
import { usePageMeta } from '../../lib/pageMeta.js'
import { SITE } from '../../site.js'

export default function Check() {
  const [sp] = useSearchParams()
  const family = sp.get('mode') === 'family'
  usePageMeta({ title: (family ? 'Check a late relative\'s dividends' : 'Check for unclaimed dividends') + ' | Dividendii', description: 'Send us your name and we check the Nigerian registrars for unclaimed dividends in your name. Free to ask. We reply within 24 hours.' })
  return (
    <>
      <section className="hero"><div className="wrap">
        <div>
          <h1>{family ? 'Check a late relative\'s shares.' : 'Find dividends in your name.'}</h1>
          <p className="lede">{family ? 'Send the name exactly as it would have appeared on their share certificates, including any former names. If we find matches, we tell you which estate documents each registrar will ask for.' : 'Type your name as it would have appeared on the share certificate. We check the registrars by hand and reply on WhatsApp within 24 hours.'}</p>
          {family && <div className="card" style={{ marginTop: 24, background: 'var(--blue-dk)', border: 0, color: '#fff' }}><div style={{ fontWeight: 600 }}>You'll need, eventually</div><ul style={{ margin: '8px 0 0', paddingLeft: 18, color: '#C9D6E4', lineHeight: 1.7 }}><li>Death certificate</li><li>Letters of administration (no will) or probate (with a will)</li><li>Your own BVN and ID as administrator or executor</li></ul><div className="small" style={{ color: '#C9D6E4', marginTop: 8 }}>Nothing is needed to send a request.</div></div>}
        </div>
        <DividendChecker />
      </div></section>
      <section className="block"><div className="wrap">
        <div className="sechead"><h2>What happens after a match</h2><p>A match is a likely record, not a promise. The registrar confirms it against your BVN and NIN before any money moves.</p></div>
        <ol className="how"><li><h3>Confirm it's you</h3><p>We ask for your BVN and NIN only after we find a match, and only after you have agreed to our privacy notice.</p></li><li><h3>Sign one POA</h3><p>It lets us act for you at every registrar. You pay ₦{SITE.upfront} per company, plus VAT, to start each claim. You can revoke the POA any time.</p></li><li><h3>We chase</h3><p>Each registrar has its own checklist. We update you on WhatsApp at every step.</p></li><li><h3>Paid to your bank</h3><p>Registrars pay you directly into your bank account. We take our {SITE.success}% fee on the money recovered. <Link to="/pricing">See pricing</Link></p></li></ol>
      </div></section>
    </>
  )
}
