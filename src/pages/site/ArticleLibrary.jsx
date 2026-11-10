import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { publicApi } from '../../api/articles.js'
import ArticleCard from '../../components/ArticleCard.jsx'

// The article library shown at the top of /learn. If there is nothing published yet (or the article service is
// not reachable) it renders nothing, so the existing Learn page looks exactly as it did before.
export default function ArticleLibrary() {
  const [sp, setSp] = useSearchParams()
  const category = sp.get('category') || ''
  const urlQ = sp.get('q') || ''
  const [q, setQ] = useState(urlQ)
  const [cats, setCats] = useState([])
  const [state, setState] = useState({ loading: true, items: [], total: 0, error: false })
  const [everything, setEverything] = useState(null) // total published, ignoring filters

  useEffect(() => { publicApi.categories().then(r => setCats(r.data)).catch(() => {}) }, [])
  useEffect(() => { publicApi.list().then(r => setEverything(r.meta.total)).catch(() => setEverything(0)) }, [])
  useEffect(() => { const t = setTimeout(() => { if (q !== urlQ) { const n = new URLSearchParams(sp); q ? n.set('q', q) : n.delete('q'); setSp(n, { replace: true }) } }, 300); return () => clearTimeout(t) }, [q])
  useEffect(() => {
    let live = true
    setState(s => ({ ...s, loading: true }))
    publicApi.list({ q: urlQ, category }).then(r => { if (live) setState({ loading: false, items: r.data, total: r.meta.total, error: false }) }).catch(() => { if (live) setState({ loading: false, items: [], total: 0, error: true }) })
    return () => { live = false }
  }, [urlQ, category])

  if (everything === null || everything === 0) return null
  const pick = (slug) => { const n = new URLSearchParams(sp); slug ? n.set('category', slug) : n.delete('category'); setSp(n, { replace: true }) }
  return (
    <section className="block" id="articles"><div className="wrap">
      <div className="sechead"><h2>Learn how shares and dividends work</h2><p>Plain-English articles on owning shares, dividends and the Nigerian market. No jargon, no hype.</p></div>
      <div className="lib-tools">
        <div className="lib-search"><label className="sr" htmlFor="art-q">Search articles</label><input id="art-q" className="inp" type="search" placeholder="Search articles, e.g. dividend" value={q} onChange={e => setQ(e.target.value)} /></div>
      </div>
      {cats.length > 1 && <div className="lib-chips" role="group" aria-label="Filter by category" style={{ marginTop: 14 }}>
        <button type="button" className={'lib-chip' + (!category ? ' on' : '')} aria-pressed={!category} onClick={() => pick('')}>All</button>
        {cats.map(c => <button type="button" key={c.slug} className={'lib-chip' + (category === c.slug ? ' on' : '')} aria-pressed={category === c.slug} onClick={() => pick(c.slug)}>{c.name} <span style={{ opacity: .7 }}>({c.count})</span></button>)}
      </div>}
      <div aria-live="polite">
        {state.items.length > 0 && <div className="art-grid">{state.items.map(a => <ArticleCard key={a.id} a={a} />)}</div>}
        {!state.loading && state.items.length === 0 && <div className="card" style={{ marginTop: 32 }}><strong>No articles match that search.</strong><p className="muted" style={{ marginTop: 6 }}>Try a different word, or <button type="button" className="linkbtn" onClick={() => { setQ(''); setSp({}, { replace: true }) }}>clear the filters</button>.</p></div>}
      </div>
    </div></section>
  )
}
