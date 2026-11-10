import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, offerStats } from '../../store/store.jsx'
import { Pill, Tabs, Empty } from '../../components/ui.jsx'
import { Progress, Notice } from '../../components/kit.jsx'
import { Money } from '../../components/Money.jsx'
import { naira, n2, fmtDate, daysLeft } from '../../utils.js'

export const offerPill = (st) => <Pill kind={{ Open: 'good', Upcoming: 'info', Closed: 'grey', Allotted: 'good', Cancelled: 'grey' }[st] || 'grey'}>{st}</Pill>
const KIND = { 'IPO': 'gold', 'Rights issue': 'info', 'Public offer': 'info', 'Bond offer': 'grey' }

export default function Offers() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get('tab') || 'open')
  const mine = state.offerApps.filter(a => a.owner === 'u-1')
  const groups = {
    open: state.offers.filter(o => o.status === 'Open'),
    upcoming: state.offers.filter(o => o.status === 'Upcoming'),
    past: state.offers.filter(o => ['Closed', 'Allotted', 'Cancelled'].includes(o.status)),
  }
  const list = groups[tab] || []
  return (
    <>
      <TopBar title="Public offers" />
      <div className="content">
        {!state.settings.flags.ipo && <Notice kind="warn">New applications are paused right now. You can still see offers and your applications.</Notice>}
        <div className="pagehead">
          <div><h2>IPOs, rights issues and bond offers</h2><div className="sub">Buy new shares and bonds before they trade on the market. Your money is held until allotment; whatever you are not allotted comes straight back.</div></div>
          <div className="small muted">Cash ready: <strong style={{ color: 'var(--ink)' }}><Money v={state.cash.settled} /></strong> · <Link to="/app/funding">Add money</Link></div>
        </div>
        <div className="card tight">
          <Tabs tabs={[{ value: 'open', label: `Open (${groups.open.length})` }, { value: 'upcoming', label: `Upcoming (${groups.upcoming.length})` }, { value: 'past', label: 'Closed and allotted' }, { value: 'mine', label: `My applications (${mine.length})` }]} value={tab} onChange={setTab} />
          {tab !== 'mine' && (
            <div style={{ padding: 20 }}>
              <div className="cards wide">
                {list.map(o => { const st = offerStats(o, state); const dl = daysLeft(o.closes); const dopen = daysLeft(o.opens); return (
                  <Link key={o.id} to={'/app/offers/' + o.id} className="ocard">
                    <div className={'top theme-' + (o.theme || 'a')}><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}><Pill kind={KIND[o.kind] || 'grey'}>{o.kind}</Pill>{offerPill(o.status)}</div><h3>{o.name}</h3></div>
                    <div className="body">
                      <div className="grid g2" style={{ gap: 10 }}>
                        <div><div className="muted xs">{o.coupon ? 'Interest a year' : 'Unit price'}</div><strong>{o.coupon ? o.coupon + '%' : '₦' + n2(o.unitPrice)}</strong></div>
                        <div><div className="muted xs">Minimum entry</div><strong>{naira(st.minEntry)}</strong></div>
                      </div>
                      {o.status !== 'Upcoming' && o.status !== 'Allotted' && <div><div className="row xs muted"><span>Subscribed</span><span>{Math.round(st.pct)}%</span></div><Progress value={st.pct} /></div>}
                      <div className="small muted">{o.status === 'Open' ? `Closes ${fmtDate(o.closes)}${dl >= 0 ? ` · ${dl} day${dl === 1 ? '' : 's'} left` : ''}` : o.status === 'Upcoming' ? `Opens ${fmtDate(o.opens)}${dopen > 0 ? ` · in ${dopen} days` : ''}` : `Closed ${fmtDate(o.closes)}`}</div>
                      <span className={'btn btn-s ' + (o.status === 'Open' ? 'btn-p' : 'btn-o')} style={{ marginTop: 'auto' }}>{o.status === 'Open' ? 'Apply now' : 'View details'}</span>
                    </div>
                  </Link>
                ) })}
              </div>
              {!list.length && <Empty title="Nothing here right now" body="New offers appear here as soon as they are approved by the SEC and open for applications." />}
            </div>
          )}
          {tab === 'mine' && (
            <div className="scroll">
              <table className="tbl wide">
                <thead><tr><th>Offer</th><th>Applied</th><th className="num">Units applied</th><th className="num">Amount</th><th className="num">Allotted</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {mine.map(a => { const o = state.offers.find(x => x.id === a.offerId); return (
                    <tr key={a.id} className="click" onClick={() => nav('/app/offers/' + a.offerId)}>
                      <td><strong>{o?.issuer}</strong><div className="muted xs">{a.id}</div></td><td>{fmtDate(a.ts)}</td><td className="num">{a.units.toLocaleString()}</td><td className="num"><Money v={a.amount} /></td>
                      <td className="num">{a.status === 'Allotted' ? a.allottedUnits.toLocaleString() : <span className="muted">after close</span>}</td>
                      <td><Pill kind={{ Submitted: 'info', Allotted: 'good', Cancelled: 'grey' }[a.status]}>{a.status}</Pill></td>
                      <td>{a.status === 'Submitted' && o?.status === 'Open' && <button className="linkbtn" type="button" onClick={e => { e.stopPropagation(); dispatch({ type: 'OFFER_CANCEL', id: a.id }); toast('Application withdrawn. Your money is back in cash.') }}>Withdraw</button>}</td>
                    </tr>) })}
                  {!mine.length && <tr><td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 30 }}>You have not applied for any offers yet.</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="muted xs">Only offers approved by the Securities and Exchange Commission appear here. Read the prospectus before you apply. Offers carry risk and shares can trade below the offer price.</div>
      </div>
    </>
  )
}
