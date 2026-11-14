import React from 'react'
import { Pill } from '../../components/ui.jsx'
import Waitlist from './Waitlist.jsx'
import { usePageMeta } from '../../lib/pageMeta.js'

export default function Invest() {
  usePageMeta({ title: 'Investing is coming soon | Dividendii', description: 'Join the waitlist for investing in Nigerian shares, ETFs and government bonds with every charge shown before you confirm.' })
  return (
    <>
      <div className="wrap page-hero"><Pill>Opening soon</Pill><h1 style={{ marginTop: 12 }}>Investing in Nigerian shares, ETFs and government bonds, with every charge in the open.</h1><p>Recovery is open now. Investing is next. When it opens you will be able to buy by naira amount and see every fee and tax before you confirm. Your shares will sit at CSCS in your own name, never ours.</p><div style={{ display: 'flex', gap: 10, marginTop: 24, flexWrap: 'wrap' }}><a className="btn btn-p btn-l" href="#waitlist">Join the waitlist</a></div></div>
      <section className="block alt"><div className="wrap">
        <div className="sechead"><h2>What we plan to offer</h2><p>These are plans, not live products. We will announce each one when it opens. Already checked your dividends with us? <a href="/app">Look around the investing demo</a> from your account. It runs on sample data.</p></div>
        <div className="grid g3" style={{ marginTop: 36 }}>
          {[['NGX shares', 'Companies on the Nigerian Exchange, from banks to cement to telecoms. Whole units, with a liquidity label so you know how easily you can sell.'], ['ETFs', 'Exchange-traded funds that track an index, bought and sold like a share.'], ['FGN Savings Bond', 'The monthly government bond, from ₦5,000, with interest paid quarterly.']].map(([h, p]) => <div className="card" key={h}><div className="row"><h3 style={{ fontSize: 19 }}>{h}</h3><Pill kind="grey">Planned</Pill></div><p className="muted" style={{ marginTop: 8 }}>{p}</p></div>)}
        </div>
      </div></section>
      <Waitlist />
    </>
  )
}
