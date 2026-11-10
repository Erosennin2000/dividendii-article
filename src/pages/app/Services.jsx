import React, { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Tabs, Modal, Field, Pill } from '../../components/ui.jsx'
import ConfirmPin from '../../components/ConfirmPin.jsx'
import { SERVICE_TYPES, SR_STATUSES } from '../../data/catalog.js'
import { fmtDate, uid, today } from '../../utils.js'

const tone = { Submitted: 'info', 'In review': 'warn', 'Needs info': 'warn', Completed: 'good', Rejected: 'bad' }
export default function Services() {
  const { state, act, toast } = useStore()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get('tab') || 'services')
  const [t, setT] = useState(null)
  const [vals, setVals] = useState({})
  const [pinStep, setPinStep] = useState(false)
  const [open, setOpen] = useState(null)
  const mine = state.serviceRequests.filter(r => r.owner === 'u-1')
  const start = (s) => { setT(s); setVals({}); setPinStep(false) }
  const build = () => ({ id: uid('SR'), owner: 'u-1', ownerName: state.user.name, type: t.key, subject: t.label, detail: t.fields.map(f => `${f.label}: ${vals[f.key] || '-'}`).join('. '), opened: today(), due: today(), status: 'Submitted', assignee: 'Support', notes: [] })
  const missing = t && t.fields.some(f => !f.label.includes('optional') && f.type !== 'textarea' && !vals[f.key])
  async function send(pin) {
    await act({ type: 'SR_CREATE', req: build(), pin })
    setT(null); setPinStep(false); setTab('requests'); toast('Request sent', 'good')
  }
  const form = (
    <div className="stack" style={{ gap: 12 }}>
      <p className="muted small">{t?.desc}</p>
      {t?.fields.map(f => (
        <Field key={f.key} label={f.label} id={'s-' + f.key}>
          {f.type === 'select' ? <select id={'s-' + f.key} className="inp" value={vals[f.key] || ''} onChange={e => setVals({ ...vals, [f.key]: e.target.value })}><option value="">Choose</option>{f.options.map(o => <option key={o}>{o}</option>)}</select>
            : f.type === 'textarea' ? <textarea id={'s-' + f.key} className="inp" placeholder={f.ph} value={vals[f.key] || ''} onChange={e => setVals({ ...vals, [f.key]: e.target.value })} />
            : <input id={'s-' + f.key} className="inp" type={f.type} placeholder={f.ph} value={vals[f.key] || ''} onChange={e => setVals({ ...vals, [f.key]: e.target.value })} />}
        </Field>
      ))}
      <div className="muted xs">Usually done within {t?.sla} working day{t?.sla === 1 ? '' : 's'}.</div>
      <button className="btn btn-p btn-block" type="button" disabled={missing} onClick={() => t.pin ? setPinStep(true) : send().catch(e => toast(e.message || 'Could not send', 'bad'))}>{t?.pin ? 'Continue' : 'Send request'}</button>
    </div>
  )
  return (
    <>
      <TopBar title="Services" />
      <div className="content">
        <div className="card tight">
          <Tabs tabs={[{ value: 'services', label: 'Request a service' }, { value: 'requests', label: `My requests (${mine.length})` }, { value: 'contact', label: 'Contact us' }]} value={tab} onChange={setTab} />
          <div style={{ padding: 20 }}>
            {tab === 'services' && <div className="cards wide">{SERVICE_TYPES.map(s => <button key={s.key} type="button" className="card stack" style={{ gap: 6, textAlign: 'left', cursor: 'pointer' }} onClick={() => start(s)}><strong>{s.label}</strong><span className="muted small">{s.desc}</span></button>)}</div>}
            {tab === 'requests' && (
              <div className="stack" style={{ gap: 10 }}>
                {mine.map(r => (
                  <div key={r.id} className="card tight" style={{ padding: 14 }}>
                    <button type="button" className="row" style={{ width: '100%', textAlign: 'left' }} onClick={() => setOpen(open === r.id ? null : r.id)}>
                      <span><strong>{r.subject}</strong><div className="muted xs">{r.id} · opened {fmtDate(r.opened)}</div></span><Pill kind={tone[r.status] || 'grey'}>{r.status}</Pill>
                    </button>
                    {open === r.id && <div style={{ marginTop: 10 }} className="small"><p>{r.detail}</p>{r.notes.map((n, i) => <div key={i} className="rowline"><span><div className="muted xs">{n.by} · {fmtDate(n.ts)}</div>{n.text}</span></div>)}{!r.notes.length && <div className="muted xs">No updates yet.</div>}</div>}
                  </div>
                ))}
                {!mine.length && <div className="muted">No requests yet.</div>}
              </div>
            )}
            {tab === 'contact' && <div className="stack" style={{ gap: 10 }}><p>Chat, complaints and the help centre are on the <Link to="/app/support">Help page</Link>.</p><p className="muted small">WhatsApp [number] · phone [number] · [support email]. Official channels only.</p></div>}
          </div>
        </div>
      </div>
      {t && !pinStep && <Modal title={t.label} onClose={() => setT(null)}>{form}</Modal>}
      {t && pinStep && <ConfirmPin title={t.label} cta="Send request" onClose={() => setT(null)} onConfirm={send}><div className="muted small">This changes sensitive details, so we need your PIN.</div></ConfirmPin>}
    </>
  )
}
