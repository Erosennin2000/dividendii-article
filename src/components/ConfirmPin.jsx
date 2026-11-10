import React, { useState } from 'react'
import { Modal } from './ui.jsx'

// "Review and confirm with your PIN" step used by every money action.
// onConfirm(pin) may be async; if it throws, the message is shown and the modal stays open.
export default function ConfirmPin({ title, children, cta = 'Confirm', onConfirm, onClose, note }) {
  const [pin, setPin] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  async function go() {
    if (pin.length < 4) { setErr('Enter your 4-digit PIN'); return }
    setBusy(true); setErr('')
    try { await onConfirm(pin) } catch (e) { setErr(e.message || 'That did not go through. Nothing was charged.'); setBusy(false) }
  }
  return (
    <Modal title={title} onClose={busy ? () => {} : onClose}>
      <div style={{ marginTop: 8 }}>{children}</div>
      <div style={{ marginTop: 16 }}>
        <label className="lbl" htmlFor="cpin">Transaction PIN</label>
        <input id="cpin" className="inp" type="password" inputMode="numeric" maxLength="4" autoFocus value={pin} onChange={e => setPin(e.target.value.replace(/\D/g, ''))} onKeyDown={e => e.key === 'Enter' && go()} placeholder="••••" style={{ letterSpacing: '.3em', maxWidth: 160 }} />
      </div>
      {err && <div className="alert bad" style={{ marginTop: 10 }} role="alert">{err}</div>}
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        <button className="btn btn-o" type="button" onClick={onClose} disabled={busy}>Back</button>
        <button className="btn btn-p" type="button" onClick={go} disabled={busy}>{busy ? 'Working…' : cta}</button>
      </div>
      <div className="muted xs" style={{ marginTop: 10 }}>{note || 'Demo: any 4 digits work as the PIN.'}</div>
    </Modal>
  )
}
