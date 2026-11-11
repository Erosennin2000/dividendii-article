import React from 'react'
import FeeCalc from '../../components/FeeCalc.jsx'
import { useStore } from '../../store/store.jsx'
import { SITE, upfrontWithVat } from '../../site.js'
import { usePageMeta } from '../../lib/pageMeta.js'

export default function Pricing() {
  const { state } = useStore()
  const s = state.settings
  usePageMeta({ title: 'Pricing and how we make money | Dividendii', description: 'Checking is free. Recovery costs ₦150 per company plus VAT, then 5% of what is recovered. See every charge.' })
  return (
    <>
      <div className="wrap page-hero"><h1>What it costs, and how we make money.</h1><p>No subscriptions, no hidden charges. Two sources of revenue, both listed here.</p></div>
      <section className="block alt"><div className="wrap">
        <div className="pricing" style={{ marginTop: 0 }}>
          <div className="tablebox"><table className="ptable"><thead><tr><th>Service</th><th>What you pay</th><th>Example</th></tr></thead><tbody>
            <tr><td>Dividend check</td><td>Free</td><td className="muted">Ask about as many names as you like</td></tr>
            <tr><td>Dividend recovery</td><td>₦{SITE.upfront} per company owing you, plus 7.5% VAT (₦{upfrontWithVat()}), then {SITE.success}% of what's recovered, taken only once it's paid to your bank</td><td className="muted">Recover ₦100,000 from one company: you keep ₦{(100000 * (1 - SITE.success / 100) - upfrontWithVat()).toLocaleString('en-NG')}</td></tr>
            <tr><td>Buying and selling shares (when investing opens)</td><td>{(s.commission * 100).toFixed(2)}% commission plus statutory charges</td><td className="muted">SEC {(s.secFee * 100).toFixed(2)}%, NGX {(s.ngxFee * 100).toFixed(2)}%, CSCS {(s.cscsFee * 100).toFixed(2)}%, stamp duty {(s.stampDuty * 100).toFixed(3)}%, VAT {(s.vat * 100).toFixed(1)}% on fees</td></tr>
            <tr><td>FGN Savings Bond</td><td>No fee from Dividendii</td><td className="muted">₦100,000 gets the full government rate</td></tr>
            <tr><td>Deposits and withdrawals (when investing opens)</td><td>Free by bank transfer</td><td className="muted">Withdrawals only to your own account</td></tr>
            <tr><td>Statements and contract notes (when investing opens)</td><td>Free</td><td className="muted">Monthly, and per trade</td></tr>
          </tbody></table></div>
          <FeeCalc />
        </div>
        <div className="sechead" style={{ marginTop: 64 }}><h2>How we make money</h2><p>Two ways. Recovery fees when we get your dividends paid, and brokerage commission once investing opens. We do not sell your data.</p></div>
      </div></section>
    </>
  )
}
