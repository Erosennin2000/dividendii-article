import React, { useState } from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, offerStats } from '../../store/store.jsx'
import { Tabs, Pill, Modal, Field } from '../../components/ui.jsx'
import { Progress } from '../../components/kit.jsx'
import { naira, n2, fmtDate, uid } from '../../utils.js'
import { relDate } from '../../data/catalog.js'

const blank = { kind: 'IPO', name: '', issuer: '', sector: '', unitPrice: '', minUnits: '', multiple: 1, opens: '', closes: '', allotment: '', listing: '' }
export default function Products() {
  const { state, dispatch, toast } = useStore()
  const [tab, setTab] = useState('offers')
  const [f, setF] = useState(null)
  const [ratio, setRatio] = useState({})
  const [nav, setNav] = useState({})
  function save() {
    if (!f.name || !f.issuer || !(+f.unitPrice) || !(+f.minUnits) || !f.opens || !f.closes) { toast('Fill name, issuer, price, minimum and dates', 'bad'); return }
    const offer = { id: uid('off'), status: 'Upcoming', sizeUnits: 1e7, baseSubscribed: 0, registrar: '[Registrar]', theme: 'a', summary: f.summary || '', highlights: [], useOfProceeds: [], docs: ['Prospectus (PDF)'], ...f, unitPrice: +f.unitPrice, minUnits: +f.minUnits, multiple: +f.multiple || 1 }
    dispatch({ type: 'OFFER_UPSERT', offer }); setF(null); toast('Offer created as Upcoming', 'good')
  }
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  return (
    <>
      <TopBar title="Products" plain />
      <div className="content">
        <div className="card tight">
          <Tabs tabs={[{ value: 'offers', label: `Public offers (${state.offers.length})` }, { value: 'funds', label: `Mutual funds (${state.funds.length})` }]} value={tab} onChange={setTab} />
          {tab === 'offers' && <>
            <div className="card-head"><h2>Offers and allotment</h2><button className="btn btn-p btn-s" type="button" onClick={() => setF({ ...blank, opens: relDate(1), closes: relDate(15), allotment: relDate(25), listing: relDate(32) })}>New offer</button></div>
            <div className="scroll"><table className="tbl wide"><thead><tr><th>Offer</th><th>Status</th><th>Closes</th><th style={{ width: 160 }}>Subscribed</th><th className="num">Applications</th><th>Actions</th></tr></thead><tbody>
              {state.offers.map(o => { const st = offerStats(o, state); const n = state.offerApps.filter(a => a.offerId === o.id && a.status !== 'Cancelled').length; return (
                <tr key={o.id}><td><strong>{o.issuer}</strong><div className="muted xs">{o.kind} · ₦{n2(o.unitPrice)}</div></td><td><Pill kind={{ Open: 'good', Upcoming: 'info' }[o.status] || 'grey'}>{o.status}</Pill></td><td>{fmtDate(o.closes)}</td><td><Progress value={st.pct} /><div className="xs muted">{Math.round(st.pct)}%</div></td><td className="num">{n}</td>
                  <td style={{ whiteSpace: 'nowrap' }}>
                    {o.status === 'Upcoming' && <button className="btn btn-p btn-s" type="button" onClick={() => dispatch({ type: 'OFFER_STATUS', id: o.id, status: 'Open' })}>Open</button>}
                    {o.status === 'Open' && <button className="btn btn-o btn-s" type="button" onClick={() => dispatch({ type: 'OFFER_STATUS', id: o.id, status: 'Closed' })}>Close</button>}
                    {o.status === 'Closed' && <span style={{ display: 'inline-flex', gap: 6, alignItems: 'center' }}><input className="inp" style={{ width: 70, padding: '6px 8px' }} aria-label="Allotment percent" value={ratio[o.id] ?? '100'} onChange={e => setRatio({ ...ratio, [o.id]: e.target.value })} />%<button className="btn btn-p btn-s" type="button" onClick={() => { dispatch({ type: 'OFFER_ALLOT', id: o.id, ratio: Math.min(100, Math.max(1, +(ratio[o.id] ?? 100))) / 100 }); toast('Allotment run; refunds posted', 'good') }}>Run allotment</button></span>}
                  </td></tr>) })}
            </tbody></table></div>
          </>}
          {tab === 'funds' && <div className="scroll"><table className="tbl wide"><thead><tr><th>Fund</th><th>Type</th><th>Status</th><th className="num">NAV</th><th>Publish new NAV</th><th></th></tr></thead><tbody>
            {state.funds.map(x => <tr key={x.id}><td><strong>{x.name}</strong><div className="muted xs">{x.manager} · fee {x.fee}%</div></td><td>{x.type}</td><td><Pill kind={x.status === 'Open' ? 'good' : 'warn'}>{x.status}</Pill></td><td className="num">₦{n2(x.nav)}</td>
              <td><span style={{ display: 'inline-flex', gap: 6 }}><input className="inp" style={{ width: 100, padding: '6px 8px' }} aria-label={'New NAV for ' + x.name} inputMode="decimal" value={nav[x.id] ?? ''} onChange={e => setNav({ ...nav, [x.id]: e.target.value })} placeholder={n2(x.nav)} /><button className="btn btn-o btn-s" type="button" onClick={() => { const v = +nav[x.id]; if (!(v > 0)) { toast('Enter a price', 'bad'); return } dispatch({ type: 'FUND_NAV', id: x.id, nav: v }); setNav({ ...nav, [x.id]: '' }); toast('NAV published', 'good') }}>Publish</button></span></td>
              <td><button className="linkbtn" type="button" onClick={() => dispatch({ type: 'FUND_UPSERT', fund: { id: x.id, status: x.status === 'Open' ? 'Suspended' : 'Open' } })}>{x.status === 'Open' ? 'Suspend sales' : 'Reopen'}</button></td></tr>)}
          </tbody></table></div>}
        </div>
      </div>
      {f && <Modal title="New public offer" onClose={() => setF(null)}>
        <div className="stack" style={{ gap: 10 }}>
          <Field label="Type" id="pk"><select id="pk" className="inp" value={f.kind} onChange={set('kind')}>{['IPO', 'Rights issue', 'Public offer', 'Bond offer'].map(k => <option key={k}>{k}</option>)}</select></Field>
          <Field label="Offer title" id="pn"><input id="pn" className="inp" value={f.name} onChange={set('name')} /></Field>
          <Field label="Issuer" id="pi"><input id="pi" className="inp" value={f.issuer} onChange={set('issuer')} /></Field>
          <div className="grid g2"><Field label="Price per unit (₦)" id="pp"><input id="pp" className="inp" inputMode="decimal" value={f.unitPrice} onChange={set('unitPrice')} /></Field><Field label="Minimum units" id="pm"><input id="pm" className="inp" inputMode="numeric" value={f.minUnits} onChange={set('minUnits')} /></Field></div>
          <div className="grid g2"><Field label="Opens" id="po"><input id="po" type="date" className="inp" value={f.opens} onChange={set('opens')} /></Field><Field label="Closes" id="pc"><input id="pc" type="date" className="inp" value={f.closes} onChange={set('closes')} /></Field></div>
          <button className="btn btn-p" type="button" onClick={save}>Create offer</button>
        </div>
      </Modal>}
    </>
  )
}
