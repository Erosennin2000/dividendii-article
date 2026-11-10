import React from 'react'
import { Link } from 'react-router-dom'
import { Logo } from './ui.jsx'
import { fmtLong } from '../api/articles.js'

export default function ArticleCard({ a }) {
  return (
    <Link className="art-card" to={'/learn/' + a.slug}>
      <div className="art-thumb">{a.featured_image ? <img src={a.featured_image} alt={a.featured_image_alt || ''} loading="lazy" /> : <Logo size={44} />}</div>
      <div className="art-body">
        {a.category && <span className="pill info" style={{ alignSelf: 'flex-start' }}>{a.category}</span>}
        <h3>{a.title}</h3>
        <p className="muted" style={{ lineHeight: 1.6 }}>{a.excerpt}</p>
        <div className="art-meta" style={{ marginTop: 'auto' }}><span>{fmtLong(a.published_at)}</span><span aria-hidden="true">·</span><span>{a.reading_minutes} min read</span></div>
      </div>
    </Link>
  )
}
