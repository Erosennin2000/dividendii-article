import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, offerStats } from '../../store/store.jsx'
import { Pill } from '../../components/ui.jsx'
import ConfirmPin from '../../components/ConfirmPin.jsx'
import { Money } from '../../components/Money.jsx'
import { Back, Notice, Progress, Milestones } from '../../components/kit.jsx'
import { Download } from '../../components/icons.jsx'
import { offerPill } from './Offers.jsx'
import { naira, n2, fmtDate, daysLeft, uid, today } from '../../utils.js'

export default function OfferDetail() {
  const { id } = useParams()
  const { state, dispatch, act, toast } = useStore()
  const o = state.offers.find(x => x.id === id)
  const [units, setUnits] = useState('')
  const [review, setReview] = useState(false)
  const [remind, setRemind] = useState(false)
  if (!o) return <><TopBar title="Offer not found" /><div className="content"><div className="card">No offer with that ID. <Link to="/app/offers">Back to offers</Link></div></div></>

  const st = offerStats(o, state)
  const mine = state.offerApps.find(a => a.offerId === id && a.owner === 'u-1' && a.status !== 'Cancelled')
  const u = Number(String(units).replace(/,/g, '')) || 0
  const amount = u * o.unitPrice
  const open = o.status === 'Open' && state.settings.flags.ipo && daysLeft(o.closes) >= 0
  const problem = !u ? '' : u < o.minUnits ? `The minimum is ${o.minUnits.toLocaleString()} units (${naira(st.minEntry)}).` : u % (o.multiple || 1) ? `Apply in multiples of ${o.multiple} units.` : amount > state.cash.settled ? 'You do not have enough settled cash for this application.' : ''
  const canSubmit = open && u > 0 && !problem && !mine
  const dates = [['Applications open', o.opens], ['Applications close', o.closes], ['Allotment', o.allotment], ['Listing / first payment', o.listing]]
  const firstFuture = dates.findIndex(([, d]) => daysLeft(d) > 0)
  const miles = dates.map(([label, d], i) => ({ label, date: fmtDate(d), state: i < firstFuture || firstFuture < 0 ? 'done' : i === firstFuture ? 'now' : 'next' }))

  async function apply(pin) {
    const app = { id: uid('APP'), offerId: o.id, owner: 'u-1', ownerName: state.user.name, units: u, amount, status: 'Submitted', ts: today() }
    await act({ type: 'OFFER_APPLY', app, pin })
    setReview(false); setUnits('')
    toast(`Application for ${u.toLocaleString()} units received`, 'good')
  }

  return (
    <>
      <TopBar title="Public offers" />
      <div className="content">
        <Back to="/app/offers">All offers</Back>
        <div className={'hero-offer theme-' + (o.theme || 'a')}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Pill kind="gold">{o.kind}</Pill>{offerPill(o.status)}<Pill kind="grey">{o.sector}</Pill></div>
          <h1 style={{ marginTop: 12 }}>{o.name}</h1>
          <p>{o.summary}</p>
          <div className="keyfacts">
            <div><span>{o.coupon ? 'Interest a year' : 'Unit price'}</span><strong>{o.coupon ? o.coupon + '%' : '₦' + n2(o.unitPrice)}</strong></div>
            <div><span>Minimum entry</span><strong>{naira(st.minEntry)}</strong></div>
            <div><span>{o.status === 'Open' ? 'Closes' : 'Closed'}</span><strong>{fmtDate(o.closes)}</strong></div>
            <div><span>{o.tenor ? 'Maturity' : o.ratio ? 'Ratio' : 'Offer size'}</span><strong>{o.tenor ? o.tenor + ' years' : o.ratio ? o.ratio.split(' for ')[0] + ' for ' + o.ratio.split(' for ')[1].split(' ')[0] : naira(o.sizeUnits * o.unitPrice / 1e9, { dec: 0 }) + 'bn'}</strong></div>
          </div>
        </div>

        <div className="grid g3" style={{ alignItems: 'start' }}>
          <div className="span2 stack">
            <div className="card"><h2 style={{ fontSize: 17 }}>Timetable</h2><div style={{ marginTop: 14 }}><Milestones items={miles} /></div></div>
            <div className="card">
              <h2 style={{ fontSize: 17 }}>Why people take part</h2>
              <ul style={{ margin: '12px 0 0', paddingLeft: 20, display: 'grid', gap: 8 }}>{o.highlights.map(h => <li key={h}>{h}</li>)}</ul>
              {o.ratio && <div className="rowline" style={{ marginTop: 14 }}><span>Rights ratio</span><strong>{o.ratio}</strong></div>}
            </div>
            <div className="card">
              <h2 style={{ fontSize: 17 }}>What the money is for</h2>
              <div style={{ marginTop: 10 }}>{o.useOfProceeds.map(([l, v]) => <div className="bar-row" key={l}><span>{l}</span><Progress value={v} /><span className="num">{v}%</span></div>)}</div>
            </div>
            {o.risks && <div className="alert warn" style={{ fontSize: 14 }}><strong>Risks to think about.</strong> {o.risks}</div>}
            <div className="card"><h2 style={{ fontSize: 17 }}>Documents</h2><div className="stack" style={{ gap: 8, marginTop: 10 }}>{o.docs.map(d => <div className="rowline" key={d}><span>{d}</span><button className="linkbtn" type="button" onClick={() => toast('Document available once the issuer supplies it')}><Download size={14} style={{ verticalAlign: -2 }} /> Download</button></div>)}</div><div className="muted xs" style={{ marginTop: 10 }}>Registrar: {o.registrar}</div></div>
          </div>

          <div className="stack">
            {o.status !== 'Upcoming' && <div className="card"><div className="row xs muted"><span>Subscribed so far</span><span>{Math.round(st.pct)}%</span></div><Progress value={st.pct} /><div className="muted xs" style={{ marginTop: 8 }}>{st.pct > 100 ? 'Oversubscribed. Allotment may be pro-rata, and any money for units you are not allotted comes back.' : 'Figures update as applications arrive.'}</div></div>}
            {mine ? (
              <div className="card" style={{ borderColor: 'var(--blue)' }}>
                <div className="row"><h2 style={{ fontSize: 17 }}>Your application</h2><Pill kind={{ Submitted: 'info', Allotted: 'good' }[mine.status]}>{mine.status}</Pill></div>
                <div className="kv" style={{ marginTop: 8 }}><span className="muted">Reference</span><strong>{mine.id}</strong></div>
                <div className="kv"><span className="muted">Units applied</span><strong>{mine.units.toLocaleString()}</strong></div>
                <div className="kv"><span className="muted">Amount held</span><strong><Money v={mine.amount} /></strong></div>
                {mine.status === 'Allotted' && <><div className="kv"><span className="muted">Units allotted</span><strong>{mine.allottedUnits.toLocaleString()}</strong></div><div className="kv"><span className="muted">Returned to cash</span><strong><Money v={mine.refund} /></strong></div></>}
                {mine.status === 'Submitted' && o.status === 'Open' && <button className="btn btn-d btn-block" type="button" style={{ marginTop: 12 }} onClick={() => { dispatch({ type: 'OFFER_CANCEL', id: mine.id }); toast('Application withdrawn. Your money is back in cash.') }}>Withdraw application</button>}
                {mine.status === 'Submitted' && <div className="muted xs" style={{ marginTop: 10 }}>You will see the result here after allotment on {fmtDate(o.allotment)}.</div>}
              </div>
            ) : (
              <div className="card">
                <h2 style={{ fontSize: 17 }}>{o.status === 'Open' ? 'Apply' : o.status === 'Upcoming' ? 'Opens soon' : 'Offer closed'}</h2>
                {o.status === 'Open' && <>
                  <div style={{ marginTop: 12 }}>
                    <label className="lbl" htmlFor="ou">Number of units</label>
                    <input id="ou" className="inp" inputMode="numeric" value={units} onChange={e => setUnits(e.target.value.replace(/[^\d,]/g, ''))} placeholder={`Minimum ${o.minUnits.toLocaleString()}`} disabled={!open} />
                    <div className="chips" style={{ marginTop: 8 }}>{[1, 5, 25].map(m => o.minUnits * m).map(v => <button key={v} type="button" className="chip" disabled={!open} onClick={() => setUnits(String(v))}>{v.toLocaleString()}</button>)}</div>
                  </div>
                  <div style={{ marginTop: 14, padding: 14, background: 'var(--paper)', borderRadius: 10 }}>
                    <div className="kv"><span className="muted">Price per unit</span><span>₦{n2(o.unitPrice)}</span></div>
                    <div className="kv"><span className="muted">Charges</span><span>None</span></div>
                    <div className="kv tot"><span>You pay now</span><span>{naira(amount, { dec: 2 })}</span></div>
                  </div>
                  <div className="small muted" style={{ marginTop: 10 }}>Cash ready: <strong style={{ color: 'var(--ink)' }}><Money v={state.cash.settled} /></strong> · <Link to="/app/funding">Add money</Link></div>
                  {problem && <div className="alert bad" style={{ marginTop: 10 }}>{problem}</div>}
                  {!state.settings.flags.ipo && <div className="alert warn" style={{ marginTop: 10 }}>Applications are paused right now.</div>}
                  <button className="btn btn-p btn-block btn-l" type="button" style={{ marginTop: 12 }} disabled={!canSubmit} onClick={() => setReview(true)}>Review application</button>
                  <div className="muted xs" style={{ marginTop: 10 }}>The amount is held from your cash until allotment. Withdraw any time before {fmtDate(o.closes)}.</div>
                </>}
                {o.status === 'Upcoming' && <><p className="muted small" style={{ marginTop: 8 }}>Applications open {fmtDate(o.opens)}. We will tell you the moment they do.</p><button className="btn btn-o btn-block" type="button" style={{ marginTop: 12 }} onClick={() => { setRemind(!remind); toast(remind ? 'Reminder removed' : 'We will remind you when it opens') }}>{remind ? 'Reminder on ✓' : 'Remind me'}</button></>}
                {!['Open', 'Upcoming'].includes(o.status) && <p className="muted small" style={{ marginTop: 8 }}>This offer is no longer taking applications.</p>}
              </div>
            )}
          </div>
        </div>
      </div>
      {review && (
        <ConfirmPin title="Confirm your application" cta="Submit application" onClose={() => setReview(false)} onConfirm={apply}>
          <div className="kv"><span className="muted">Offer</span><strong style={{ textAlign: 'right' }}>{o.issuer}</strong></div>
          <div className="kv"><span className="muted">Units</span><strong>{u.toLocaleString()}</strong></div>
          <div className="kv"><span className="muted">Price per unit</span><strong>₦{n2(o.unitPrice)}</strong></div>
          <div className="kv tot"><span>Held from your cash</span><strong>{naira(amount, { dec: 2 })}</strong></div>
          <div className="muted xs" style={{ marginTop: 6 }}>Result after allotment on {fmtDate(o.allotment)}. Unallotted money returns to your cash.</div>
        </ConfirmPin>
      )}
    </>
  )
}
