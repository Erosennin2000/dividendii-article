import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { publicApi, fmtLong } from '../../api/articles.js'
import ArticleCard from '../../components/ArticleCard.jsx'
import { usePageMeta } from '../../lib/pageMeta.js'

// The reading layout. `data` can also be passed in directly by the admin preview.
export function ArticleView({ a, related = [], preview = false }) {
  const nav = useNavigate()
  const body = useRef(null)
  const site = typeof window !== 'undefined' ? window.location.origin : ''
  usePageMeta({ title: preview ? undefined : (a.seo_title || a.title) + ' | Dividendii', description: a.seo_description || a.excerpt, canonical: site + '/learn/' + a.slug, image: a.featured_image ? (a.featured_image.startsWith('/') ? site + a.featured_image : a.featured_image) : undefined })
  const onBodyClick = (e) => { // keep internal links inside the app (no full reload)
    const el = e.target.closest && e.target.closest('a'); if (!el || preview) return
    const href = el.getAttribute('href') || ''
    if (href.startsWith('/') && !el.target && !e.metaKey && !e.ctrlKey) { e.preventDefault(); nav(href) }
    else if (href.startsWith('#')) { e.preventDefault(); document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth' }) }
  }
  const toc = a.toc || []
  return (
    <>
      <div className="wrap article-hero">
        <nav aria-label="Breadcrumb" className="crumbs"><Link to="/">Home</Link> <span aria-hidden="true">/</span> <Link to="/learn">Learn</Link>{a.category && <> <span aria-hidden="true">/</span> <Link to={'/learn?category=' + a.category_slug}>{a.category}</Link></>}</nav>
        <h1>{a.title}</h1>
        {a.excerpt && <p className="lede">{a.excerpt}</p>}
        <div className="art-meta byline"><span>By {a.author}</span><span aria-hidden="true">·</span><time dateTime={a.published_at || ''}>{a.published_at ? fmtLong(a.published_at) : 'Not published yet'}</time><span aria-hidden="true">·</span><span>{a.reading_minutes} min read</span></div>
      </div>
      {a.featured_image && <div className="wrap"><figure className="article-figure"><img src={a.featured_image} alt={a.featured_image_alt || ''} /></figure></div>}
      <div className="wrap article-layout">
        <article className="prose" ref={body} onClick={onBodyClick} dangerouslySetInnerHTML={{ __html: a.body_html }} />
        <aside className="article-aside">
          {toc.length >= 3 && <nav className="toc card" aria-label="Table of contents"><h2>In this article</h2><ol>{toc.map(t => <li key={t.id} className={t.level === 3 ? 'sub' : ''}><a href={'#' + t.id} onClick={e => { e.preventDefault(); document.getElementById(t.id)?.scrollIntoView({ behavior: 'smooth' }) }}>{t.text}</a></li>)}</ol></nav>}
          <div className="card more-learn"><h2>More ways to learn</h2>
            <Link to="/check"><strong>Check for unclaimed dividends</strong><span>Free search across the registrars</span></Link>
            <Link to="/learn#calendar"><strong>Dividend calendar</strong><span>Qualification and payment dates</span></Link>
            <Link to="/learn#bond"><strong>FGN Savings Bond calculator</strong><span>See what a bond pays you</span></Link>
            <Link to="/pricing"><strong>What it costs</strong><span>Every fee in plain naira</span></Link>
          </div>
        </aside>
      </div>
      {related.length > 0 && <section className="block alt"><div className="wrap"><div className="sechead"><h2>Keep reading</h2></div><div className="art-grid">{related.map(r => <ArticleCard key={r.id} a={r} />)}</div></div></section>}
      {!preview && <section className="block"><div className="wrap"><div className="card article-cta"><div><h2>Own Nigerian shares? Check what you may be owed.</h2><p className="muted">Many shareholders have dividends waiting at a registrar. The check is free and takes a minute.</p></div><Link className="btn btn-p btn-l" to="/check">Check my dividends</Link></div><p className="muted small" style={{ marginTop: 20, maxWidth: '48em' }}>This article is for education only and is not investment advice. The value of investments can go down as well as up.</p></div></section>}
    </>
  )
}

export default function Article() {
  const { slug } = useParams()
  const [s, setS] = useState({ loading: true })
  useEffect(() => {
    let live = true; setS({ loading: true }); window.scrollTo(0, 0)
    publicApi.get(slug).then(r => { if (live) setS({ a: r.data, related: r.related }) }).catch(e => { if (live) setS({ missing: e.status === 404, error: e.status !== 404 }) })
    return () => { live = false }
  }, [slug])
  usePageMeta(s.missing ? { title: 'Article not found | Dividendii', noindex: true } : {})
  if (s.loading) return <div className="wrap page-hero"><p className="muted">Loading…</p></div>
  if (s.missing || s.error) return <div className="wrap page-hero"><h1>{s.missing ? 'We couldn\'t find that article.' : 'This article is not loading right now.'}</h1><p>{s.missing ? 'It may have been moved or taken down.' : 'Please try again in a moment.'}</p><div style={{ marginTop: 24 }}><Link className="btn btn-p btn-l" to="/learn">Browse all articles</Link></div></div>
  return <ArticleView a={s.a} related={s.related} />
}
