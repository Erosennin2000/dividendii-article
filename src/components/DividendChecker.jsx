import React, { useEffect, useRef } from 'react'

function Guilloche() {
  const ref = useRef(null)
  useEffect(() => {
    const svg = ref.current; if (!svg) return
    function draw() {
      const box = svg.getBoundingClientRect(), W = Math.max(300, box.width), H = Math.max(300, box.height)
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
      let out = ''
      const ros = (cx, cy, R, r, d, turns, steps, color, op) => { let p = ''; for (let i = 0; i <= steps; i++) { const t = i / steps * Math.PI * 2 * turns; const x = cx + (R - r) * Math.cos(t) + d * Math.cos((R - r) / r * t), y = cy + (R - r) * Math.sin(t) - d * Math.sin((R - r) / r * t); p += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) } return `<path d="${p}" fill="none" stroke="${color}" stroke-width="0.6" opacity="${op}"/>` }
      const m = Math.min(W, H)
      out += ros(W / 2, H * .52, m * .34, m * .34 * .29, m * .21, 7, 1400, '#C59F56', .22)
      out += ros(W / 2, H * .52, m * .26, m * .26 * .39, m * .15, 5, 1000, '#295D8F', .10)
      for (let b = 0; b < 4; b++) { const amp = 3 + b * .6, per = 18 + b * 2, off = 10 + b * 1.6; let pt = '', pb = ''; for (let x = 0; x <= W; x += 2) { pt += (x ? 'L' : 'M') + x + ' ' + (off + amp * Math.sin(x / per * Math.PI * 2 + b)).toFixed(1); pb += (x ? 'L' : 'M') + x + ' ' + (H - off - amp * Math.sin(x / per * Math.PI * 2 + b)).toFixed(1) } out += `<path d="${pt}" fill="none" stroke="#C59F56" stroke-width="0.6" opacity=".55"/><path d="${pb}" fill="none" stroke="#C59F56" stroke-width="0.6" opacity=".55"/>` }
      svg.innerHTML = out
    }
    draw(); let t; const onR = () => { clearTimeout(t); t = setTimeout(draw, 150) }; window.addEventListener('resize', onR); return () => window.removeEventListener('resize', onR)
  }, [])
  return <svg ref={ref} className="guilloche" aria-hidden="true" />
}

export default function DividendChecker() {
  return (
    <div className="cert">
      <div className="cert-frame">
        <Guilloche />
        <div className="inner">
          <div className="cert-head"><div className="k">Dividend check</div><h2>Is there money in your name?</h2><p>Tell us the companies you hold shares in. We complete each registrar's form, send it for you with your signed permission, and follow up.</p></div>
          <ul className="fine" style={{ margin: '4px 0 16px', paddingLeft: 18, lineHeight: 1.7, textAlign: 'left', fontStyle: 'normal' }}>
            <li>About ten minutes. ₦150 per company plus VAT to send.</li>
            <li>You will need your BVN, bank account, a photo and your signature.</li>
            <li>We give you a first update within 24 hours.</li>
          </ul>
          <a className="btn btn-g btn-l" href="/check/pilot" style={{ width: '100%', textAlign: 'center' }}>Start my check</a>
          <p className="fine" style={{ marginTop: 10 }}>The registrar pays you directly. We never hold your money.</p>
        </div>
      </div>
    </div>
  )
}
