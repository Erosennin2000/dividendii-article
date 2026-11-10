import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Pill, statusPill, Tabs, Stat } from '../../components/ui.jsx'
import { Back } from '../../components/kit.jsx'
import { naira, fmtDate } from '../../utils.js'
import { LENDING_ENABLED } from '../../features.js'

export default function Customer() {
  const { id } = useParams()
  const { state, dispatch, toast } = useStore()
  const [tab, setTab] = useState('overview')
  const [note, setNote] = useState('')
  const u = state.adminUsers.find(x => x.id === id)
  if (!u) return <><TopBar title="Customer" plain /><div className="content"><div className="card">Customer not found. <Link to="/admin/users">Back</Link></div></div></>
  const own = (list) => list.filter(x => x.owner === id || x.ownerName === u.name)
  const orders = own(state.orders), claims = own(state.claims), loans = own(state.loans), tx = own(state.transactions), reqs = own(state.serviceRequests), apps = own(state.offerApps)
  const notes = (state.userNotes || {})[id] || []
  const frozen = u.status === 'Frozen'
  const T = (rows, head, row) => rows.length ? <div className="scroll"><table className="tbl wide"><thead><tr>{head.map(h => <th key={h}>{h}</th>)}</tr></thead><tbody>{rows.map(row)}</tbody></table></div> : <div className="muted" style={{ padding: 24 }}>Nothing yet.</div>
  return (
    <>
      <TopBar title="Customer" plain />
      <div className="content">
        <Back to="/admin/users">All customers</Back>
        <div className="card"><div className="row" style={{ alignItems: 'flex-start' }}>
          <div><h2>{u.name}</h2><div className="muted small">{u.email} · joined {fmtDate(u.joined)} · CHN {u.chn || 'not opened'}</div><div style={{ display: 'flex', gap: 8, marginTop: 8 }}>{statusPill(u.kyc)}<Pill kind="grey">Tier {u.tier}</Pill>{frozen && <Pill kind="bad">Frozen</Pill>}</div></div>
          <div style={{ display: 'flex', gap: 8 }}>
            {u.kyc !== 'Verified' && <button className="btn btn-p btn-s" type="button" onClick={() => { dispatch({ type: 'KYC', id, status: 'Verified' }); toast('Verified') }}>Approve KYC</button>}
            <button className={'btn btn-s ' + (frozen ? 'btn-p' : 'btn-d')} type="button" onClick={() => { dispatch({ type: 'USER_STATUS', id, status: frozen ? 'Active' : 'Frozen', reason: 'Staff action' }); toast(frozen ? 'Account reopened' : 'Account frozen') }}>{frozen ? 'Unfreeze' : 'Freeze account'}</button>
          </div></div></div>
        <div className="grid g3"><Stat label="Holdings" value={naira(u.holdings)} /><Stat label="Orders" value={orders.length} sub={LENDING_ENABLED ? `${claims.length} claims, ${loans.length} loans` : `${claims.length} claims`} /><Stat label="Open requests" value={reqs.filter(r => !['Completed', 'Rejected'].includes(r.status)).length} /></div>
        <div className="card tight">
          <Tabs tabs={[{ value: 'overview', label: 'Orders' }, { value: 'money', label: 'Money' }, { value: 'claims', label: LENDING_ENABLED ? 'Claims and loans' : 'Claims' }, { value: 'requests', label: 'Requests and offers' }, { value: 'notes', label: `Notes (${notes.length})` }]} value={tab} onChange={setTab} />
          {tab === 'overview' && T(orders, ['Order', 'Side', 'Stock', 'Units', 'Status'], o => <tr key={o.id}><td>{o.id}</td><td>{o.side}</td><td>{o.ticker}</td><td>{o.units}</td><td>{statusPill(o.status)}</td></tr>)}
          {tab === 'money' && T(tx, ['Date', 'Type', 'Amount', 'Status'], t => <tr key={t.id}><td>{fmtDate(t.ts)}</td><td>{t.type}</td><td>{t.dir === 'in' ? '+' : '−'}{naira(t.amount)}</td><td>{t.status}</td></tr>)}
          {tab === 'claims' && T([...claims.map(c => ({ k: c.id, a: 'Claim', b: c.company, s: c.status })), ...(LENDING_ENABLED ? loans : []).map(l => ({ k: l.id, a: 'Loan', b: naira(l.amount), s: l.status }))], ['Ref', 'Kind', 'Detail', 'Status'], r => <tr key={r.k}><td>{r.k}</td><td>{r.a}</td><td>{r.b}</td><td>{statusPill(r.s)}</td></tr>)}
          {tab === 'requests' && T([...reqs.map(r => ({ k: r.id, a: r.subject, s: r.status })), ...apps.map(a => ({ k: a.id, a: 'Offer: ' + (state.offers.find(o => o.id === a.offerId)?.issuer || ''), s: a.status }))], ['Ref', 'What', 'Status'], r => <tr key={r.k}><td>{r.k}</td><td>{r.a}</td><td>{statusPill(r.s)}</td></tr>)}
          {tab === 'notes' && <div style={{ padding: 20 }} className="stack"><div style={{ display: 'flex', gap: 8 }}><input className="inp" aria-label="Note" value={note} onChange={e => setNote(e.target.value)} placeholder="Internal note (customer cannot see)" /><button className="btn btn-p" type="button" onClick={() => { if (!note.trim()) return; dispatch({ type: 'USER_NOTE', id, text: note, by: state.auth.role || 'Staff' }); setNote('') }}>Add</button></div>{notes.map((n, i) => <div className="rowline" key={i}><span><div className="muted xs">{n.by} · {fmtDate(n.ts)}</div>{n.text}</span></div>)}</div>}
        </div>
      </div>
    </>
  )
}
