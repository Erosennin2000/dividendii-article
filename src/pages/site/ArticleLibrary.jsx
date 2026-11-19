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
  const page = Math.max(1, parseInt(sp.get('page') || '1', 10) || 1)
  const [q, setQ] = useState(urlQ)
  const [cats, setCats] = useState([])
  const [state, setState] = useState({ loading: true, items: [], total: 0, perPage: 12, error: false })
  const [everything, setEverything] = useState(null) // total published, ignoring filters

  useEffect(() => { publicApi.categories().then(r => setCats(r.data)).catch(() => {}) }, [])
  useEffect(() => { publicApi.list().then(r => setEverything(r.meta.total)).catch(() => setEverything(0)) }, [])
  useEffect(() => { const t = setTimeout(() => { if (q !== urlQ) { const n = new URLSearchParams(sp); q ? n.set('q', q) : n.delete('q'); n.delete('page'); setSp(n, { replace: true }) } }, 300); return () => clearTimeout(t) }, [q])
  useEffect(() => {
    let live = true
    setState(s => ({ ...s, loading: true }))
    publicApi.list({ q: urlQ, category, page: page > 1 ? page : '' }).then(r => { if (live) setState({ loading: false, items: r.data, total: r.meta.total, perPage: r.meta.per_page || 12, error: false }) }).catch(() => { if (live) setState({ loading: false, items: [], total: 0, perPage: 12, error: true }) })
    return () => { live = false }
  }, [urlQ, category, page])

  if (everything === null || everything === 0) return null
  const pick = (slug) => { const n = new URLSearchParams(sp); slug ? n.set('category', slug) : n.delete('category'); n.delete('page'); setSp(n, { replace: true }) }
  const pages = Math.max(1, Math.ceil(state.total / state.perPage))
  const goTo = (p) => {
    const n = new URLSearchParams(sp); p > 1 ? n.set('page', String(p)) : n.delete('page'); setSp(n)
    setTimeout(() => { const el = document.getElementById('articles'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }) }, 50)
  }
  // 1 … 4 5 6 … 20 style list, so a long library never makes a row of fifty buttons
  const nums = Array.from({ length: pages }, (_, i) => i + 1).filter(n => n === 1 || n === pages || Math.abs(n - page) <= 1)
  const withGaps = nums.reduce((acc, n, i) => { if (i && n - nums[i - 1] > 1) acc.push('gap' + n); acc.push(n); return acc }, [])
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
        {state.items.length > 0 && pages > 1 && (
          <nav className="lib-chips" aria-label="Article pages" style={{ marginTop: 28, justifyContent: 'center', alignItems: 'center' }}>
            <button type="button" className="lib-chip" disabled={page <= 1} onClick={() => goTo(page - 1)}>Previous</button>
            {withGaps.map(n => typeof n === 'string'
              ? <span key={n} aria-hidden="true" style={{ opacity: .6 }}>…</span>
              : <button type="button" key={n} className={'lib-chip' + (n === page ? ' on' : '')} aria-current={n === page ? 'page' : undefined} aria-label={'Page ' + n} onClick={() => goTo(n)}>{n}</button>)}
            <button type="button" className="lib-chip" disabled={page >= pages} onClick={() => goTo(page + 1)}>Next</button>
          </nav>
        )}
        {state.items.length > 0 && <p className="muted" style={{ textAlign: 'center', marginTop: 10, fontSize: 14 }}>Showing {(page - 1) * state.perPage + 1} to {(page - 1) * state.perPage + state.items.length} of {state.total} articles</p>}
        {!state.loading && state.items.length === 0 && page > 1 && state.total > 0 && <div className="card" style={{ marginTop: 32 }}><strong>That page is past the last article.</strong> <button type="button" className="linkbtn" onClick={() => goTo(1)}>Back to page 1</button></div>}
        {!state.loading && state.items.length === 0 && !(page > 1 && state.total > 0) && <div className="card" style={{ marginTop: 32 }}><strong>No articles match that search.</strong><p className="muted" style={{ marginTop: 6 }}>Try a different word, or <button type="button" className="linkbtn" onClick={() => { setQ(''); setSp({}, { replace: true }) }}>clear the filters</button>.</p></div>}
      </div>
    </div></section>
  )
}
