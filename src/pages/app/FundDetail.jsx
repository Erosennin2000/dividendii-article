import React, { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, fundFx } from '../../store/store.jsx'
import { Pill, Tabs } from '../../components/ui.jsx'
import AreaChart from '../../components/AreaChart.jsx'
import ConfirmPin from '../../components/ConfirmPin.jsx'
import { Money, Mask } from '../../components/Money.jsx'
import { Mono, Back, RiskDots, Notice, SplitBar } from '../../components/kit.jsx'
import { Download } from '../../components/icons.jsx'
import { naira, n2, pct, uid } from '../../utils.js'

const RANGE = { '1M': [30, 30], '3M': [60, 90], '1Y': [90, 365] }

export default function FundDetail() {
  const { id } = useParams()
  const { state, act, toast } = useStore()
  const f = state.funds.find(x => x.id === id)
  const [range, setRange] = useState('3M')
  const [modal, setModal] = useState(null)
  const [tab, setTab] = useState('about')
  if (!f) return <><TopBar title="Fund not found" /><div className="content"><div className="card">No fund with that ID. <Link to="/app/funds">Back to funds</Link></div></div></>

  const fx = fundFx(f, state.settings), sym = f.currency === 'USD' ? '$' : '₦'
  const h = state.fundHoldings.find(x => x.fundId === id)
  const [n, span] = RANGE[range]
  const values = f.history.slice(-n)
  const labels = values.map((_, i) => new Date(Date.now() - (values.length - 1 - i) * (span / Math.max(1, values.length - 1)) * 86400000).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }))
  const change = values[values.length - 1] / values[0] - 1
  const value = h ? h.units * f.nav * fx : 0, cost = h ? h.units * h.avgCost * fx : 0
  const open = f.status === 'Open' && state.settings.flags.funds

  return (
    <>
      <TopBar title="Mutual funds" />
      <div className="content">
        <Back to="/app/funds">All funds</Back>
        <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Mono text={f.name} size={52} />
            <div><h1 style={{ fontSize: 26 }}>{f.name}</h1><div style={{ display: 'flex', gap: 8, marginTop: 6, flexWrap: 'wrap' }}><Pill>{f.type}</Pill><span className="muted small">{f.manager}</span>{f.status !== 'Open' && <Pill kind="warn">{f.status}</Pill>}</div></div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {h && <button className="btn btn-o" type="button" onClick={() => setModal('sell')}>Sell units</button>}
            <button className="btn btn-p" type="button" disabled={!open} onClick={() => setModal('buy')}>{h ? 'Buy more' : 'Invest'}</button>
          </div>
        </div>
        {!open && <Notice kind="warn">{f.status !== 'Open' ? `New purchases are ${f.status.toLowerCase()} for this fund. You can still sell what you hold.` : 'Fund purchases are paused on Vendii right now.'}</Notice>}

        {h && (
          <div className="grid g3">
            <div className="stat"><div className="lab">Current value</div><div className="val"><Money v={value} /></div><div className="sub"><Mask>{h.units.toLocaleString('en-NG', { maximumFractionDigits: 2 })} units</Mask></div></div>
            <div className="stat"><div className="lab">Amount invested</div><div className="val"><Money v={cost} /></div><div className="sub"><Mask>Average price {sym}{n2(h.avgCost)}</Mask></div></div>
            <div className="stat ink"><div className="lab">Gain / loss</div><div className="val"><Mask>{value - cost >= 0 ? '+' : '-'}{naira(Math.abs(value - cost))}</Mask></div><div className="sub"><Mask>{pct((value / (cost || 1) - 1) * 100)}</Mask></div></div>
          </div>
        )}

        <div className="grid g3" style={{ alignItems: 'start' }}>
          <div className="span2 stack">
            <div className="card">
              <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div><div className="muted small">Unit price (NAV)</div><div style={{ fontSize: 34, fontWeight: 700 }} className="num">{sym}{n2(f.nav)}</div><div className={change >= 0 ? 'up' : 'dn'} style={{ fontSize: 13, fontWeight: 600 }}>{change >= 0 ? '+' : ''}{pct(change * 100, 2)} over {range}</div></div>
                <div className="range">{Object.keys(RANGE).map(r => <button key={r} type="button" className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>)}</div>
              </div>
              <div style={{ marginTop: 12 }}><AreaChart values={values} labels={labels} prefix={sym} ariaLabel={`${f.name} unit price, sample data`} /></div>
              <div className="grid g3" style={{ marginTop: 16, gap: 12 }}>
                {[['1 month', f.ret.m1], ['3 months', f.ret.m3], ['1 year', f.ret.y1]].map(([l, v]) => <div key={l} className="rowline" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2 }}><span className="muted xs">{l} return</span><strong className={v >= 0 ? 'up' : 'dn'} style={{ fontSize: 18 }}>{v >= 0 ? '+' : ''}{pct(v)}</strong></div>)}
              </div>
            </div>
            <div className="card tight">
              <Tabs tabs={[{ value: 'about', label: 'About the fund' }, { value: 'mix', label: 'What it holds' }, { value: 'docs', label: 'Documents' }]} value={tab} onChange={setTab} />
              <div style={{ padding: 20 }}>
                {tab === 'about' && <div className="stack" style={{ gap: 12 }}><p>{f.about}</p><div><span className="lbl">Risk level</span><RiskDots n={f.risk} /></div></div>}
                {tab === 'mix' && <SplitBar parts={f.mix.map(([label, value]) => ({ label, value }))} />}
                {tab === 'docs' && <div className="stack" style={{ gap: 8 }}>{['Fund factsheet (PDF)', 'Prospectus / trust deed (PDF)', 'Latest quarterly report (PDF)'].map(d => <div className="rowline" key={d}><span>{d}</span><button className="linkbtn" type="button" onClick={() => toast(d.replace(' (PDF)', '') + ' will download once the manager supplies it')}><Download size={14} style={{ verticalAlign: -2 }} /> Download</button></div>)}</div>}
              </div>
            </div>
          </div>
          <div className="stack">
            <div className="card">
              <h2 style={{ fontSize: 17 }}>Fund facts</h2>
              <div style={{ marginTop: 8 }}>
                {[['Fund type', f.type], ['Fund manager', f.manager], ['Minimum first purchase', sym + f.minInitial.toLocaleString()], ['Minimum top-up', sym + f.minTopUp.toLocaleString()], ['Management fee', f.fee + '% a year'], ['Entry or exit charge', 'None'], ['Money back in', f.redemption], ['Fund size', f.aum], ['Currency', f.currency === 'USD' ? 'US dollars' : 'Naira']].map(([k, v]) => <div className="kv" key={k} style={{ borderBottom: '1px solid var(--soft)', padding: '9px 0' }}><span className="muted">{k}</span><strong style={{ fontWeight: 600, textAlign: 'right' }}>{v}</strong></div>)}
              </div>
            </div>
            <div className="card">
              <div className="small muted">Cash ready to invest</div><div style={{ fontSize: 22, fontWeight: 700 }}><Money v={state.cash.settled} /></div>
              <Link to="/app/funding" className="small">Add money</Link>
              <div className="muted xs" style={{ marginTop: 10 }}>Past performance is not a guide to future returns. Unit prices can fall as well as rise.</div>
            </div>
          </div>
        </div>
      </div>
      {modal === 'buy' && <BuyModal f={f} h={h} fx={fx} sym={sym} onClose={() => setModal(null)} />}
      {modal === 'sell' && <SellModal f={f} h={h} fx={fx} sym={sym} onClose={() => setModal(null)} />}
    </>
  )
}

function BuyModal({ f, h, fx, sym, onClose }) {
  const { state, act, toast } = useStore()
  const [amount, setAmount] = useState('')
  const a = Number(String(amount).replace(/,/g, '')) || 0
  const units = a / (f.nav * fx)
  const min = (h ? f.minTopUp : f.minInitial) * fx
  async function go(pin) {
    if (a < min) throw new Error(`The minimum ${h ? 'top-up' : 'first purchase'} is ${naira(min)}.`)
    if (a > state.cash.settled) throw new Error('You do not have enough settled cash. Add money first.')
    await act({ type: 'FUND_SUBSCRIBE', fundId: f.id, amount: a, units, nav: f.nav, pin, tx: { id: uid('TX') } })
    toast(`${naira(a)} invested in ${f.name}`, 'good'); onClose()
  }
  return (
    <ConfirmPin title={`Invest in ${f.name}`} cta="Confirm purchase" onClose={onClose} onConfirm={go}>
      <label className="lbl" htmlFor="famt">Amount to invest (₦)</label>
      <input id="famt" className="inp" inputMode="numeric" autoFocus value={amount} onChange={e => setAmount(e.target.value.replace(/[^\d,]/g, ''))} placeholder={`Minimum ${min.toLocaleString()}`} />
      <div className="chips" style={{ marginTop: 8 }}>{[min, 50000, 100000, 250000].filter((v, i, arr) => arr.indexOf(v) === i && v >= min).map(v => <button key={v} type="button" className="chip" onClick={() => setAmount(String(v))}>{naira(v)}</button>)}</div>
      <div style={{ marginTop: 14 }}>
        <div className="kv"><span className="muted">Unit price</span><span>{sym}{n2(f.nav)}</span></div>
        <div className="kv"><span className="muted">Estimated units</span><strong>{units.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</strong></div>
        <div className="kv"><span className="muted">Charges</span><span>None. Fee of {f.fee}% a year is built into the unit price.</span></div>
        <div className="kv tot"><span>You pay</span><span>{naira(a)}</span></div>
        <div className="muted xs">Units are priced at the next published NAV, so the final number can differ slightly. Cash available: {naira(state.cash.settled)}.</div>
      </div>
    </ConfirmPin>
  )
}

function SellModal({ f, h, fx, sym, onClose }) {
  const { act, toast } = useStore()
  const [units, setUnits] = useState('')
  const u = Number(String(units).replace(/,/g, '')) || 0
  const proceeds = u * f.nav * fx
  async function go(pin) {
    if (u <= 0) throw new Error('Enter how many units to sell.')
    if (u > h.units + 0.0001) throw new Error(`You hold ${h.units.toLocaleString('en-NG', { maximumFractionDigits: 2 })} units.`)
    await act({ type: 'FUND_REDEEM', fundId: f.id, units: Math.min(u, h.units), proceeds, pin })
    toast(`Sale of ${f.name} received. Money back in ${f.redemption}.`, 'good'); onClose()
  }
  return (
    <ConfirmPin title={`Sell ${f.name}`} cta="Confirm sale" onClose={onClose} onConfirm={go}>
      <div className="row"><label className="lbl" htmlFor="funits" style={{ margin: 0 }}>Units to sell</label><button className="linkbtn" type="button" onClick={() => setUnits(String(h.units))}>Sell all ({h.units.toLocaleString('en-NG', { maximumFractionDigits: 2 })})</button></div>
      <input id="funits" className="inp" inputMode="decimal" autoFocus value={units} onChange={e => setUnits(e.target.value.replace(/[^\d.,]/g, ''))} style={{ marginTop: 6 }} />
      <div style={{ marginTop: 14 }}>
        <div className="kv"><span className="muted">Unit price</span><span>{sym}{n2(f.nav)}</span></div>
        <div className="kv tot"><span>You receive about</span><span>{naira(proceeds)}</span></div>
        <div className="muted xs">The money reaches your cash balance {f.redemption} after the sale. It is paid at the next published NAV.</div>
      </div>
    </ConfirmPin>
  )
}
