import React, { useState } from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Modal, Pill, Field } from '../../components/ui.jsx'
import { Notice } from '../../components/kit.jsx'
import { Shield, Check } from '../../components/icons.jsx'
import { INSURANCE } from '../../data/catalog.js'
import { naira, uid, today } from '../../utils.js'

export default function Insurance() {
  const { state, act, toast } = useStore()
  const [sel, setSel] = useState(null)
  const [vals, setVals] = useState({})
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(null)
  const on = state.settings.flags.insurance !== false
  const open = (p) => { setSel(p); setVals({}); setDone(null) }
  async function submit() {
    setBusy(true)
    try {
      const detail = sel.fields.map(f => `${f.label}: ${vals[f.key] || 'not given'}`).join('. ')
      const req = { id: uid('SR'), owner: 'u-1', ownerName: state.user.name, type: 'insurance', subject: `Insurance quote: ${sel.name}`, detail, opened: today(), due: today(), status: 'Submitted', assignee: 'Partnerships', notes: [] }
      await act({ type: 'SR_CREATE', req })
      setDone(req.id)
    } catch (e) { toast(e.message || 'Could not send. Try again.', 'bad') }
    setBusy(false)
  }
  return (
    <>
      <TopBar title="Insurance" />
      <div className="content">
        <div className="pagehead"><div><h2>Cover for the things that matter</h2><div className="sub">Tell us what you need. A licensed insurance partner sends you a price within two working days. You choose, you pay them directly.</div></div></div>
        {!on && <Notice kind="warn">Insurance quotes are paused right now.</Notice>}
        <div className="cards wide">
          {INSURANCE.map(p => (
            <div key={p.id} className="card stack" style={{ gap: 10 }}>
              <div className="row"><Shield size={26} /><Pill kind="grey">from {naira(p.from)} / {p.per}</Pill></div>
              <h3>{p.name}</h3>
              <p className="muted small">{p.blurb}</p>
              <ul style={{ margin: 0, paddingLeft: 18, display: 'grid', gap: 4 }} className="small">{p.cover.map(c => <li key={c}>{c}</li>)}</ul>
              <button className="btn btn-p" type="button" style={{ marginTop: 'auto' }} disabled={!on} onClick={() => open(p)}>Get a quote</button>
            </div>
          ))}
        </div>
        <div className="muted xs">Insurance is provided by licensed partners and regulated by NAICOM. It is not a Vendii product and is not covered by your brokerage account.</div>
      </div>
      {sel && (
        <Modal title={sel.name + ' quote'} onClose={() => setSel(null)}>
          {done ? (
            <div className="stack" style={{ gap: 12, textAlign: 'center', padding: '10px 0' }}>
              <div style={{ color: 'var(--good)' }}><Check size={36} /></div>
              <h3>Request received</h3>
              <p className="muted small">Reference {done}. You will get prices from our partners within two working days. Track it under Services.</p>
              <button className="btn btn-p" type="button" onClick={() => setSel(null)}>Done</button>
            </div>
          ) : (
            <div className="stack" style={{ gap: 12 }}>
              {sel.fields.map(f => (
                <Field key={f.key} label={f.label} id={'q-' + f.key}>
                  {f.type === 'select'
                    ? <select id={'q-' + f.key} className="inp" value={vals[f.key] || ''} onChange={e => setVals({ ...vals, [f.key]: e.target.value })}><option value="">Choose</option>{f.options.map(o => <option key={o}>{o}</option>)}</select>
                    : <input id={'q-' + f.key} className="inp" type={f.type === 'number' ? 'text' : f.type} inputMode={f.type === 'number' ? 'numeric' : undefined} placeholder={f.ph} value={vals[f.key] || ''} onChange={e => setVals({ ...vals, [f.key]: e.target.value })} />}
                </Field>
              ))}
              <div className="muted xs">We share these details with insurance partners only to prepare your quote.</div>
              <button className="btn btn-p btn-block" type="button" disabled={busy} onClick={submit}>{busy ? 'Sending…' : 'Request quote'}</button>
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
