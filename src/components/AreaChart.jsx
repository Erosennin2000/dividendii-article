import React, { useEffect, useRef, useState } from 'react'

// Interactive price chart. Hover (or touch) shows the value and time at that point.
// values: numbers, labels: same length. pctMode shows change since the first point instead of the price.
export default function AreaChart({ values, labels, height = 260, pctMode = false, fmt = (v) => v.toFixed(2), prefix = '₦', ariaLabel = 'Price chart' }) {
  const box = useRef(null)
  const [w, setW] = useState(760)
  const [hover, setHover] = useState(null)
  useEffect(() => {
    if (!box.current || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.floor(e.contentRect.width))))
    ro.observe(box.current)
    return () => ro.disconnect()
  }, [])
  if (!values || values.length < 2) return <div className="muted small" style={{ padding: 20 }}>No price history yet.</div>
  const first = values[0], last = values[values.length - 1]
  const series = pctMode ? values.map(v => (v / first - 1) * 100) : values
  const min = Math.min(...series), max = Math.max(...series), span = (max - min) || 1
  const padL = 8, padR = 56, padT = 14, padB = 24
  const iw = w - padL - padR, ih = height - padT - padB
  const x = (i) => padL + (i / (series.length - 1)) * iw
  const y = (v) => padT + (1 - (v - min) / span) * ih
  const pts = series.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`)
  const up = last >= first
  const col = up ? '#1F7A4D' : '#B3261E'
  const ticks = [0, 0.33, 0.66, 1].map(f => min + span * f)
  const xl = [0, 0.25, 0.5, 0.75, 1].map(f => Math.round(f * (labels.length - 1)))
  function move(e) {
    const r = e.currentTarget.getBoundingClientRect()
    const cx = (e.touches ? e.touches[0].clientX : e.clientX) - r.left
    const i = Math.round(((cx - padL) / iw) * (series.length - 1))
    setHover(Math.max(0, Math.min(series.length - 1, i)))
  }
  const h = hover
  const fmtV = (v) => pctMode ? (v >= 0 ? '+' : '') + v.toFixed(2) + '%' : prefix + fmt(v)
  const id = 'g' + Math.abs(Math.round(first * 1000 + last * 10 + series.length))
  return (
    <div ref={box} style={{ position: 'relative', width: '100%' }}>
      <svg width={w} height={height} role="img" aria-label={ariaLabel} onMouseMove={move} onTouchMove={move} onMouseLeave={() => setHover(null)} onTouchEnd={() => setHover(null)} style={{ display: 'block', touchAction: 'pan-y' }}>
        <defs><linearGradient id={id} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor={col} stopOpacity=".22" /><stop offset="1" stopColor={col} stopOpacity="0" /></linearGradient></defs>
        {ticks.map((t, i) => (<g key={i}><line x1={padL} x2={w - padR} y1={y(t)} y2={y(t)} stroke="#EEF2F6" /><text x={w - padR + 8} y={y(t) + 4} fontSize="11" fill="#5B6B7F">{pctMode ? (t >= 0 ? '+' : '') + t.toFixed(1) + '%' : fmt(t)}</text></g>))}
        {pctMode && min < 0 && max > 0 && <line x1={padL} x2={w - padR} y1={y(0)} y2={y(0)} stroke="#C9D1DB" strokeDasharray="4 4" />}
        <polygon points={`${x(0)},${padT + ih} ${pts.join(' ')} ${x(series.length - 1)},${padT + ih}`} fill={`url(#${id})`} />
        <polyline points={pts.join(' ')} fill="none" stroke={col} strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round" />
        {xl.map((i, k) => <text key={k} x={x(i)} y={height - 6} fontSize="11" fill="#5B6B7F" textAnchor={k === 0 ? 'start' : k === xl.length - 1 ? 'end' : 'middle'}>{labels[i]}</text>)}
        {h !== null && (<g><line x1={x(h)} x2={x(h)} y1={padT} y2={padT + ih} stroke="#17375A" strokeOpacity=".35" strokeDasharray="3 3" /><circle cx={x(h)} cy={y(series[h])} r="4.5" fill="#fff" stroke={col} strokeWidth="2.2" /></g>)}
      </svg>
      {h !== null && (
        <div className="chart-tip" style={{ left: Math.min(Math.max(x(h) - 60, 4), w - 130), top: 4 }}>
          <strong>{fmtV(series[h])}</strong>{pctMode && <span className="muted"> · {prefix}{fmt(values[h])}</span>}<div className="muted xs">{labels[h]}</div>
        </div>
      )}
    </div>
  )
}
