import React, { useState } from 'react'
import { Link, useParams, useNavigate } from 'react-router-dom'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore, stockOf, priceOf, isHalted } from '../../store/store.jsx'
import { Pill, LiquidityPill, Tabs } from '../../components/ui.jsx'
import AreaChart from '../../components/AreaChart.jsx'
import { Money, Mask } from '../../components/Money.jsx'
import { Mono, Back, Notice } from '../../components/kit.jsx'
import { Star, Bell } from '../../components/icons.jsx'
import { useSeries } from '../../api/hooks.js'
import { RANGES } from '../../data/catalog.js'
import { naira, n2, n0, pct, fmtDate } from '../../utils.js'

const CAT_KIND = { 'Corporate action': 'gold', 'Board meeting': 'info', 'Results': 'good', 'Regulatory': 'warn', 'Market news': 'grey' }

export default function Stock() {
  const { ticker } = useParams()
  const { state, dispatch, toast } = useStore()
  const nav = useNavigate()
  const s = stockOf(ticker)
  const [range, setRange] = useState('6M')
  const [pctMode, setPctMode] = useState(false)
  const [tab, setTab] = useState('news')
  if (!s) return <><TopBar title="Not found" /><div className="content"><div className="card">No security called {ticker}. <Link to="/app/markets">Back to markets</Link></div></div></>

  const shock = state.settings.marketShock || 0
  const series = useSeries(s, range)
  const values = shock ? series.values.map(v => v * (1 - shock)) : series.values
  const last = priceOf(ticker, state.settings)
  const held = state.holdings.find(h => h.ticker === ticker)
  const halted = isHalted(ticker, state.settings)
  const paused = !state.settings.flags.trading
  const chg = s.price / s.prev - 1
  const watching = state.watchlist.includes(ticker)
  const news = state.news.filter(n => n.ticker === ticker).sort((a, b) => b.date.localeCompare(a.date))
  const mkt = state.news.filter(n => !n.ticker).slice(0, 3)
  const cost = held ? held.units * held.avgCost : 0, value = held ? held.units * last : 0, gain = value - cost
  const volume = Math.round(s.avgValue / s.price)
  const rangeChange = values.length ? values[values.length - 1] / values[0] - 1 : 0

  return (
    <>
      <TopBar search={<input className="search" type="search" defaultValue={s.name} aria-label="Search" onKeyDown={e => { if (e.key === 'Enter') nav('/app/markets?q=' + encodeURIComponent(e.target.value)) }} />} />
      <div className="content">
        <Back to="/app/markets">Equities</Back>
        <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
            <Mono text={s.ticker} size={52} />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}><h1 style={{ fontSize: 26 }}>{s.name}</h1></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 4 }}><span className="muted small">{s.ticker} · NGX</span><Pill>{s.sector}</Pill><LiquidityPill level={s.liquidity} />{s.bank && <Pill kind="info">Bank share</Pill>}{halted && <Pill kind="bad">Trading halted</Pill>}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <button className="btn btn-o btn-s" type="button" aria-pressed={watching} onClick={() => { dispatch({ type: 'WATCH_TOGGLE', ticker }); toast(watching ? 'Removed from your watchlist' : 'Added to your watchlist') }}><Star size={16} fill={watching ? 'currentColor' : 'none'} /> {watching ? 'Watching' : 'Add to watchlist'}</button>
            <button className="btn btn-o btn-s" type="button" onClick={() => toast('Price alert set for ₦' + n2(last * 1.05))}><Bell size={16} /> Price alert</button>
            {held && <Link to={`/app/trade/${ticker}?side=sell`} className="btn btn-p btn-s" style={{ background: '#17375A' }}>Sell</Link>}
            <Link to={`/app/trade/${ticker}?side=buy`} className="btn btn-p">{held ? 'Buy more' : 'Buy stock'}</Link>
          </div>
        </div>
        {halted && <Notice kind="bad">Trading in {ticker} is halted. Orders cannot be placed until it resumes.</Notice>}
        {paused && !halted && <Notice kind="warn">Trading is paused on Vendii right now. See the status page for details.</Notice>}

        {held && (
          <div className="grid g3">
            <div className="stat"><div className="lab">Current value</div><div className="val"><Money v={value} /></div><div className="sub"><span className={gain >= 0 ? 'up' : 'dn'}><Mask>{gain >= 0 ? '▲' : '▼'} {pct(Math.abs(gain / (cost || 1)) * 100, 2)}</Mask></span></div></div>
            <div className="stat"><div className="lab">Amount invested</div><div className="val"><Money v={cost} /></div><div className="sub"><Mask>{n0(held.units)} units at ₦{n2(held.avgCost)}</Mask></div></div>
            <div className="stat ink"><div className="lab">Total gain / loss</div><div className="val"><Mask>{gain >= 0 ? '+' : '-'}{naira(Math.abs(gain))}</Mask></div><div className="sub">Before dividends received</div></div>
          </div>
        )}

        <div className="grid g3" style={{ alignItems: 'start' }}>
          <div className="span2 stack">
            <div className="card">
              <div className="row" style={{ alignItems: 'flex-end', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontSize: 34, fontWeight: 700 }} className="num">₦{n2(last)}</div>
                  <div><span className={chg >= 0 ? 'up' : 'dn'} style={{ fontWeight: 600 }}>{chg >= 0 ? '▲' : '▼'} ₦{n2(Math.abs(s.price - s.prev))} ({pct(Math.abs(chg) * 100)})</span> <span className="muted small">today</span> · <span className={rangeChange >= 0 ? 'up' : 'dn'} style={{ fontSize: 13 }}>{rangeChange >= 0 ? '+' : ''}{pct(rangeChange * 100)} over {range}</span></div>
                </div>
                <div className="chips"><button type="button" className={'chip' + (!pctMode ? ' on' : '')} onClick={() => setPctMode(false)}>₦</button><button type="button" className={'chip' + (pctMode ? ' on' : '')} onClick={() => setPctMode(true)}>%</button></div>
              </div>
              <div style={{ marginTop: 12 }}><AreaChart values={values} labels={series.labels} pctMode={pctMode} ariaLabel={`${ticker} price, ${range}, sample data`} /></div>
              <div className="range" style={{ marginTop: 10 }}>{RANGES.map(r => <button key={r} type="button" className={range === r ? 'on' : ''} onClick={() => setRange(r)}>{r}</button>)}</div>
              {s.liquidity === 'Thin' && <div className="alert warn" style={{ marginTop: 16 }}>This stock traded on few days this month ({s.deals} deals today). Buying is easy; selling may take days or weeks. We start you on a limit order.</div>}
              {s.etf && <div className="alert info" style={{ marginTop: 16 }}>{s.about}</div>}
            </div>

            <div className="card tight">
              <Tabs tabs={[{ value: 'news', label: `News and corporate actions (${news.length})` }, { value: 'dividends', label: 'Dividends' }, { value: 'about', label: 'About' }]} value={tab} onChange={setTab} />
              <div style={{ padding: 20 }}>
                {tab === 'news' && (
                  <div className="stack" style={{ gap: 0 }}>
                    {news.map(n => (
                      <details key={n.id} style={{ borderBottom: '1px solid var(--soft)', padding: '12px 0' }}>
                        <summary style={{ cursor: 'pointer', listStyle: 'none', display: 'flex', gap: 10, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                          <Pill kind={CAT_KIND[n.cat] || 'grey'}>{n.cat}</Pill><span className="muted xs" style={{ paddingTop: 4 }}>{fmtDate(n.date)}</span>
                          <div style={{ flexBasis: '100%', fontWeight: 600, fontSize: 14 }}>{n.title}</div>
                        </summary>
                        <p className="muted small" style={{ marginTop: 8 }}>{n.body || 'Full notice available from the Nigerian Exchange.'} <span className="xs">Source: {n.by}</span></p>
                      </details>
                    ))}
                    {!news.length && <div className="muted small">No company notices yet.</div>}
                    {mkt.length > 0 && <div style={{ marginTop: 18 }}><div className="lbl">Market news</div>{mkt.map(n => <div className="rowline" key={n.id} style={{ marginTop: 6 }}><span>{n.title}</span><span className="muted xs" style={{ whiteSpace: 'nowrap' }}>{fmtDate(n.date)}</span></div>)}</div>}
                  </div>
                )}
                {tab === 'dividends' && (
                  <div className="scroll"><table className="tbl">
                    <thead><tr><th>Type</th><th className="num">Per unit</th><th>Qualification</th><th>Payment</th><th className="num">You'd get (after 10% WHT)</th></tr></thead>
                    <tbody>
                      {s.nextDiv && <tr><td>{s.nextDiv.type}</td><td className="num">₦{n2(s.nextDiv.amount)}</td><td>{fmtDate(s.nextDiv.qual)}</td><td>{fmtDate(s.nextDiv.pay)}</td><td className="num">{held ? <Money v={held.units * s.nextDiv.amount * 0.9} /> : <span className="muted">no holding</span>}</td></tr>}
                      {s.pastDivs.map(d => <tr key={d.type}><td>{d.type}</td><td className="num">₦{n2(d.amount)}</td><td>{fmtDate(d.qual)}</td><td>{fmtDate(d.pay)}</td><td className="num">{held ? <><Money v={held.units * d.amount * 0.9} /> <Pill kind="good">Paid</Pill></> : <span className="muted">no holding</span>}</td></tr>)}
                      {!s.nextDiv && !s.pastDivs.length && <tr><td colSpan="5" className="muted">No dividend history on file.</td></tr>}
                    </tbody></table>
                    <div className="muted xs" style={{ marginTop: 10 }}>Own the shares before the qualification date to receive the dividend.</div></div>
                )}
                {tab === 'about' && <div className="stack" style={{ gap: 10 }}><p>{s.about}</p><div className="muted small">Price history and company facts are sample data in this demo.</div></div>}
              </div>
            </div>
          </div>

          <div className="stack">
            <div className="card">
              <h2 style={{ fontSize: 17 }}>Stock breakdown</h2>
              <div style={{ marginTop: 8 }}>
                {[['Volume', n0(volume)], ['Market segment', s.etf ? 'ETF' : 'Equities (Main Board)'], ['52W high', '₦' + n2(s.high52)], ['52W low', '₦' + n2(s.low52)], ['P/E ratio', s.pe ? s.pe + 'x' : 'n/a'], ['Market cap', s.mcap], ['Dividend yield', pct(s.yld)], ['Bid / Ask', `₦${n2(s.bid)} / ₦${n2(s.ask)}`], ['Avg daily value', '₦' + (s.avgValue / 1e9 >= 1 ? (s.avgValue / 1e9).toFixed(1) + 'bn' : (s.avgValue / 1e6).toFixed(0) + 'm')], ['Deals today', n0(s.deals)], ['Next dividend', s.nextDiv ? `₦${n2(s.nextDiv.amount)} · ${fmtDate(s.nextDiv.qual)}` : 'None declared']].map(([k, v]) => <div className="kv" key={k} style={{ borderBottom: '1px solid var(--soft)', padding: '9px 0' }}><span className="muted">{k}</span><strong style={{ fontWeight: 600, textAlign: 'right' }}>{v}</strong></div>)}
              </div>
            </div>
            <div className="card">
              <h2 style={{ fontSize: 17 }}>Trade {ticker}</h2>
              <div className="small muted" style={{ marginTop: 4 }}>Settled cash available: <strong style={{ color: 'var(--ink)' }}><Money v={state.cash.settled} /></strong></div>
              <div style={{ display: 'flex', gap: 10, marginTop: 14 }}><Link to={`/app/trade/${ticker}?side=buy`} className="btn btn-p" style={{ flex: 1 }}>Buy</Link><Link to={`/app/trade/${ticker}?side=sell`} className={'btn btn-o' + (held ? '' : ' disabled')} style={{ flex: 1, opacity: held ? 1 : .5, pointerEvents: held ? 'auto' : 'none' }}>Sell</Link></div>
              <div className="muted xs" style={{ marginTop: 10 }}>Market or limit orders. You review fees and confirm with your PIN before anything is sent.</div>
              <Link to="/app/funding" className="small" style={{ display: 'inline-block', marginTop: 8 }}>Add money</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
