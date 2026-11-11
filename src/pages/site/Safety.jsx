import React from 'react'
import { SITE } from '../../site.js'
import { usePageMeta } from '../../lib/pageMeta.js'

export default function Safety() {
  usePageMeta({ title: 'Safety and where we stand | Dividendii', description: 'Who holds what, how to check us, how to report fraud, and where we stand with the SEC.' })
  return (
    <>
      <div className="wrap page-hero"><h1>How we keep your money and details safe.</h1><p>Investing has burned a lot of Nigerians. So here is who holds what, where we stand with the regulator, and how to reach us.</p></div>
      <section className="block alt"><div className="wrap">
        <div className="safety" style={{ marginTop: 0 }}>
          {[['Recovered money goes to you', 'When a registrar pays, the money goes into a bank account in your name. We do not hold it, and we only take our fee on what is paid.'], ['Shares in your own name at CSCS', 'When investing opens, every share you buy will be registered to your Clearing House Number at the Central Securities Clearing System. Dividendii can\'t move them without your instruction.'], ['Where we stand with the SEC', SITE.legal + ' (' + SITE.rc + ') has applied to the Securities and Exchange Commission to be registered as a digital sub-broker. The application is pending, and we are not yet registered. We will say so until we are.'], ['Your data, protected', 'BVN and NIN are used only to verify you and match registrar records. You agree to our privacy notice before we collect anything.'], ['Official channels only', 'Our official lines are WhatsApp and phone ' + SITE.phone + ' and ' + SITE.email + '. If someone calls from another number claiming to be Dividendii, hang up and report it below.'], ['Tell us if something looks wrong', 'If something looks wrong or slow, message us on WhatsApp or at ' + SITE.email + '. We reply during ' + SITE.hours + '.']].map(([h, p]) => <div className="safe-item" key={h}><h3>{h}</h3><p>{p}</p></div>)}
        </div>
      </div></section>
      <section className="block" id="status"><div className="wrap">
        <div className="grid g2">
          <div className="card" id="complaints"><h3 style={{ fontSize: 19 }}>Complaints</h3><p className="muted" style={{ marginTop: 8 }}>Send your complaint by email or WhatsApp. We acknowledge it within 1 working day and give you a reference. If we cannot resolve it, you can take it to the SEC with that reference.</p><a className="btn btn-o" href={'mailto:' + SITE.email + '?subject=Complaint'} style={{ marginTop: 14 }}>Email a complaint</a></div>
          <div className="card" id="fraud"><h3 style={{ fontSize: 19 }}>Report fraud</h3><p className="muted" style={{ marginTop: 8 }}>Got a call, SMS or WhatsApp claiming to be Dividendii? Send it to <a href={'mailto:' + SITE.email}>{SITE.email}</a> or WhatsApp <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer">{SITE.phone}</a>. We never ask for your PIN, OTP or card details.</p></div>
        </div>
      </div></section>
    </>
  )
}
