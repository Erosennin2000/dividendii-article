import React, { useState } from 'react'
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, stockOf, priceOf, isHalted } from '../../store/store.jsx'
import { Pill, Seg, Switch, OrderSteps } from '../../components/ui.jsx'
import ConfirmPin from '../../components/ConfirmPin.jsx'
import { Mono, Back, Notice } from '../../components/kit.jsx'
import { Money } from '../../components/Money.jsx'
import { Check } from '../../components/icons.jsx'
import { naira, n2, n0, pct, computeFees, today } from '../../utils.js'

// The guided buy / sell page: order type, quantity, fees, review, PIN, receipt.
export default function Trade() {
  const { ticker } = useParams()
  const [sp] = useSearchParams()
  const { state, act, toast } = useStore()
  const nav = useNavigate()
  const s = stockOf(ticker)
  const [side, setSide] = useState(sp.get('side') === 'sell' ? 'Sell' : 'Buy')
  const [type, setType] = useState(s && s.liquidity === 'Thin' ? 'Limit' : 'Market')
  const [limit, setLimit] = useState(s ? s.price : 0)
  const [mode, setMode] = useState('units')
  const [qty, setQty] = useState('')
  const [dayOnly, setDayOnly] = useState(true)
  const [review, setReview] = useState(false)
  const [done, setDone] = useState(null)
  const [showFees, setShowFees] = useState(false)

  if (!s) return <><TopBar title="Not found" /><div className="content"><div className="card">No security called {ticker}. <Link to="/app/markets">Back to markets</Link></div></div></>

  const last = priceOf(ticker, state.settings)
  const held = state.holdings.find(h => h.ticker === ticker)
  const halted = isHalted(ticker, state.settings)
  const px = type === 'Limit' ? (Number(limit) || last) : last
  const q = Number(String(qty).replace(/,/g, '')) || 0
  const units = mode === 'amount' ? Math.floor(q / px) : Math.floor(q)
  const value = units * px
  const fees = computeFees(value, state.settings)
  const total = side === 'Buy' ? value + fees.total : value - fees.total
  const band = type === 'Limit' && (px < last * 0.9 || px > last * 1.1)
  const noCash = side === 'Buy' && total > state.cash.settled
  const noUnits = side === 'Sell' && units > (held?.units || 0)
  const paused = !state.settings.flags.trading
  const sellBlocked = side === 'Sell' && !held
  const ready = units > 0 && !band && !noCash && !noUnits && !paused && !halted && !sellBlocked && (type === 'Market' || Number(limit) > 0)
  const verb = side === 'Buy' ? 'Buy' : 'Sell'

  async function place(pin) {
    const order = { id: 'VND-26-' + String(4816 + state.orders.length).padStart(6, '0'), ts: today(), side, ticker, units, filled: 0, type, limit: type === 'Limit' ? px : null, status: 'Received', validity: dayOnly ? 'Day' : 'GTC', owner: 'u-1', timeline: [['Received', today()]] }
    await act({ type: 'PLACE_ORDER', order, pin })
    setReview(false); setDone(order)
    toast(`${side} order for ${n0(units)} ${ticker} received`, 'good')
  }

  if (done) {
    const o = state.orders.find(x => x.id === done.id) || done
    return (
      <>
        <TopBar title="Order received" />
        <div className="content">
          <div className="success">
            <div className="bigcheck"><Check size={34} stroke={2.6} /></div>
            <h1 style={{ fontSize: 26 }}>Your {done.side.toLowerCase()} order is in</h1>
            <p className="muted">We send it to the exchange and tell you at every step. Orders placed after the close queue for tomorrow's open.</p>
            <div className="card">
              <div className="kv"><span className="muted">Order number</span><strong>{done.id}</strong></div>
              <div className="kv"><span className="muted">Security</span><strong>{ticker}</strong></div>
              <div className="kv"><span className="muted">Quantity</span><strong>{n0(done.units)} units</strong></div>
              <div className="kv"><span className="muted">Order type</span><strong>{done.type}{done.limit ? ` at ₦${n2(done.limit)}` : ''}</strong></div>
              <div className="kv"><span className="muted">Valid</span><strong>{done.validity === 'Day' ? 'Today only' : 'Until cancelled'}</strong></div>
              <div className="kv tot"><span>Estimated {done.side === 'Buy' ? 'cost' : 'proceeds'}</span><strong>{naira(total)}</strong></div>
            </div>
            <div className="card" style={{ paddingBottom: 28 }}><OrderSteps order={o} /></div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
              <Link to="/app/orders" className="btn btn-p">View order</Link>
              <Link to={'/app/stock/' + ticker} className="btn btn-o">Back to {ticker}</Link>
              <Link to="/app/equities" className="btn btn-o">My equities</Link>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <TopBar title="Equities"><Link to={'/app/stock/' + ticker} className="small">Cancel</Link></TopBar>
      <div className="content">
        <div className="ticket stack">
          <Back to={'/app/stock/' + ticker}>Back to {ticker}</Back>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Mono text={ticker} size={48} />
            <div><h1>{side === 'Buy' ? 'Purchase' : 'Sell'} {ticker}</h1><div className="sub">{s.name} · ₦{n2(last)} <span className={s.price >= s.prev ? 'up' : 'dn'}>({s.price >= s.prev ? '+' : ''}{pct((s.price / s.prev - 1) * 100)})</span></div></div>
          </div>
          <Seg options={[{ value: 'Buy', label: 'Buy' }, { value: 'Sell', label: 'Sell' }]} value={side} onChange={v => { setSide(v); setQty('') }} ariaLabel="Buy or sell" />
          {halted && <Notice kind="bad">Trading in {ticker} is halted right now. You can place an order again when it resumes.</Notice>}
          {paused && <Notice kind="warn">Trading is paused on Vendii right now. See the status page for details.</Notice>}
          {s.liquidity === 'Thin' && <Notice kind="warn">{ticker} trades on few days (about {s.deals} deals today). Buying is easy; selling may take days or weeks, so we start you on a limit order.</Notice>}
          {sellBlocked && <Notice kind="warn">You do not own any {ticker}. <button className="linkbtn" type="button" onClick={() => setSide('Buy')}>Buy instead</button></Notice>}

          <div className="formgrid">
            <div>
              <label className="lbl" htmlFor="otype">Order type *</label>
              <select id="otype" className="inp" value={type} onChange={e => setType(e.target.value)}>
                <option value="Market">{side === 'Buy' ? 'Buy' : 'Sell'} at market price</option>
                <option value="Limit">Limit order</option>
              </select>
            </div>
            {type === 'Limit' && (
              <div>
                <label className="lbl" htmlFor="lim">{side === 'Buy' ? 'Buy' : 'Sell'} when price is *</label>
                <input id="lim" className="inp" type="number" step="0.05" value={limit} onChange={e => setLimit(e.target.value)} placeholder="Enter limit" />
              </div>
            )}
          </div>
          {band && <Notice kind="warn">This price is outside today's allowed range for {ticker} (₦{n2(last * 0.9)} to ₦{n2(last * 1.1)}). The exchange will reject it.</Notice>}

          <div className="balbox">
            <div className="row" style={{ alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                <div className="row" style={{ justifyContent: 'flex-start', gap: 14 }}><span className="lbl" style={{ margin: 0 }}>{mode === 'units' ? 'Units to ' + side.toLowerCase() : 'Amount to ' + (side === 'Buy' ? 'spend (₦)' : 'raise (₦)')}</span>
                  <span className="xs"><button className="linkbtn" type="button" style={{ fontWeight: mode === 'units' ? 700 : 400 }} onClick={() => { setMode('units'); setQty('') }}>units</button> · <button className="linkbtn" type="button" style={{ fontWeight: mode === 'amount' ? 700 : 400 }} onClick={() => { setMode('amount'); setQty('') }}>amount</button></span></div>
                <input className="qty" inputMode="numeric" value={qty} onChange={e => setQty(e.target.value.replace(/[^\d.,]/g, ''))} placeholder="0" aria-label={mode === 'units' ? 'Number of units' : 'Amount in naira'} style={{ marginTop: 8 }} />
                {mode === 'amount' && q > 0 && <div className="muted xs">That is {n0(units)} units at ₦{n2(px)}. Shares trade in whole units.</div>}
              </div>
              <div style={{ textAlign: 'right', fontSize: 13 }}>
                {side === 'Buy'
                  ? <><div className="muted">Brokerage balance</div><strong style={{ fontSize: 16 }}><Money v={state.cash.settled} dec={2} /></strong><div><Link to="/app/funding" className="small">Fund account +</Link></div></>
                  : <><div className="muted">Units held</div><strong style={{ fontSize: 16 }}>{n0(held?.units || 0)}</strong><div><button className="linkbtn" type="button" style={{ fontSize: 13, fontWeight: 600 }} onClick={() => { setMode('units'); setQty(String(held?.units || 0)) }}>Sell all units</button></div></>}
              </div>
            </div>
          </div>
          {noCash && units > 0 && <Notice kind="bad" action={<Link to="/app/funding" className="btn btn-d btn-s">Add money</Link>}>Not enough settled cash for this order. Lower the quantity or add money.</Notice>}
          {noUnits && <Notice kind="bad">You hold {n0(held?.units || 0)} units of {ticker}.</Notice>}

          <div className="rowline" style={{ padding: '14px 16px' }}><span>Cancel the order if it is not executed today<div className="muted xs">Turn off to keep it open until you cancel it</div></span><Switch on={dayOnly} onChange={() => setDayOnly(!dayOnly)} label="Cancel if not executed today" /></div>

          {units > 0 && (
            <div className="sumtbl">
              <div className="kv"><span className="muted">Price per share</span><span className="num">₦{n2(px)}</span></div>
              <div className="kv"><span className="muted">Estimated trade value</span><span className="num">{naira(value, { dec: 2 })}</span></div>
              <div className="kv"><span className="muted">Fees and charges <button className="linkbtn" type="button" style={{ fontSize: 12 }} onClick={() => setShowFees(!showFees)}>{showFees ? 'hide' : 'see breakdown'}</button></span><span className="num">{naira(fees.total, { dec: 2 })}</span></div>
              {showFees && <div style={{ padding: '4px 0 10px', fontSize: 13 }} className="muted">
                {[['Brokerage commission', fees.comm, state.settings.commission], ['SEC fee', fees.sec, state.settings.secFee], ['NGX fee', fees.ngx, state.settings.ngxFee], ['CSCS fee', fees.cscs, state.settings.cscsFee], ['Stamp duty', fees.stamp, state.settings.stampDuty]].map(([l, v, r]) => <div className="kv" key={l} style={{ padding: '2px 0' }}><span>{l} ({pct(r * 100, 3)})</span><span className="num">{naira(v, { dec: 2 })}</span></div>)}
                <div className="kv" style={{ padding: '2px 0' }}><span>VAT on fees ({pct(state.settings.vat * 100)})</span><span className="num">{naira(fees.vat, { dec: 2 })}</span></div></div>}
              <div className="kv tot"><span>Total estimated amount</span><span className="num">{naira(total, { dec: 2 })}</span></div>
            </div>
          )}

          <button className="btn btn-p btn-l btn-block" type="button" disabled={!ready} onClick={() => setReview(true)}>{verb} →</button>
          <div className="muted xs" style={{ textAlign: 'center' }}>By placing an order you confirm that you understand the investment risk and the importance of seeking professional advice. Final figures come from your broker on the contract note.</div>
        </div>
      </div>
      {review && (
        <ConfirmPin title={`Confirm ${side.toLowerCase()} order`} cta={`Place ${side.toLowerCase()} order`} onClose={() => setReview(false)} onConfirm={place}>
          <div className="kv"><span className="muted">Security</span><strong>{ticker}</strong></div>
          <div className="kv"><span className="muted">Units</span><strong>{n0(units)}</strong></div>
          <div className="kv"><span className="muted">Order</span><strong>{type}{type === 'Limit' ? ` at ₦${n2(px)}` : ''}, {dayOnly ? 'valid today' : 'until cancelled'}</strong></div>
          <div className="kv tot"><span>{side === 'Buy' ? 'Total you pay' : 'You receive'}</span><strong>{naira(total, { dec: 2 })}</strong></div>
        </ConfirmPin>
      )}
    </>
  )
}
