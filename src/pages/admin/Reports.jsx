import React from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { naira, downloadFile, toCsv } from '../../utils.js'

export default function Reports() {
  const { state, toast } = useStore()
  const d = (iso) => (iso || '').slice(0, 10)
  const R = [
    { name: 'Customers and KYC', desc: 'Every customer with tier, KYC status and CHN.', n: state.adminUsers.length, file: 'customers.csv', cols: ['ID', 'Name', 'Email', 'Tier', 'KYC', 'CHN', 'Holdings', 'Joined'], rows: () => state.adminUsers.map(u => [u.id, u.name, u.email, u.tier, u.kyc, u.chn, u.holdings, d(u.joined)]) },
    { name: 'Orders', desc: 'All orders with status and fills.', n: state.orders.length, file: 'orders.csv', cols: ['ID', 'Side', 'Ticker', 'Units', 'Filled', 'Status', 'Placed'], rows: () => state.orders.map(o => [o.id, o.side, o.ticker, o.units, o.filled || 0, o.status, d(o.placed || o.ts)]) },
    { name: 'Treasury ledger', desc: 'Deposits, withdrawals, offer payments and refunds.', n: state.transactions.length, file: 'ledger.csv', cols: ['Date', 'Customer', 'Type', 'Direction', 'Amount', 'Status', 'Reference'], rows: () => state.transactions.map(t => [d(t.ts), t.ownerName, t.type, t.dir, t.amount, t.status, t.ref]) },
    { name: 'Offer applications', desc: 'Applications and allotments by offer.', n: state.offerApps.length, file: 'offer-applications.csv', cols: ['ID', 'Offer', 'Customer', 'Units', 'Amount', 'Status', 'Allotted'], rows: () => state.offerApps.map(a => [a.id, state.offers.find(o => o.id === a.offerId)?.issuer, a.ownerName, a.units, a.amount, a.status, a.allottedUnits ?? '']) },
    { name: 'Service requests', desc: 'Requests and how fast they are closed.', n: state.serviceRequests.length, file: 'requests.csv', cols: ['ID', 'Customer', 'Type', 'Status', 'Opened', 'Assignee'], rows: () => state.serviceRequests.map(r => [r.id, r.ownerName, r.type, r.status, d(r.opened), r.assignee]) },
    { name: 'Audit log', desc: 'Who did what and when (last 200).', n: state.audit.length, file: 'audit.csv', cols: ['Time', 'Actor', 'Action', 'Detail'], rows: () => state.audit.map(a => [a.ts, a.actor, a.action, a.detail]) },
  ]
  return (
    <>
      <TopBar title="Reports" plain />
      <div className="content">
        <div className="pagehead"><div><h2>Downloads for finance, compliance and the regulator</h2><div className="sub">Each file is built from live data when you click. Every download is logged.</div></div></div>
        <div className="cards wide">{R.map(r => <div key={r.name} className="card stack" style={{ gap: 8 }}><h3>{r.name}</h3><p className="muted small">{r.desc}</p><div className="muted xs">{r.n.toLocaleString()} rows</div><button className="btn btn-o" type="button" style={{ marginTop: 'auto' }} onClick={() => { downloadFile(r.file, toCsv(r.cols, r.rows())); toast(r.file + ' downloaded') }}>Download CSV</button></div>)}</div>
        <div className="muted xs">Total customer cash on the ledger: {naira(state.transactions.filter(t => t.dir === 'in').reduce((a, t) => a + t.amount, 0))} in. Sample data in demo mode.</div>
      </div>
    </>
  )
}
