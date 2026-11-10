import React, { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, portfolio } from '../../store/store.jsx'
import { Pill, Tabs, statusPill } from '../../components/ui.jsx'
import { Money, Mask, EyeToggle } from '../../components/Money.jsx'
import { Mono } from '../../components/kit.jsx'
import { Plus, ArrowRight, Chevron } from '../../components/icons.jsx'
import { naira, n2, n0, pct, fmtTime } from '../../utils.js'
import { STOCKS } from '../../data/mock.js'

const OPEN = ['Received', 'Sent to broker', 'On exchange', 'Partly filled', 'Queued for open']

export default function Equities() {
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [tab, setTab] = useState(sp.get('tab') || 'active')
  const p = portfolio(state)
  const top = [...STOCKS].sort((a, b) => (b.price / b.prev) - (a.price / a.prev)).slice(0, 10)
  const pending = state.orders.filter(o => o.owner === 'u-1' && OPEN.includes(o.status))
  const watch = state.watchlist.map(t => STOCKS.find(s => s.ticker === t)).filter(Boolean)
  const invested = p.rows.reduce((s, r) => s + r.cost, 0)
  const gain = p.equity - invested
  return (
    <>
      <TopBar title="Equities"><Link to="/app/markets" className="btn btn-o btn-s">Explore equities</Link></TopBar>
      <div className="content">
        <div className="card">
          <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div><div className="muted small">Cash balance</div><div className="bigmoney"><Money v={state.cash.settled} dec={2} /></div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}><Link to="/app/funding" className="btn btn-p btn-s"><Plus size={16} /> Fund</Link><Link to="/app/funding#withdraw" className="btn btn-o btn-s">Withdraw</Link></div></div>
              <div><div className="muted small">Portfolio value</div><div className="bigmoney"><Money v={p.equity} dec={2} /></div>
                <div style={{ marginTop: 12 }}><Pill kind={gain >= 0 ? 'good' : 'bad'}><Mask>{gain >= 0 ? '+' : ''}{naira(gain)} ({pct(invested ? gain / invested * 100 : 0)}) all time</Mask></Pill></div></div>
            </div>
            <EyeToggle />
          </div>
        </div>

        <div>
          <div className="row" style={{ marginBottom: 10 }}><div><h2 style={{ fontSize: 18 }}>Discover top stock options</h2><div className="sub" style={{ marginTop: 2 }}>Today's biggest movers on the NGX</div></div><Link to="/app/markets" className="small">Buy equities <ArrowRight size={14} style={{ verticalAlign: -2 }} /></Link></div>
          <div className="carousel">
            {top.map(s => { const c = s.price / s.prev - 1; return (
              <Link key={s.ticker} to={'/app/stock/' + s.ticker} className="scard"><Mono text={s.ticker} size={36} /><div className="t">{s.ticker}</div><div className="n">{s.name}</div><div className="p">₦{n2(s.price)}</div><div className={c >= 0 ? 'up' : 'dn'} style={{ fontSize: 13, fontWeight: 600 }}>{c >= 0 ? '▲' : '▼'} {pct(Math.abs(c) * 100, 2)}</div></Link>
            ) })}
          </div>
        </div>

        <div className="card tight">
          <Tabs tabs={[{ value: 'active', label: `Active (${p.rows.length})` }, { value: 'pending', label: `Pending orders (${pending.length})` }, { value: 'watch', label: `Watchlist (${watch.length})` }]} value={tab} onChange={setTab} />
          {tab === 'active' && (
            <div className="scroll">
              <table className="tbl wide">
                <thead><tr><th>Name</th><th className="num">Purchase price</th><th className="num">Current price</th><th className="num">Amount invested</th><th className="num">Units held</th><th className="num">Current value</th><th className="num">Total gain/loss</th><th></th></tr></thead>
                <tbody>
                  {p.rows.map(r => { const g = r.value - r.cost, gp = r.cost ? g / r.cost * 100 : 0; return (
                    <tr key={r.ticker} className="click" onClick={() => nav('/app/stock/' + r.ticker)}>
                      <td><div className="who"><Mono text={r.ticker} size={34} /><div><strong>{r.stock.name}</strong><span className="muted xs">{r.ticker}</span></div></div></td>
                      <td className="num">₦{n2(r.avgCost)}</td><td className="num">₦{n2(r.price)}</td><td className="num"><Money v={r.cost} dec={2} /></td><td className="num"><Mask>{n0(r.units)}</Mask></td>
                      <td className="num"><Money v={r.value} dec={2} /> <span className={gp >= 0 ? 'up' : 'dn'} style={{ fontSize: 12 }}><Mask>{gp >= 0 ? '+' : ''}{pct(gp, 2)}</Mask></span></td>
                      <td className={'num ' + (g >= 0 ? 'up' : 'dn')} style={{ fontWeight: 600 }}><Mask>{g >= 0 ? '+' : '-'}{naira(Math.abs(g), { dec: 2 })}</Mask></td>
                      <td className="muted"><Chevron size={18} /></td>
                    </tr>
                  ) })}
                  {!p.rows.length && <tr><td colSpan="8" className="muted" style={{ textAlign: 'center', padding: 30 }}>You do not own any shares yet. <Link to="/app/markets">Explore equities</Link></td></tr>}
                </tbody>
                {p.rows.length > 0 && <tfoot><tr><td style={{ padding: 12, fontWeight: 600 }}>Total</td><td colSpan="2"></td><td className="num" style={{ fontWeight: 700 }}><Money v={invested} dec={2} /></td><td></td><td className="num" style={{ fontWeight: 700 }}><Money v={p.equity} dec={2} /></td><td className={'num ' + (gain >= 0 ? 'up' : 'dn')} style={{ fontWeight: 700 }}><Mask>{gain >= 0 ? '+' : '-'}{naira(Math.abs(gain), { dec: 2 })}</Mask></td><td></td></tr></tfoot>}
              </table>
            </div>
          )}
          {tab === 'pending' && (
            <div className="scroll">
              <table className="tbl wide">
                <thead><tr><th>Placed</th><th>Order</th><th>Security</th><th className="num">Units</th><th className="num">Price</th><th>Status</th><th></th></tr></thead>
                <tbody>
                  {pending.map(o => (
                    <tr key={o.id}><td>{fmtTime(o.ts)}</td><td><Pill kind={o.side === 'Buy' ? 'info' : 'bad'}>{o.side}</Pill></td><td><strong>{o.ticker}</strong><div className="muted xs">{o.id}</div></td><td className="num">{n0(o.units)}</td><td className="num">{o.limit ? `Limit ₦${n2(o.limit)}` : 'Market'}</td><td>{statusPill(o.status)}</td><td><button className="linkbtn" type="button" onClick={() => { dispatch({ type: 'CANCEL_ORDER', id: o.id }); toast('Order cancelled') }}>Cancel</button></td></tr>
                  ))}
                  {!pending.length && <tr><td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 30 }}>No orders waiting. <Link to="/app/orders">See all activity</Link></td></tr>}
                </tbody>
              </table>
            </div>
          )}
          {tab === 'watch' && (
            <div className="scroll">
              <table className="tbl wide">
                <thead><tr><th>Name</th><th className="num">Price</th><th className="num">Today</th><th className="num">Div. yield</th><th></th></tr></thead>
                <tbody>
                  {watch.map(s => { const c = s.price / s.prev - 1; return (
                    <tr key={s.ticker} className="click" onClick={() => nav('/app/stock/' + s.ticker)}>
                      <td><div className="who"><Mono text={s.ticker} size={34} /><div><strong>{s.name}</strong><span className="muted xs">{s.ticker}</span></div></div></td>
                      <td className="num">₦{n2(s.price)}</td><td className={'num ' + (c >= 0 ? 'up' : 'dn')}>{c >= 0 ? '+' : ''}{pct(c * 100, 2)}</td><td className="num">{pct(s.yld)}</td>
                      <td style={{ whiteSpace: 'nowrap' }}><Link to={'/app/trade/' + s.ticker + '?side=buy'} className="btn btn-p btn-s" onClick={e => e.stopPropagation()}>Buy</Link> <button className="linkbtn" type="button" onClick={e => { e.stopPropagation(); dispatch({ type: 'WATCH_TOGGLE', ticker: s.ticker }); toast(s.ticker + ' removed from watchlist') }}>Remove</button></td>
                    </tr>
                  ) })}
                  {!watch.length && <tr><td colSpan="5" className="muted" style={{ textAlign: 'center', padding: 30 }}>Your watchlist is empty. Open any company and choose "Add to watchlist".</td></tr>}
                </tbody>
              </table>
            </div>
          )}
        </div>
        <div className="muted xs">Prices delayed 15 minutes. Shares are held in your name at CSCS (CHN {state.user.chn}). Investing carries risk; you can lose some or all of what you put in.</div>
      </div>
    </>
  )
}
