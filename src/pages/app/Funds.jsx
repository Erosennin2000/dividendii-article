import React, { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, portfolio } from '../../store/store.jsx'
import { Pill } from '../../components/ui.jsx'
import { Money, Mask, EyeToggle } from '../../components/Money.jsx'
import { Mono, RiskDots, Notice } from '../../components/kit.jsx'
import { FUND_TYPES } from '../../data/catalog.js'
import { naira, n2, pct } from '../../utils.js'

export default function Funds() {
  const { state } = useStore()
  const nav = useNavigate()
  const [type, setType] = useState('All')
  const [sort, setSort] = useState('ret')
  const [q, setQ] = useState('')
  const p = portfolio(state)
  const cost = p.fundRows.reduce((s, r) => s + r.cost, 0)
  const gain = p.fundsValue - cost
  const list = useMemo(() => {
    let r = state.funds.filter(f => (type === 'All' || f.type === type) && (!q || (f.name + f.type + f.manager).toLowerCase().includes(q.toLowerCase())))
    if (sort === 'ret') r = [...r].sort((a, b) => b.ret.y1 - a.ret.y1)
    if (sort === 'risk') r = [...r].sort((a, b) => a.risk - b.risk)
    if (sort === 'min') r = [...r].sort((a, b) => a.minInitial * (a.currency === 'USD' ? 1520 : 1) - b.minInitial * (b.currency === 'USD' ? 1520 : 1))
    return r
  }, [state.funds, type, sort, q])
  const types = ['All', ...new Set(state.funds.map(f => f.type))]
  return (
    <>
      <TopBar title="Mutual funds" search={<input className="search" type="search" value={q} onChange={e => setQ(e.target.value)} placeholder="Search funds" aria-label="Search funds" />} />
      <div className="content">
        {!state.settings.flags.funds && <Notice kind="warn">New fund purchases are paused right now. You can still see your holdings.</Notice>}
        <div className="card">
          <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 24 }}>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              <div><div className="muted small">Fund value (NGN)</div><div className="bigmoney"><Money v={p.fundsValue} dec={2} /></div></div>
              <div><div className="muted small">Gain or loss</div><div className={'bigmoney ' + (gain >= 0 ? 'up' : 'dn')}><Mask>{gain >= 0 ? '+' : '-'}{naira(Math.abs(gain))}</Mask></div><div className="muted xs"><Mask>{pct(cost ? gain / cost * 100 : 0)} since you invested</Mask></div></div>
              <div><div className="muted small">Cash ready to invest</div><div className="bigmoney"><Money v={state.cash.settled} /></div><Link to="/app/funding" className="small">Add money</Link></div>
            </div>
            <EyeToggle />
          </div>
        </div>

        {p.fundRows.length > 0 && (
          <div className="card tight">
            <div className="card-head"><h2>My funds</h2></div>
            <div className="scroll"><table className="tbl wide">
              <thead><tr><th>Fund</th><th className="num">Units</th><th className="num">Avg price</th><th className="num">Unit price</th><th className="num">Value</th><th className="num">Gain / loss</th></tr></thead>
              <tbody>{p.fundRows.map(r => { const sym = r.fund.currency === 'USD' ? '$' : '₦'; return (
                <tr key={r.fundId} className="click" onClick={() => nav('/app/funds/' + r.fundId)}>
                  <td><div className="who"><Mono text={r.fund.name} size={34} /><div><strong>{r.fund.name}</strong><span className="muted xs">{r.fund.type}</span></div></div></td>
                  <td className="num"><Mask>{r.units.toLocaleString('en-NG', { maximumFractionDigits: 2 })}</Mask></td><td className="num">{sym}{n2(r.avgCost)}</td><td className="num">{sym}{n2(r.fund.nav)}</td>
                  <td className="num"><Money v={r.value} /></td><td className={'num ' + (r.gain >= 0 ? 'up' : 'dn')}><Mask>{r.gain >= 0 ? '+' : '-'}{naira(Math.abs(r.gain))}</Mask></td>
                </tr>) })}</tbody>
            </table></div>
          </div>
        )}

        <div>
          <div className="row" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
            <h2 style={{ fontSize: 18 }}>Explore funds</h2>
            <label className="small muted">Sort by <select className="inp" style={{ height: 38, width: 'auto', display: 'inline-block', marginLeft: 6 }} value={sort} onChange={e => setSort(e.target.value)}><option value="ret">1-year return</option><option value="risk">Lowest risk</option><option value="min">Lowest minimum</option></select></label>
          </div>
          <div className="chips" style={{ marginBottom: 16 }}>{types.map(t => <button key={t} type="button" className={'chip' + (type === t ? ' on' : '')} onClick={() => setType(t)}>{t}</button>)}</div>
          <div className="cards wide">
            {list.map(f => { const sym = f.currency === 'USD' ? '$' : '₦'; return (
              <Link key={f.id} to={'/app/funds/' + f.id} className="fcard">
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}><Mono text={f.name} size={40} /><div><h3>{f.name}</h3><div className="muted xs">{f.manager}</div></div></div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><Pill>{f.type}</Pill>{f.currency === 'USD' && <Pill kind="info">Dollar</Pill>}{f.status !== 'Open' && <Pill kind="warn">{f.status}</Pill>}</div>
                <div className="metrics">
                  <div><div className="muted xs">{f.yield ? 'Yield a year' : '1-year return'}</div><div className="metric up">{pct(f.yield || f.ret.y1)}</div></div>
                  <div><div className="muted xs">Unit price</div><div className="metric" style={{ fontSize: 20, paddingTop: 4 }}>{sym}{n2(f.nav)}</div></div>
                </div>
                <RiskDots n={f.risk} />
                <div className="muted xs">From {sym}{f.minInitial.toLocaleString()} · Sell in {f.redemption} · Fee {f.fee}% a year</div>
              </Link>
            ) })}
          </div>
          {!list.length && <div className="card empty"><h3>No funds match</h3><p>Try another type or clear the search.</p></div>}
        </div>
        <div className="muted xs">Past performance is not a guide to future returns. Unit prices can fall as well as rise. Mutual funds are not bank deposits and are not guaranteed. Fund managers named here are placeholders until contracts are signed.</div>
      </div>
    </>
  )
}
