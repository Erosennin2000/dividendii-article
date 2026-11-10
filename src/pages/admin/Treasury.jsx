import React, { useState } from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Tabs, Pill, Stat } from '../../components/ui.jsx'
import { naira, fmtDate, downloadFile, toCsv } from '../../utils.js'

export default function Treasury() {
  const { state, dispatch, toast } = useStore()
  const [tab, setTab] = useState('approvals')
  const pending = state.transactions.filter(t => t.needsApproval)
  const all = state.transactions
  const sum = (f) => all.filter(f).reduce((a, t) => a + t.amount, 0)
  return (
    <>
      <TopBar title="Treasury" plain />
      <div className="content">
        <div className="grid g3"><Stat label="Money in" value={naira(sum(t => t.dir === 'in'))} /><Stat label="Money out" value={naira(sum(t => t.dir === 'out'))} /><Stat label="Waiting for approval" value={naira(pending.reduce((a, t) => a + t.amount, 0))} sub={`${pending.length} payments, limit ${naira(state.settings.withdrawalApprovalLimit || 0)}`} /></div>
        <div className="card tight">
          <Tabs tabs={[{ value: 'approvals', label: `Approvals (${pending.length})` }, { value: 'ledger', label: 'Ledger' }]} value={tab} onChange={setTab} />
          {tab === 'approvals' && <div className="scroll"><table className="tbl wide"><thead><tr><th>When</th><th>Customer</th><th>To</th><th className="num">Amount</th><th></th></tr></thead><tbody>
            {pending.map(t => <tr key={t.id}><td>{fmtDate(t.ts)}</td><td><strong>{t.ownerName}</strong></td><td>{t.ref}</td><td className="num">{naira(t.amount)}</td><td style={{ whiteSpace: 'nowrap' }}><button className="btn btn-p btn-s" type="button" onClick={() => { dispatch({ type: 'TX_DECISION', id: t.id, decision: 'Approve', by: 'Treasury' }); toast('Payment approved', 'good') }}>Approve</button> <button className="btn btn-o btn-s" type="button" onClick={() => { dispatch({ type: 'TX_DECISION', id: t.id, decision: 'Reject', by: 'Treasury' }); toast('Payment rejected, money returned') }}>Reject</button></td></tr>)}
            {!pending.length && <tr><td colSpan="5" className="muted" style={{ textAlign: 'center', padding: 24 }}>No payments waiting.</td></tr>}
          </tbody></table></div>}
          {tab === 'ledger' && <>
            <div className="card-head"><span className="muted small">{all.length} entries</span><button className="btn btn-o btn-s" type="button" onClick={() => downloadFile('ledger.csv', toCsv(['Date', 'Customer', 'Type', 'Direction', 'Amount', 'Status', 'Reference'], all.map(t => [t.ts.slice(0, 10), t.ownerName, t.type, t.dir, t.amount, t.status, t.ref])))}>Download CSV</button></div>
            <div className="scroll"><table className="tbl wide"><thead><tr><th>Date</th><th>Customer</th><th>Type</th><th className="num">Amount</th><th>Status</th><th>Reference</th></tr></thead><tbody>
              {all.slice(0, 100).map(t => <tr key={t.id}><td>{fmtDate(t.ts)}</td><td>{t.ownerName}</td><td>{t.type}</td><td className="num" style={{ color: t.dir === 'in' ? 'var(--good)' : undefined }}>{t.dir === 'in' ? '+' : '−'}{naira(t.amount)}</td><td><Pill kind={{ Completed: 'good', Reversed: 'grey' }[t.status] || 'warn'}>{t.status}</Pill></td><td className="muted small">{t.ref}</td></tr>)}
            </tbody></table></div></>}
        </div>
      </div>
    </>
  )
}
