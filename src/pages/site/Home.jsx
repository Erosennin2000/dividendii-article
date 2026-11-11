import React from 'react'
import { Link } from 'react-router-dom'
import DividendChecker from '../../components/DividendChecker.jsx'
import FeeCalc from '../../components/FeeCalc.jsx'
import Waitlist from './Waitlist.jsx'
import { useStore } from '../../store/store.jsx'
import { Pill } from '../../components/ui.jsx'
import { SITE, upfrontWithVat } from '../../site.js'
import { computeFees, naira } from '../../utils.js'
import { usePageMeta } from '../../lib/pageMeta.js'

export default function Home() {
  const { state } = useStore()
  usePageMeta({ title: 'Find and recover unclaimed dividends in Nigeria | Dividendii', description: 'Nigerian companies may still owe you dividends. Dividendii checks the registrars for money in your name and helps you recover it into your bank account.' })
  const fee = SITE.success
  const sample = computeFees(100000, state.settings)
  return (
    <>
      <section className="hero" id="check">
        <div className="wrap">
          <div>
            <h1>Nigerian companies may still owe you dividends.</h1>
            <p className="lede">Shares bought in the 90s, a bank offer in 2005, a parent's old certificates. Dividendii checks the registrars for money in your name and recovers it into your bank account.</p>
            <div className="facts">
              <div><strong>₦270bn</strong><span>unclaimed dividends in Nigeria, by the SEC's own estimate</span></div>
              <div><strong>All</strong><span>registrars checked for you, by hand</span></div>
              <div><strong>₦0</strong><span>to check. Then ₦{SITE.upfront} per company plus VAT, and {fee}% only when paid</span></div>
            </div>
            <p className="src">Source: <a href={SITE.source} target="_blank" rel="noopener noreferrer">Nairametrics, 16 July 2026: SEC launches nationwide campaign to recover ₦270 billion unclaimed dividends</a>.</p>
          </div>
          <DividendChecker />
        </div>
      </section>

      <section className="block" id="products">
        <div className="wrap">
          <div className="sechead"><h2>One place for everything you own on the Nigerian market.</h2><p>Start by getting back what's already yours. Investing is coming next.</p></div>
          <div className="prod" id="recover">
            <div className="copy"><Pill kind="good">Available now</Pill><h3>Recover unclaimed dividends</h3><p>We check the registrars for you. When there is a match, we confirm it with your BVN and NIN, sign one power of attorney with you, and chase each registrar until the money is paid into your bank.</p><ul><li>One request, every registrar checked for you</li><li>Estate claims for late parents and relatives</li><li>E-dividend mandates filled for you, so future dividends never go missing</li></ul><Link className="btn btn-p btn-l" to="/check">Check my dividends</Link></div>
            <div className="vignette" aria-hidden="true"><div className="vtitle">Your recovery, live <Pill kind="grey">Example</Pill></div><div className="vrow"><span>Nestle Nigeria</span><Pill kind="good">Paid ₦41,200</Pill></div><div className="vrow"><span>Flour Mills of Nigeria</span><Pill kind="warn">With registrar, day 12</Pill></div><div className="vrow"><span>Lafarge Africa</span><Pill kind="warn">Upload old certificate</Pill></div><div className="vrow"><span>UBA</span><Pill>Submitted</Pill></div></div>
          </div>
          <div className="prod flip" id="invest">
            <div className="copy"><Pill>Opening soon</Pill><h3>Invest in Nigerian shares, ETFs and government bonds</h3><p>When investing opens, you will be able to buy NGX shares by naira amount, subscribe to the FGN Savings Bond from ₦5,000, and see every charge before you confirm. Your shares sit at CSCS in your own name.</p><ul><li>Every fee itemised on the order screen, not just the commission</li><li>Warnings before you buy a stock that rarely trades</li><li>Order tracking from your phone to the exchange and into your CHN</li></ul><Link className="btn btn-line btn-l" to="/invest" style={{ border: '1.5px solid var(--line)', color: 'var(--text)' }}>See what is coming</Link></div>
            <div className="vignette" aria-hidden="true"><div className="vtitle">Buying ₦100,000 of a listed share <Pill kind="grey">Illustrative</Pill></div><div className="vrow"><span>Shares</span><span className="num">{naira(100000)}</span></div><div className="vrow"><span className="muted">Commission, SEC, NGX and CSCS fees</span><span className="num">{naira(sample.comm + sample.sec + sample.ngx + sample.cscs)}</span></div><div className="vrow"><span className="muted">Stamp duty and VAT</span><span className="num">{naira(sample.stamp + sample.vat)}</span></div><div className="vrow"><strong>Total</strong><strong className="num">{naira(100000 + sample.total)}</strong></div></div>
          </div>
                  </div>
      </section>

      <section className="block alt" id="how">
        <div className="wrap">
          <div className="sechead"><h2>How recovery works</h2><p>Most claims close in 4 to 6 weeks, depending on the registrar. We keep you updated on WhatsApp at every step.</p></div>
          <ol className="how">
            <li><h3>Check for free</h3><p>Send us your name, or a late relative's. We check the registrars by hand and reply within 24 hours.</p></li>
            <li><h3>Prove it's you</h3><p>If there is a match, we confirm who you are with your BVN and NIN. For an estate, we need the letters of administration or probate.</p></li>
            <li><h3>Sign once</h3><p>One power of attorney lets us deal with every registrar for you. You pay ₦{SITE.upfront} per company owing you, plus VAT, to start each claim.</p></li>
            <li><h3>Get paid</h3><p>The registrar pays straight into your bank account. We then take our {fee}% success fee on the money recovered.</p></li>
          </ol>
        </div>
      </section>

      <section className="block" id="pricing">
        <div className="wrap">
          <div className="sechead"><h2>What it costs, in naira</h2><p>No subscriptions and no hidden charges. Here is how Dividendii makes money, and what the government and the exchange charge on top once investing opens.</p></div>
          <div className="pricing">
            <div className="tablebox"><table className="ptable"><thead><tr><th scope="col">Service</th><th scope="col">What you pay</th><th scope="col">Example</th></tr></thead><tbody>
              <tr><td>Dividend check</td><td>Free</td><td className="muted">Search as many names as you like</td></tr>
              <tr><td>Dividend recovery</td><td>₦{SITE.upfront} per company owing you, plus 7.5% VAT (₦{upfrontWithVat()}), then {fee}% of what's recovered, taken only once it's paid to your bank</td><td className="muted">Recover ₦100,000 from one company: you keep ₦{(100000 * (1 - SITE.success / 100) - upfrontWithVat()).toLocaleString('en-NG')}</td></tr>
              <tr><td>Buying and selling shares (when investing opens)</td><td>{(state.settings.commission * 100).toFixed(2)}% commission plus statutory charges (SEC, NGX, CSCS, stamp duty, VAT)</td><td className="muted">Use the calculator to see every line</td></tr>
              <tr><td>FGN Savings Bond</td><td>No fee from Dividendii</td><td className="muted">₦100,000 gets the full government rate</td></tr>
              <tr><td>Deposits and withdrawals (when investing opens)</td><td>Free by bank transfer</td><td className="muted">Withdrawals only to your own account</td></tr>
            </tbody></table></div>
            <FeeCalc />
          </div>
        </div>
      </section>

      <section className="block alt" id="safety">
        <div className="wrap">
          <div className="sechead"><h2>Where your money and shares actually sit</h2><p>Investing has burned a lot of Nigerians. So here is exactly who holds what, and how to check us without taking our word for it.</p></div>
          <div className="safety">
            {[['Recovered money goes to you', 'When a registrar pays, the money goes into a bank account in your name. We do not hold it, and we only take our fee on what is paid.'], ['Shares in your own name at CSCS', 'When investing opens, every share you buy will be registered to your Clearing House Number at the Central Securities Clearing System. Dividendii can\'t move them without your instruction.'], ['Where we stand with the SEC', SITE.legal + ' (' + SITE.rc + ') has applied to the Securities and Exchange Commission to be registered as a digital sub-broker. The application is pending, and we are not yet registered. We will say so until we are.'], ['Your data, protected', 'Your BVN and NIN are used only to verify you and match registrar records, never sold. You agree to our privacy notice before we collect anything.'], ['Official channels only', 'Our official lines are WhatsApp and phone ' + SITE.phone + ' and ' + SITE.email + '. If someone calls from another number claiming to be Dividendii, hang up and report it.'], ['Tell us if something looks wrong', 'If something looks wrong or slow, message us on WhatsApp or at ' + SITE.email + '. We reply during ' + SITE.hours + '.']].map(([h, p]) => <div className="safe-item" key={h}><h3>{h}</h3><p>{p}</p></div>)}
          </div>
        </div>
      </section>

      <section className="block" id="estates">
        <div className="wrap">
          <div className="sechead"><h2>Which of these sounds like you?</h2></div>
          <div className="sits">
            <div className="sit"><h3>Sorting out a late parent's shares</h3><p>You've found old certificates or dividend warrants in a drawer. We find what they're worth, handle the transmission paperwork, and pay the estate.</p><Link to="/check?mode=family">Start a family check</Link></div>
            <div className="sit"><h3>Living outside Nigeria</h3><p>You bought shares before you moved, or inherited some. Everything happens online and over WhatsApp, and the money is paid to your Nigerian bank account.</p><Link to="/check">Check from abroad</Link></div>
            <div className="sit"><h3>Never invested before</h3><p>When investing opens, you can start with the FGN Savings Bond from ₦5,000 or a large, liquid NGX company. We explain every term where you meet it.</p><Link to="/invest#waitlist">Join the investing waitlist</Link></div>
          </div>
        </div>
      </section>

      <section className="block alt" id="learn">
        <div className="wrap">
          <div className="sechead"><h2>Free tools and plain guides</h2><p>Useful whether or not you ever open an account.</p></div>
          <div className="tools">
            <Link className="tool" to="/learn"><strong>Plain-English guides</strong><span>What a share is, what a dividend is, and how the Nigerian market works</span></Link>
            <Link className="tool" to="/learn#bond"><strong>FGN Savings Bond calculator</strong><span>Rates and your quarterly interest, in naira</span></Link>
            <Link className="tool" to="/check?mode=family"><strong>Claiming a late relative's shares</strong><span>Start a family check. We tell you which documents each registrar needs</span></Link>
          </div>
        </div>
      </section>

      <section className="block" id="faq">
        <div className="wrap">
          <div className="sechead"><h2>Questions people ask first</h2></div>
          <div className="faq">
            {[['Is the dividend check really free?', `Yes. Sending us your details costs nothing and doesn't commit you to anything. You only pay if you choose to start a claim: ₦${SITE.upfront} per company owing you, plus VAT, and then ${fee}% of what is actually paid into your bank account.`], ['Why do you need my BVN?', 'Registrars now match claims against BVN and NIN records. We use yours to prove the shares are yours and to make sure the money is paid to an account in your name.'], ['My dividends are over six years old. Are they gone?', 'No. Dividends unclaimed for six years or more move to the Federal Government\'s Unclaimed Funds Trust Fund, where the government holds them as custodian. They can still be claimed, and we handle that claim too.'], ['Can I claim for my late father or mother?', 'Yes, if you are an administrator or executor of the estate. You\'ll need the death certificate and letters of administration or probate. We tell you exactly what\'s missing before anything is submitted.'], ['Who will hold my shares when investing opens?', 'The Central Securities Clearing System, in your own name, under your CHN. Trades will go through a licensed broker. Dividendii never owns your shares.']].map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}
          </div>
        </div>
      </section>

      <Waitlist />
    </>
  )
}
