import React from 'react'
import { Link } from 'react-router-dom'
import { SITE, LEGAL_REVIEWED } from '../../site.js'
import { usePageMeta } from '../../lib/pageMeta.js'

// Plain-English drafts for the owner and a lawyer to review. Flip LEGAL_REVIEWED in src/site.js when approved.
export default function Legal() {
  usePageMeta({ title: 'Legal: terms, privacy, risk, cookies and complaints | Dividendii', description: 'The terms of use, privacy notice, risk disclosure, cookie notice and complaints policy for Dividendii.' })
  const mail = <a href={'mailto:' + SITE.email}>{SITE.email}</a>
  return (
    <>
      <div className="wrap page-hero"><h1>Legal</h1><p>Plain-English versions of the rules that apply when you use {SITE.brand}.</p>
        {!LEGAL_REVIEWED && <div className="draftflag" role="note">Draft wording, pending legal review.</div>}
        <p className="muted small" style={{ marginTop: 14 }}>Jump to: <a href="#terms">Terms</a> · <a href="#privacy">Privacy</a> · <a href="#risk">Risk disclosure</a> · <a href="#cookies">Cookies</a> · <a href="#complaints-policy">Complaints policy</a></p></div>
      <section className="block"><div className="wrap legal-page">

        <h2 id="terms">Terms of use</h2>
        <p><strong>Who we are.</strong> {SITE.legal}, {SITE.rc}, {SITE.address}. In these terms, "we" and "us" mean {SITE.legal}.</p>
        <p><strong>What we do.</strong> We help people find and recover unclaimed dividends held by Nigerian registrars. We are not a bank and we are not an adviser. {SITE.legal} has applied to the Securities and Exchange Commission, Nigeria, to be registered as a digital sub-broker. The application is pending and we are not yet registered. We do not yet offer investing or trading.</p>
        <p><strong>The start fee.</strong> A dividend check costs ₦{SITE.upfront} per company, plus VAT, paid on Paystack's secure page before we send your forms. We then send your forms to the registrars and give you a first update {SITE.reply}.</p>
        <p><strong>Our fees.</strong> If you choose to start a claim, you pay ₦{SITE.upfront} per company owing you, plus VAT at 7.5%, and then {SITE.success}% of the money recovered, taken only once it is paid to your bank account. Registrars pay recovered money straight into a bank account in your name.</p>
        <p><strong>No guarantee.</strong> A possible match is not a promise of payment. Whether money is paid, and how long it takes, depends on the registrar and on the records and documents available. How long a claim takes varies. Many claims close in 4 to 6 weeks, but some take longer.</p>
        <p><strong>Your part.</strong> You must give us true and complete information and tell us if anything changes. You must be the owner of the shares, or the executor or administrator of the owner's estate, to start a claim.</p>
        <p><strong>Power of attorney.</strong> To act for you at registrars we need a signed power of attorney. You can withdraw it at any time by telling us in writing at {mail}.</p>
        <p><strong>Limits.</strong> We are responsible for our own mistakes. We are not responsible for delays or decisions by registrars, companies or other third parties, or for losses that we could not reasonably have foreseen. Nothing in these terms limits a right you have under Nigerian law that cannot be limited.</p>
        <p><strong>Changes and law.</strong> We may update these terms, and the date at the foot of this page will change when we do. These terms are governed by the laws of the Federal Republic of Nigeria.</p>

        <h2 id="privacy">Privacy notice</h2>
        <p><strong>Who is responsible.</strong> {SITE.legal} decides how your personal data is used. Contact us at {mail} or {SITE.phone}.</p>
        <p><strong>What we collect.</strong> When you start a dividend check: your full name, any former or maiden name, your email address, your CHN or CSCS number if you have one, the companies you hold shares in, your BVN, your bank name and account number, the address, phone number and next of kin you gave when you bought the shares, a passport photograph, and your drawn signature. When you join the investing waitlist: your name, WhatsApp number, email address and state. We ask for your agreement before we send anything to a registrar. Confirming your email creates an account so you can follow your claims; if you set a password, we store only a scrambled (hashed) version of it. When you send feedback, we keep your message with your name and email.</p>
        <p><strong>Why we use it.</strong> To check the registrars for you, to contact you about your request, and to run our service. Our legal basis is your agreement, which you give by ticking the box on the form, and our need to carry out your request.</p>
        <p><strong>Who sees it.</strong> Our team, and the services that run this website (our web hosts). We never sell your data. Payments are handled by Paystack, which receives your email address and the amount; we never see or store your card details. When you send a dividend check, we email the completed registrar form, your signed letter of authority, your photograph and the details above to the registrar of each company you listed, and to no one else. A confirmation goes to you.</p>
        <p><strong>How long we keep it.</strong> If you do not become a customer, we delete your request after 12 months. If you do, we keep your records for as long as the law requires.</p>
        <p><strong>Your rights.</strong> Under the Nigeria Data Protection Act you can ask to see your data, correct it, delete it, or object to how we use it, and you can withdraw your agreement at any time. Write to {mail}. You can also complain to the Nigeria Data Protection Commission.</p>
        <p><strong>Security.</strong> We store your request on our web host's database, protected by password, and only our team can read it.</p>

        <h2 id="risk">Risk disclosure</h2>
        <p><strong>Recovering dividends.</strong> A match is not a promise. A registrar may not hold money in your name, may not accept your documents, or may take a long time. Our {SITE.success}% fee is taken only on money actually paid to you. The ₦{SITE.upfront} per company start fee (plus VAT) is paid before we send your forms, and before any registrar has confirmed there is money in your name. You may pay it and find there is nothing to recover.</p>
        <p><strong>Investing.</strong> We do not yet offer investing. When we do, the value of investments can go down as well as up, and you may get back less than you put in. Shares that rarely trade can be hard to sell. Past performance does not tell you what will happen next. {SITE.brand} does not give investment advice, and what you read on this site, including our articles, is for education only.</p>
        <p><strong>Scams.</strong> We never ask for your PIN, OTP or card details, and our fees are paid only on Paystack's secure page, never to a personal account. If someone does, stop and tell us at {mail}.</p>

        <h2 id="cookies">Cookie notice</h2>
        <p>The public pages of this website do not use cookies. To see how many people visit each page, we add one to a daily count for the page. That count has no cookie, no IP address and nothing that identifies you. If you are one of our staff and sign in to the article editor, we use a cookie that keeps you signed in and keeps your session safe.</p>

        <h2 id="complaints-policy">Complaints policy</h2>
        <p>If you are unhappy, tell us by email to {mail} or by WhatsApp on {SITE.phone}. We will:</p>
        <ul>
          <li>acknowledge your complaint within 1 working day and give you a reference;</li>
          <li>look into it and tell you what we found and what we will do;</li>
          <li>and, if you are still not satisfied, tell you how to take it to the Securities and Exchange Commission, quoting your reference.</li>
        </ul>
        <p className="muted small" style={{ marginTop: 32 }}>Last updated: 11 November 2026. <Link to="/safety">Back to Safety</Link></p>
      </div></section>
    </>
  )
}
