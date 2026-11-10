import React, { useState } from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Tabs, Pill, Field } from '../../components/ui.jsx'
import { NEWS_CATS } from '../../data/catalog.js'
import { fmtDate } from '../../utils.js'
import { STOCKS } from '../../data/mock.js'

export default function Content() {
  const { state, dispatch, toast } = useStore()
  const [tab, setTab] = useState('news')
  const [f, setF] = useState({ title: '', cat: NEWS_CATS[0], ticker: '', body: '' })
  const halted = state.settings.haltedTickers || []
  return (
    <>
      <TopBar title="News and halts" plain />
      <div className="content">
        <div className="card tight">
          <Tabs tabs={[{ value: 'news', label: 'News and corporate actions' }, { value: 'halts', label: `Trading halts (${halted.length})` }]} value={tab} onChange={setTab} />
          {tab === 'news' && <div style={{ padding: 20 }} className="grid g2">
            <div className="stack" style={{ gap: 10 }}>
              <h3 style={{ fontSize: 16 }}>Publish an item</h3>
              <Field label="Headline" id="nt"><input id="nt" className="inp" value={f.title} onChange={e => setF({ ...f, title: e.target.value })} /></Field>
              <div className="grid g2"><Field label="Category" id="nc"><select id="nc" className="inp" value={f.cat} onChange={e => setF({ ...f, cat: e.target.value })}>{NEWS_CATS.map(c => <option key={c}>{c}</option>)}</select></Field><Field label="Ticker (optional)" id="nk"><input id="nk" className="inp" value={f.ticker} onChange={e => setF({ ...f, ticker: e.target.value.toUpperCase() })} /></Field></div>
              <Field label="Details" id="nb"><textarea id="nb" className="inp" value={f.body} onChange={e => setF({ ...f, body: e.target.value })} /></Field>
              <button className="btn btn-p" type="button" onClick={() => { if (!f.title) { toast('Add a headline', 'bad'); return } dispatch({ type: 'NEWS_PUBLISH', item: { title: f.title, cat: f.cat, ticker: f.ticker || null, body: f.body } }); setF({ ...f, title: '', body: '' }); toast('Published', 'good') }}>Publish</button>
            </div>
            <div className="stack" style={{ gap: 8, maxHeight: 420, overflow: 'auto' }}>{state.news.slice(0, 30).map(n => <div className="rowline" key={n.id}><span><strong style={{ fontSize: 14 }}>{n.title}</strong><div className="muted xs">{n.cat} · {fmtDate(n.date)}</div></span><button className="linkbtn" type="button" onClick={() => dispatch({ type: 'NEWS_REMOVE', id: n.id })}>Remove</button></div>)}</div>
          </div>}
          {tab === 'halts' && <div className="scroll"><table className="tbl"><thead><tr><th>Stock</th><th className="num">Price</th><th>Trading</th><th></th></tr></thead><tbody>
            {STOCKS.map(s => { const h = halted.includes(s.ticker); return <tr key={s.ticker}><td><strong>{s.ticker}</strong><div className="muted xs">{s.name}</div></td><td className="num">₦{s.price}</td><td><Pill kind={h ? 'bad' : 'good'}>{h ? 'Halted' : 'Open'}</Pill></td><td><button className="btn btn-o btn-s" type="button" onClick={() => { dispatch({ type: 'HALT_TOGGLE', ticker: s.ticker }); toast(h ? 'Trading resumed' : 'Trading halted') }}>{h ? 'Resume' : 'Halt'}</button></td></tr> })}
          </tbody></table></div>}
        </div>
      </div>
    </>
  )
}
