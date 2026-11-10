// Mock back end. Used when VITE_API_MODE=mock (the default) for operations that are not simply local state changes:
// sign-in, chart history, health checks and file uploads. Writes (orders, funds, offers …) are applied by the store's
// reducer, which acts as the mock server's business logic, so they need nothing here.
import { seriesFor } from '../data/catalog.js'
import { STOCKS } from '../data/mock.js'

const wait = (ms = 220) => new Promise(r => setTimeout(r, ms))

export async function mockCall(name, payload = {}) {
  await wait()
  switch (name) {
    case 'auth.signup': return { data: { challengeId: 'mock-ch', channel: 'sms' } }
    case 'auth.login':
      if (!payload.identifier || String(payload.password || '').length < 4) throw Object.assign(new Error('Enter your email and a password of 4 or more characters.'), { status: 422, code: 'invalid_credentials' })
      return { data: { challengeId: 'mock-ch', channel: 'sms', maskedTo: '0803 ••• 0221' } }
    case 'auth.verify':
      if (String(payload.code || '').length < 6) throw Object.assign(new Error('Enter the 6-digit code.'), { status: 422, code: 'invalid_code' })
      return { data: { accessToken: 'mock-access', refreshToken: 'mock-refresh', expiresIn: 900, admin: !!payload.staff, role: payload.staff ? (payload.role || 'Super admin') : null } }
    case 'auth.refresh': return { data: { accessToken: 'mock-access', expiresIn: 900 } }
    case 'auth.logout': return { data: { ok: true } }
    case 'market.history': {
      const s = STOCKS.find(x => x.ticker === payload.ticker)
      return { data: s ? seriesFor(s.ticker, s.price, s.prev, payload.range || '1M', s.low52, s.high52) : { values: [], labels: [] } }
    }
    case 'integrations.ping': return { data: { ok: payload.id !== 'cscs' && payload.id !== 'broker', latencyMs: 80 + Math.round(Math.random() * 140), checked: new Date().toISOString(), mock: true } }
    case 'files.upload': return { data: { fileId: 'f_' + Math.random().toString(36).slice(2, 8), uploadUrl: null } }
    default: return { data: { ok: true } }
  }
}
