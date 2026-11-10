import React from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Check } from './icons.jsx'

export const Back = ({ to, children = 'Back' }) => <Link to={to} className="crumb"><ArrowLeft size={16} /> {children}</Link>

// Round monogram used where a company logo would go.
const HUES = [210, 38, 160, 265, 12, 190, 330, 90]
export function Mono({ text = '?', size = 40, round = true }) {
  const h = HUES[[...text].reduce((a, c) => a + c.charCodeAt(0), 0) % HUES.length]
  return <span className="mono" style={{ width: size, height: size, fontSize: size * 0.34, borderRadius: round ? size : 10, background: `hsl(${h} 55% 92%)`, color: `hsl(${h} 50% 28%)` }} aria-hidden="true">{text.slice(0, 2).toUpperCase()}</span>
}

export function RiskDots({ n, max = 5, label = true }) {
  const names = ['', 'Very low risk', 'Low risk', 'Medium risk', 'High risk', 'Very high risk']
  return <span className="risk" title={names[n]}>{Array.from({ length: max }, (_, i) => <i key={i} className={i < n ? 'on' : ''} />)}{label && <span className="muted xs" style={{ marginLeft: 8 }}>{names[n]}</span>}</span>
}

export function Progress({ value, tone }) {
  return <div className="progress" role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin="0" aria-valuemax="100"><i style={{ width: Math.min(100, value) + '%', background: tone }} /></div>
}

const SPLIT = ['#17375A', '#295D8F', '#C59F56', '#7FA6CC', '#B9C5D4', '#9C7A36']
export function SplitBar({ parts, money }) {
  const total = parts.reduce((a, p) => a + p.value, 0) || 1
  return (
    <div>
      <div className="splitbar" role="img" aria-label={parts.map(p => `${p.label} ${Math.round(p.value / total * 100)}%`).join(', ')}>
        {parts.filter(p => p.value > 0).map((p, i) => <i key={p.label} style={{ width: (p.value / total * 100) + '%', background: SPLIT[i % SPLIT.length] }} />)}
      </div>
      <div className="splitleg">{parts.map((p, i) => <span key={p.label}><b style={{ background: SPLIT[i % SPLIT.length] }} />{p.label} <strong>{Math.round(p.value / total * 100)}%</strong>{money ? <span className="muted"> {money(p.value)}</span> : null}</span>)}</div>
    </div>
  )
}

// Horizontal milestone line. items: [{ label, date, state: 'done'|'now'|'next' }]
export function Milestones({ items }) {
  return (
    <ol className="miles">
      {items.map((m, i) => (
        <li key={i} className={m.state}>
          <span className="dotm">{m.state === 'done' ? <Check size={12} stroke={3} /> : i + 1}</span>
          <strong>{m.label}</strong><span className="muted xs">{m.date}</span>
        </li>
      ))}
    </ol>
  )
}

export function Notice({ kind = 'info', children, action }) {
  return <div className={'alert ' + kind + (action ? ' row' : '')} style={{ fontSize: 14 }}><span>{children}</span>{action}</div>
}
