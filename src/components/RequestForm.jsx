import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { publicApi } from '../api/articles.js'
import { SITE } from '../site.js'

const empty = { full_name: '', former_name: '', company: '', phone: '', email: '', state: '', website: '', consent: false }

// One form for both "check my dividends" and the investing waitlist. Saved by the Dividendii API; the owner is emailed.
export default function RequestForm({ kind = 'check', id = 'rf', submitLabel, onDark = false }) {
  const [f, setF] = useState(empty)
  const [fields, setFields] = useState({})
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const [done, setDone] = useState(false)
  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setFields(p => ({ ...p, [k]: undefined })) }
  const check = kind === 'check'
  async function submit(e) {
    e.preventDefault(); if (busy) return
    setBusy(true); setMsg('')
    try { await publicApi.request({ ...f, kind, interest: check ? '' : 'Investing' }); setDone(true) }
    catch (x) { setFields(x.fields || {}); setMsg(x.message) }
    finally { setBusy(false) }
  }
  const err = (k) => fields[k] ? <div className="ferr" role="alert" id={`${id}-${k}-e`}>{fields[k]}</div> : null
  const inp = (k, label, props = {}) => (
    <div><label className="lbl" htmlFor={`${id}-${k}`}>{label}</label>
      <input id={`${id}-${k}`} className="inp" value={f[k]} onChange={e => set(k, e.target.value)} aria-invalid={!!fields[k]} aria-describedby={fields[k] ? `${id}-${k}-e` : undefined} {...props} />{err(k)}</div>
  )
  if (done) return (
    <div className="alert good" role="status" style={{ marginTop: 8 }}>
      <strong>Thank you. We have your request.</strong>
      <div style={{ marginTop: 6 }}>{check ? `We will reply on WhatsApp ${SITE.reply}, ${SITE.hours.replace('9am to 5pm, ', '')} (9am to 5pm).` : 'We will message you on WhatsApp when investing opens.'}</div>
    </div>
  )
  return (
    <form onSubmit={submit} noValidate className={check ? '' : 'wlform'}>
      {inp('full_name', check ? 'Full name as it appeared on your shares' : 'Your full name', { autoComplete: 'name', placeholder: 'e.g. Adebayo Oluwaseun Ojo' })}
      {check && <div className="row2">{inp('former_name', 'Former or maiden name (optional)', { placeholder: 'if it was different' })}{inp('company', 'A company you remember (optional)', { placeholder: 'e.g. First Bank, Nestle' })}</div>}
      <div className="row2">{inp('phone', 'WhatsApp number', { type: 'tel', autoComplete: 'tel', placeholder: '0803 000 0000' })}{inp('email', 'Email', { type: 'email', autoComplete: 'email', placeholder: 'you@example.com' })}</div>
      {check && inp('state', 'State or city', { autoComplete: 'address-level1', placeholder: 'e.g. Lagos' })}
      <div style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true"><label>Leave this empty<input tabIndex={-1} autoComplete="off" value={f.website} onChange={e => set('website', e.target.value)} /></label></div>
      <label className="consent"><input type="checkbox" checked={f.consent} onChange={e => set('consent', e.target.checked)} aria-invalid={!!fields.consent} /> <span>I agree to the <Link to="/legal#privacy" target="_blank">privacy notice</Link>.</span></label>
      {err('consent')}
      {msg && !Object.keys(fields).length && <p className="alert bad" role="alert">{msg}</p>}
      <button className="btn btn-p btn-l" type="submit" disabled={busy}>{busy ? 'Sending…' : (submitLabel || (check ? 'Send my request' : 'Join the waitlist'))}</button>
      <p className="fine">{check ? <>We check the registrars by hand and reply {SITE.reply}. No BVN needed. Checking for someone who passed away? <Link to="/check?mode=family">Use the family check</Link></> : 'We will only contact you about Dividendii.'}</p>
    </form>
  )
}
