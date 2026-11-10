import React, { useState } from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Tabs, Pill, Modal, Field } from '../../components/ui.jsx'
import { ROLES, AREAS, can } from '../../data/catalog.js'
import { fmtDate, uid } from '../../utils.js'
import { Check } from '../../components/icons.jsx'

export default function Staff() {
  const { state, dispatch, toast } = useStore()
  const [tab, setTab] = useState('people')
  const [f, setF] = useState(null)
  const roles = Object.keys(ROLES)
  const invite = () => {
    if (!f.name || !/.+@.+/.test(f.email)) { toast('Enter a name and a valid email', 'bad'); return }
    dispatch({ type: 'STAFF_UPSERT', staff: { id: uid('s'), name: f.name, email: f.email, role: f.role, status: 'Invited', last: null, twoFA: false } })
    setF(null); toast('Invite sent', 'good')
  }
  return (
    <>
      <TopBar title="Staff and roles" plain />
      <div className="content">
        <div className="card tight">
          <Tabs tabs={[{ value: 'people', label: `People (${state.staff.length})` }, { value: 'matrix', label: 'What each role can do' }]} value={tab} onChange={setTab} />
          {tab === 'people' && <>
            <div className="card-head"><span className="muted small">Two-step sign-in is required for every role that can move money.</span><button className="btn btn-p btn-s" type="button" onClick={() => setF({ name: '', email: '', role: 'Support' })}>Invite staff</button></div>
            <div className="scroll"><table className="tbl wide"><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>2-step</th><th>Last seen</th><th></th></tr></thead><tbody>
              {state.staff.map(s => <tr key={s.id}><td><strong>{s.name}</strong><div className="muted xs">{s.email}</div></td>
                <td><select className="inp" style={{ width: 'auto', padding: '6px 8px' }} aria-label={'Role for ' + s.name} value={s.role} onChange={e => { dispatch({ type: 'STAFF_UPSERT', staff: { id: s.id, role: e.target.value, name: s.name } }); toast('Role changed') }}>{roles.map(r => <option key={r}>{r}</option>)}</select></td>
                <td><Pill kind={{ Active: 'good', Invited: 'info' }[s.status] || 'grey'}>{s.status}</Pill></td><td>{s.twoFA ? <Pill kind="good">On</Pill> : <Pill kind="warn">Off</Pill>}</td><td>{s.last ? fmtDate(s.last) : <span className="muted">never</span>}</td>
                <td><button className="linkbtn" type="button" onClick={() => dispatch({ type: 'STAFF_STATUS', id: s.id, status: s.status === 'Deactivated' ? 'Active' : 'Deactivated' })}>{s.status === 'Deactivated' ? 'Reactivate' : 'Deactivate'}</button></td></tr>)}
            </tbody></table></div></>}
          {tab === 'matrix' && <div className="scroll"><table className="tbl wide"><thead><tr><th>Area</th>{roles.map(r => <th key={r} style={{ textAlign: 'center' }}>{r}</th>)}</tr></thead><tbody>
            {AREAS.map(([k, label]) => <tr key={k}><td><strong>{label}</strong></td>{roles.map(r => <td key={r} style={{ textAlign: 'center', color: 'var(--good)' }}>{can(r, k) ? <Check size={16} /> : <span className="muted">·</span>}</td>)}</tr>)}
          </tbody></table></div>}
        </div>
      </div>
      {f && <Modal title="Invite staff" onClose={() => setF(null)}><div className="stack" style={{ gap: 10 }}>
        <Field label="Full name" id="sn"><input id="sn" className="inp" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} /></Field>
        <Field label="Work email" id="se"><input id="se" className="inp" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} /></Field>
        <Field label="Role" id="sr"><select id="sr" className="inp" value={f.role} onChange={e => setF({ ...f, role: e.target.value })}>{roles.map(r => <option key={r}>{r}</option>)}</select></Field>
        <button className="btn btn-p" type="button" onClick={invite}>Send invite</button></div></Modal>}
    </>
  )
}
