import React, { useState } from 'react'
import { BOND_WINDOW } from '../../data/mock.js'
import { naira } from '../../utils.js'
import { usePageMeta } from '../../lib/pageMeta.js'
import ArticleLibrary from './ArticleLibrary.jsx'

export default function Learn() {
  const [amt, setAmt] = useState(100000)
  const [t, setT] = useState(3)
  usePageMeta({ title: 'Learn about shares, dividends and the Nigerian market | Dividendii', description: 'Plain-English guides to owning shares, dividends, the Nigerian Exchange and how the market works, plus a free bond calculator.' })
  return (
    <>
      <div className="wrap page-hero"><h1>Plain guides and free tools.</h1><p>Useful whether or not you ever use Dividendii.</p></div>
      <ArticleLibrary />
      <section className="block alt" id="bond"><div className="wrap">
        <div className="pricing" style={{ marginTop: 0 }}>
          <div><div className="sechead"><h2>FGN Savings Bond calculator</h2><p>{BOND_WINDOW.month} window (sample figures): {BOND_WINDOW.rates[2]}% for 2 years, {BOND_WINDOW.rates[3]}% for 3 years. Interest every quarter, tax free, from ₦5,000.</p></div><div className="card" style={{ marginTop: 24 }}><label className="lbl" htmlFor="amt" style={{ fontSize: 15, color: 'var(--text)', fontWeight: 600 }}>Amount</label><input id="amt" className="inp" type="number" step="1000" value={amt} onChange={e => setAmt(Number(e.target.value))} /><div style={{ marginTop: 12 }}><span className="lbl">Tenor</span><div className="seg">{[2, 3].map(x => <button key={x} type="button" className={t === x ? 'on' : ''} onClick={() => setT(x)}>{x} years</button>)}</div></div></div></div>
          <div className="calc"><span className="lbl">What you'd receive</span><div className="ln"><span>Every quarter</span><span className="num">{naira(amt * BOND_WINDOW.rates[t] / 100 / 4)}</span></div><div className="ln"><span>Each year</span><span className="num">{naira(amt * BOND_WINDOW.rates[t] / 100)}</span></div><div className="ln"><span>Total interest over {t} years</span><span className="num">{naira(amt * BOND_WINDOW.rates[t] / 100 * t)}</span></div><div className="ln tot"><span>Back at maturity</span><span className="num">{naira(amt)}</span></div><p className="note">Rates are set by the DMO each month.</p></div>
        </div>
      </div></section>
    </>
  )
}
