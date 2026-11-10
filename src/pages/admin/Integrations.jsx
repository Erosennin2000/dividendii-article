import React, { useState } from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Pill, Field } from '../../components/ui.jsx'
import { INTEGRATIONS } from '../../data/catalog.js'
import { CONFIG, isLive } from '../../api/config.js'
import { api } from '../../api/index.js'
import { fmtDate } from '../../utils.js'

export default function Integrations() {
  const { state, dispatch, toast } = useStore()
  const [busy, setBusy] = useState('')
  const [open, setOpen] = useState(null)
  async function test(i) {
    setBusy(i.id)
    try { const r = await api.call('integrations.ping', { id: i.id }); const d = r?.data ?? r; dispatch({ type: 'INTEGRATION', id: i.id, patch: { health: d.ok ? 'ok' : 'down', checked: d.checked || new Date().toISOString(), latencyMs: d.latencyMs } }); toast(d.ok ? `${i.name} reachable` : `${i.name} did not answer`, d.ok ? 'good' : 'bad') }
    catch (e) { dispatch({ type: 'INTEGRATION', id: i.id, patch: { health: 'down', checked: new Date().toISOString() } }); toast(e.message || 'Connection failed', 'bad') }
    setBusy('')
  }
  return (
    <>
      <TopBar title="Integrations" plain />
      <div className="content">
        <div className="alert info" style={{ fontSize: 14 }}><strong>Where your API plugs in.</strong> The app is running in <strong>{CONFIG.mode}</strong> mode{CONFIG.mode === 'mock' ? ' on built-in sample data' : ` against ${CONFIG.baseUrl || 'the configured base URL'}`}. Set <code>VITE_API_MODE=live</code> and <code>VITE_API_BASE_URL</code> in <code>.env</code> to go live. To go live one module at a time, list them in <code>VITE_API_LIVE_OPS</code>. The full list of endpoints is in <code>docs/API_CONTRACT.md</code>.</div>
        <div className="stack" style={{ gap: 12 }}>
          {INTEGRATIONS.map(i => { const s = state.integrations.find(x => x.id === i.id) || {}; const live = i.ops.some(o => isLive(o)); return (
            <div key={i.id} className="card">
              <div className="row" style={{ alignItems: 'flex-start', gap: 16 }}>
                <div style={{ flex: 1 }}><div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}><h3 style={{ fontSize: 16 }}>{i.name}</h3>{i.core && <Pill kind="gold">Required</Pill>}<Pill kind={live ? 'good' : 'grey'}>{live ? 'Live' : 'Sample data'}</Pill>{s.health === 'ok' && <Pill kind="good">Reachable{s.latencyMs ? ` · ${s.latencyMs} ms` : ''}</Pill>}{s.health === 'down' && <Pill kind="bad">Not reachable</Pill>}</div>
                  <p className="muted small" style={{ marginTop: 4 }}>{i.purpose}</p><div className="muted xs" style={{ marginTop: 6 }}>Provider: {i.provider} · Uses {i.ops.join(', ')}{s.checked ? ` · checked ${fmtDate(s.checked)}` : ''}</div></div>
                <div style={{ display: 'flex', gap: 8 }}><button className="btn btn-o btn-s" type="button" onClick={() => setOpen(open === i.id ? null : i.id)}>Settings</button><button className="btn btn-p btn-s" type="button" disabled={busy === i.id} onClick={() => test(i)}>{busy === i.id ? 'Testing…' : 'Test connection'}</button></div>
              </div>
              {open === i.id && <div className="grid g2" style={{ marginTop: 14 }}>
                <Field label="Base URL (override for this provider)" id={'u' + i.id}><input id={'u' + i.id} className="inp" value={s.baseUrl || ''} placeholder="https://api.example.com" onChange={e => dispatch({ type: 'INTEGRATION', id: i.id, patch: { baseUrl: e.target.value } })} /></Field>
                <Field label="API key (last 4 shown; the full key lives on your server)" id={'k' + i.id}><input id={'k' + i.id} className="inp" value={s.keyLast4 || ''} maxLength={4} placeholder="••••" onChange={e => dispatch({ type: 'INTEGRATION', id: i.id, patch: { keyLast4: e.target.value } })} /></Field>
              </div>}
            </div>) })}
        </div>
      </div>
    </>
  )
}
