import React, { useState } from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Pill, Modal } from '../../components/ui.jsx'
import { SERVICE_TYPES, SR_STATUSES } from '../../data/catalog.js'
import { fmtDate } from '../../utils.js'

const tone = { Submitted: 'info', 'In review': 'warn', 'Needs info': 'warn', Completed: 'good', Rejected: 'bad' }
export default function Requests() {
  const { state, dispatch, toast } = useStore()
  const [flt, setFlt] = useState('open')
  const [id, setId] = useState(null)
  const [note, setNote] = useState('')
  const rows = state.serviceRequests.filter(r => flt === 'all' ? true : flt === 'open' ? !['Completed', 'Rejected'].includes(r.status) : r.status === flt)
  const r = state.serviceRequests.find(x => x.id === id)
  const label = (t) => SERVICE_TYPES.find(s => s.key === t)?.label || (t === 'insurance' ? 'Insurance quote' : t)
  return (
    <>
      <TopBar title="Service requests" plain />
      <div className="content">
        <div className="card tight">
          <div className="card-head"><h2>Queue</h2><select className="inp" style={{ width: 'auto' }} aria-label="Filter" value={flt} onChange={e => setFlt(e.target.value)}><option value="open">Open</option><option value="all">All</option>{SR_STATUSES.map(s => <option key={s}>{s}</option>)}</select></div>
          <div className="scroll"><table className="tbl wide"><thead><tr><th>Request</th><th>Customer</th><th>Type</th><th>Opened</th><th>Assignee</th><th>Status</th><th></th></tr></thead><tbody>
            {rows.map(x => <tr key={x.id} className="click" onClick={() => setId(x.id)}><td><strong>{x.id}</strong></td><td>{x.ownerName}</td><td>{label(x.type)}</td><td>{fmtDate(x.opened)}</td><td>{x.assignee}</td><td><Pill kind={tone[x.status]}>{x.status}</Pill></td><td><button className="linkbtn" type="button">Open</button></td></tr>)}
            {!rows.length && <tr><td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 24 }}>Nothing here.</td></tr>}
          </tbody></table></div>
        </div>
      </div>
      {r && <Modal title={r.subject} onClose={() => setId(null)}>
        <div className="stack" style={{ gap: 10 }}>
          <div className="small">{r.ownerName} · {r.id}</div><p className="small">{r.detail}</p>
          {r.notes.map((n, i) => <div key={i} className="rowline"><span><div className="muted xs">{n.by} · {fmtDate(n.ts)}</div>{n.text}</span></div>)}
          <textarea className="inp" aria-label="Note to customer" placeholder="Add a note (customer sees it)" value={note} onChange={e => setNote(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {SR_STATUSES.filter(s => s !== r.status).map(s => <button key={s} className="btn btn-o btn-s" type="button" onClick={() => { dispatch({ type: 'SR_STATUS', id: r.id, status: s, note: note || undefined, by: 'Support' }); setNote(''); toast('Marked ' + s.toLowerCase()) }}>{s}</button>)}
          </div>
        </div>
      </Modal>}
    </>
  )
}
