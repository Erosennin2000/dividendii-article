import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, portfolio, upcomingDividends, activeLoan, loanMetrics, offerStats } from '../../store/store.jsx'
import { Pill, Tabs } from '../../components/ui.jsx'
import { Money, Mask, EyeToggle } from '../../components/Money.jsx'
import { SplitBar, Mono } from '../../components/kit.jsx'
import { Chart, Pie, Bond, Flag, Umbrella, Landmark, ArrowRight } from '../../components/icons.jsx'
import { naira, n2, pct, fmtDate, greeting, daysLeft } from '../../utils.js'
import { INDEX, STOCKS, BOND_WINDOW } from '../../data/mock.js'
import { LENDING_ENABLED } from '../../features.js'

export default function Dashboard() {
  const { state } = useStore()
  const nav = useNavigate()
  const [tab, setTab] = useState('all')
  const p = portfolio(state)
  const divs = upcomingDividends(state)
  const unclaimed = state.claims.filter(c => c.owner === 'u-1' && c.status !== 'Paid')
  const unclaimedTotal = unclaimed.reduce((s, c) => s + c.amount, 0)
  const paidRecovered = state.claims.filter(c => c.owner === 'u-1' && c.status === 'Paid').reduce((s, c) => s + c.amount, 0)
  const loan = activeLoan(state)
  const lm = LENDING_ENABLED && loan && loan.status === 'Active' ? loanMetrics(loan, state) : null
  const gainers = [...STOCKS].sort((a, b) => (b.price / b.prev) - (a.price / a.prev))
  const watch = state.watchlist.map(t => STOCKS.find(s => s.ticker === t)).filter(Boolean)
  const flags = state.settings.flags
  const openOffers = state.offers.filter(o => o.status === 'Open')
  const banner = flags.ipo ? (openOffers.find(o => o.kind === 'IPO') || openOffers[0]) : null
  const bst = banner ? offerStats(banner, state) : null
  const bondDays = daysLeft(BOND_WINDOW.closes)
  const myApps = state.offerApps.filter(a => a.owner === 'u-1' && a.status === 'Submitted').length

  const rows = [
    ...p.rows.map(r => ({ kind: 'equities', key: r.ticker, name: r.ticker, sub: r.stock.name, type: 'Share', units: r.units.toLocaleString(), cost: '₦' + n2(r.avgCost), price: '₦' + n2(r.price), value: r.value, ret: r.totalReturn * 100, to: '/app/stock/' + r.ticker, label: 'Trade' })),
    ...p.fundRows.map(r => ({ kind: 'funds', key: r.fundId, name: r.fund.name, sub: r.fund.type + ' fund', type: 'Fund', units: r.units.toLocaleString('en-NG', { maximumFractionDigits: 2 }), cost: (r.fund.currency === 'USD' ? '$' : '₦') + n2(r.avgCost), price: (r.fund.currency === 'USD' ? '$' : '₦') + n2(r.fund.nav), value: r.value, ret: (r.value / (r.cost || 1) - 1) * 100, to: '/app/funds/' + r.fundId, label: 'View' })),
    ...state.bonds.map(b => ({ kind: 'bonds', key: b.id, name: b.name, sub: `${b.tenor}-year · ${b.rate}% · matures ${fmtDate(b.matures)}`, type: 'Bond', units: b.units, cost: '₦1,000.00', price: '₦1,000.00', value: b.amount, ret: b.rate / 4, to: '/app/fixed-income', label: 'View' })),
  ]
  const shown = rows.filter(r => tab === 'all' || r.kind === tab)
  const shownTotal = shown.reduce((s, r) => s + r.value, 0)
  const alloc = [{ label: 'Shares', value: p.equity }, { label: 'Funds', value: p.fundsValue }, { label: 'Bonds', value: p.bondsValue }, { label: 'Cash', value: state.cash.settled + state.cash.unsettled }]

  return (
    <>
      <TopBar search={<input className="search" type="search" placeholder="Search a company, ticker or sector (try Dangote)" aria-label="Search" onKeyDown={e => { if (e.key === 'Enter') nav('/app/markets?q=' + encodeURIComponent(e.target.value)) }} />} />
      <div className="content">
        {lm && lm.band !== 'healthy' && (
          <div className="alert bad row" style={{ fontSize: 14 }}>
            <span><strong>Your share-backed loan needs attention.</strong> Pledged shares have fallen; the loan is now {pct(lm.ltv * 100)} of their value.</span>
            <Link to="/lend" className="btn btn-d btn-s">See what to do</Link>
          </div>
        )}
        <div className="pagehead">
          <div><h2>{greeting()}, {state.user.firstName}</h2><div className="sub">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div></div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}><EyeToggle /><Link className="btn btn-o" to="/app/funding">Add money</Link><Link className="btn btn-p" to="/app/equities">Invest</Link></div>
        </div>

        <div className="grid g3">
          <div className="card span2">
            <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <div>
                <div className="muted small">Total investments (NGN)</div>
                <div className="bigmoney"><Money v={p.invested} /></div>
                <div style={{ marginTop: 6 }}><span className={p.dayChange >= 0 ? 'up' : 'dn'} style={{ fontWeight: 600 }}><Mask>{p.dayChange >= 0 ? '+' : ''}{naira(p.dayChange)} ({pct(p.dayChange / (p.equity || 1) * 100)})</Mask></span> <span className="muted">today on your shares</span></div>
              </div>
              <div style={{ minWidth: 220 }}>
                <div className="kv"><span className="muted">Total return incl. dividends</span><span className={p.totalReturn >= 0 ? 'up' : 'dn'} style={{ fontWeight: 600 }}><Mask>{pct(p.totalReturn * 100)}</Mask></span></div>
                <div className="kv"><span className="muted">Dividends received, 2026</span><strong><Money v={p.divsAll} /></strong></div>
                <div className="kv"><span className="muted">Cash, ready to use</span><strong><Money v={state.cash.settled} /></strong></div>
              </div>
            </div>
            <div style={{ marginTop: 18 }}><SplitBar parts={alloc} /></div>
            <div className="muted xs" style={{ marginTop: 10 }}>Settling <Money v={state.cash.unsettled} /> lands {fmtDate(state.cash.unsettledDate)} · Reserved for open buys <Money v={p.reserved} /></div>
          </div>
          <div className="card ink">
            <div style={{ color: 'var(--gold)', fontWeight: 600, fontSize: 13 }}>Unclaimed dividends being recovered</div>
            <div className="bigmoney"><Money v={unclaimedTotal} /></div>
            <div className="muted" style={{ marginTop: 6, fontSize: 14 }}>{unclaimed.length} claims across {new Set(unclaimed.map(c => c.registrar)).size} registrars. <Money v={paidRecovered} /> already paid to your bank.</div>
            <div style={{ marginTop: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <Link className="btn btn-g" to="/app/dividends?tab=recovery">Track recovery</Link>
              <span className="xs muted">{Math.round(state.settings.recoveryFee * 100)}% fee, only when paid</span>
            </div>
          </div>
        </div>

        {banner && (
          <div className={'promo theme-' + (banner.theme || 'a')}>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <Pill kind="gold">{banner.kind} open now</Pill>
              <h2 style={{ marginTop: 10 }}>{banner.issuer}: {banner.kind === 'IPO' ? 'own a stake before it lists' : banner.kind.toLowerCase()}</h2>
              <p>{banner.summary.split('.')[0]}.</p>
              <div style={{ display: 'flex', gap: 10, marginTop: 16, flexWrap: 'wrap' }}><Link to={'/app/offers/' + banner.id} className="btn btn-g">Apply now <ArrowRight size={16} /></Link><Link to="/app/offers" className="btn" style={{ color: '#fff', border: '1px solid rgba(255,255,255,.4)' }}>All offers ({openOffers.length})</Link></div>
            </div>
            <div className="facts">
              <div><span>Minimum entry</span><strong>{naira(bst.minEntry)}</strong></div>
              <div><span>Unit price</span><strong>₦{n2(banner.unitPrice)}</strong></div>
              <div><span>Offer closes</span><strong>{fmtDate(banner.closes)} · {daysLeft(banner.closes)}d</strong></div>
              <div><span>Subscribed</span><strong>{Math.round(bst.pct)}%</strong></div>
            </div>
          </div>
        )}

        <div>
          <div className="row" style={{ marginBottom: 12 }}><h2 style={{ fontSize: 18 }}>Ways to grow your money</h2></div>
          <div className="tilegrid">
            <Link to="/app/equities" className="tile"><span className="ic"><Chart /></span><div><h3>Equities</h3><p>Buy and sell shares on the Nigerian Exchange.</p><div className="stat-line"><Money v={p.equity} /> in {p.rows.length} companies</div></div></Link>
            <Link to="/app/funds" className="tile"><span className="ic"><Pie /></span><div><h3>Mutual funds</h3><p>Professionally managed funds from ₦5,000.</p><div className="stat-line">{p.fundRows.length ? <><Money v={p.fundsValue} /> invested</> : 'Start from ₦5,000'}</div></div></Link>
            <Link to="/app/fixed-income" className="tile"><span className="ic"><Bond /></span><div><h3>Fixed income</h3><p>FGN Savings Bonds, paid every quarter, tax free.</p><div className="stat-line">{bondDays > 0 ? `${BOND_WINDOW.month} window closes in ${bondDays} days` : 'Next window opens soon'}</div></div></Link>
            <Link to="/app/offers" className="tile gold"><span className="ic"><Flag /></span><div><h3>Public offers {openOffers.length > 0 && <Pill kind="gold">{openOffers.length} open</Pill>}</h3><p>IPOs, rights issues and bond offers.</p><div className="stat-line">{myApps ? `${myApps} application${myApps > 1 ? 's' : ''} in progress` : 'Apply from your dashboard'}</div></div></Link>
            <Link to="/app/insurance" className="tile"><span className="ic"><Umbrella /></span><div><h3>Insurance</h3><p>Life, motor, health, travel and home cover.</p><div className="stat-line">Get a quote in 2 minutes</div></div></Link>
            <Link to="/app/trusts" className="tile soon"><span className="ic"><Landmark /></span><div><h3>Trusts and kids accounts <Pill>Soon</Pill></h3><p>Invest for your children, or set up a family trust.</p><div className="stat-line">Join the list</div></div></Link>
          </div>
        </div>

        <div className="grid g3">
          <div className="card tight span2">
            <div className="card-head"><h2>Your investments</h2><Link to="/app/orders?tab=statements" className="small">Download CSCS statement</Link></div>
            <Tabs tabs={[{ value: 'all', label: 'All' }, { value: 'equities', label: 'Shares' }, { value: 'funds', label: 'Funds' }, { value: 'bonds', label: 'Bonds' }]} value={tab} onChange={setTab} />
            <div className="scroll">
              <table className="tbl wide">
                <thead><tr><th>Name</th><th className="num">Units</th><th className="num">Avg cost</th><th className="num">Price</th><th className="num">Value</th><th className="num">Return</th><th></th></tr></thead>
                <tbody>
                  {shown.map(r => (
                    <tr key={r.kind + r.key} className="click" onClick={() => nav(r.to)}>
                      <td><div className="who"><Mono text={r.name} size={34} /><div><strong>{r.name}</strong><span className="muted xs">{r.sub}</span></div></div></td>
                      <td className="num"><Mask>{r.units}</Mask></td><td className="num">{r.cost}</td><td className="num">{r.price}</td><td className="num"><Money v={r.value} /></td>
                      <td className={'num ' + (r.ret >= 0 ? 'up' : 'dn')}><Mask>{r.ret >= 0 ? '+' : ''}{pct(r.ret)}</Mask></td>
                      <td><Link to={r.to} className="btn btn-o btn-s" onClick={e => e.stopPropagation()}>{r.label}</Link></td>
                    </tr>
                  ))}
                  {!shown.length && <tr><td colSpan="7" className="muted" style={{ textAlign: 'center', padding: 28 }}>Nothing here yet. <Link to="/app/markets">Explore equities</Link> or <Link to="/app/funds">mutual funds</Link>.</td></tr>}
                </tbody>
                {shown.length > 0 && <tfoot><tr><td colSpan="4" className="muted small" style={{ padding: '12px' }}>{shown.length} holdings</td><td className="num" style={{ fontWeight: 700, padding: 12 }}><Money v={shownTotal} /></td><td colSpan="2"></td></tr></tfoot>}
              </table>
            </div>
          </div>
          <div className="stack">
            <div className="card">
              <div className="row"><h2 style={{ fontSize: 17 }}>Dividends coming</h2><Link to="/app/dividends" className="small">All</Link></div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
                {divs.slice(0, 3).map(d => (
                  <div className="row" key={d.ticker + d.type} style={{ alignItems: 'flex-start' }}>
                    <div><strong>{d.ticker}</strong> {d.type.toLowerCase()} ₦{n2(d.amount)}/unit<div className="muted xs">Qualification {fmtDate(d.qual)} · Pays {fmtDate(d.pay)}</div></div>
                    <div className="num"><strong><Money v={d.net} /></strong><div className="muted xs">after 10% WHT</div></div>
                  </div>
                ))}
                {state.bonds[0] && <div className="row" style={{ alignItems: 'flex-start' }}><div><strong>FGN Savings Bond</strong> coupon<div className="muted xs">Pays {fmtDate(state.bonds[0].nextCoupon)}</div></div><div className="num"><strong><Money v={state.bonds[0].amount * state.bonds[0].rate / 100 / 4} /></strong><div className="muted xs">tax free</div></div></div>}
              </div>
            </div>
            <div className="card">
              <div className="row"><h2 style={{ fontSize: 17 }}>Watchlist</h2><Link to="/app/equities?tab=watch" className="small">Manage</Link></div>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10, fontSize: 14 }}>
                {watch.map(s => <div className="row" key={s.ticker}><Link to={'/app/stock/' + s.ticker}><strong>{s.ticker}</strong></Link><span className="num">₦{n2(s.price)} <span className={s.price >= s.prev ? 'up' : 'dn'}>{s.price >= s.prev ? '+' : ''}{pct((s.price / s.prev - 1) * 100)}</span></span></div>)}
                {!watch.length && <div className="muted small">Add companies from any stock page.</div>}
              </div>
            </div>
            {LENDING_ENABLED && loan && loan.status === 'Active' && (
              <div className="card">
                <div className="row"><h2 style={{ fontSize: 17 }}>Share-backed loan</h2>{lm.band === 'healthy' ? <Pill kind="good">Healthy</Pill> : <Pill kind="bad">Action needed</Pill>}</div>
                <div className="kv" style={{ marginTop: 8 }}><span className="muted">You still owe</span><strong><Money v={loan.outstanding} /></strong></div>
                <div className="kv"><span className="muted">Loan vs shares value</span><strong>{pct(lm.ltv * 100)}</strong></div>
                <Link to="/lend" className="small">Open loan</Link>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ padding: '16px 20px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 28, fontSize: 14 }}>
            <div><span className="muted xs">NGX All-Share</span><div style={{ fontWeight: 600 }} className="num">{INDEX.asi.toLocaleString('en-NG', { minimumFractionDigits: 2 })} <span className="up">+{INDEX.asiChg}%</span></div></div>
            <div><span className="muted xs">Banking index</span><div style={{ fontWeight: 600 }}>{INDEX.banking.toLocaleString('en-NG', { minimumFractionDigits: 2 })} <span className="up">+{INDEX.bankingChg}%</span></div></div>
            <div><span className="muted xs">Market cap</span><div style={{ fontWeight: 600 }}>{INDEX.mcap}</div></div>
            <div><span className="muted xs">Top gainer</span><div style={{ fontWeight: 600 }}>{gainers[0].ticker} <span className="up">+{pct((gainers[0].price / gainers[0].prev - 1) * 100)}</span></div></div>
            <div><span className="muted xs">Top loser</span><div style={{ fontWeight: 600 }}>{gainers[gainers.length - 1].ticker} <span className="dn">{pct((gainers[gainers.length - 1].price / gainers[gainers.length - 1].prev - 1) * 100)}</span></div></div>
            <div style={{ marginLeft: 'auto' }}><Link to="/app/markets">Explore all companies</Link></div>
          </div>
        </div>
      </div>
    </>
  )
}
