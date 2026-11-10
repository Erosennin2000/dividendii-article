// Small fetch client: base URL, bearer token, JSON, timeouts, idempotency keys, one silent token refresh, tidy errors.
import { CONFIG } from './config.js'

const TOKEN_KEY = 'vendii-session'
let tokens = null
try { tokens = JSON.parse(sessionStorage.getItem(TOKEN_KEY) || 'null') } catch (e) { tokens = null }

export function setTokens(t) { tokens = t; try { t ? sessionStorage.setItem(TOKEN_KEY, JSON.stringify(t)) : sessionStorage.removeItem(TOKEN_KEY) } catch (e) { /* private mode */ } }
export const getTokens = () => tokens
export const hasSession = () => !!(tokens && tokens.accessToken)

export class ApiError extends Error {
  constructor(status, code, message, fields) { super(message || 'Something went wrong'); this.name = 'ApiError'; this.status = status; this.code = code; this.fields = fields || null }
}

const rid = () => (globalThis.crypto && crypto.randomUUID ? crypto.randomUUID() : 'r-' + Math.random().toString(36).slice(2) + Date.now().toString(36))
const signedOutEvent = () => { try { window.dispatchEvent(new CustomEvent('vendii:signed-out')) } catch (e) { /* ssr */ } }

function url(path, params = {}, query) {
  const used = new Set()
  const p = path.replace(/:([A-Za-z]+)/g, (_, k) => { used.add(k); return encodeURIComponent(params[k] ?? '') })
  const qs = new URLSearchParams()
  Object.entries(query || {}).forEach(([k, v]) => { if (v !== undefined && v !== null && v !== '') qs.set(k, v) })
  const q = qs.toString()
  return { href: CONFIG.baseUrl + p + (q ? '?' + q : ''), used }
}

let refreshing = null
async function refresh() {
  if (!tokens?.refreshToken) return false
  if (!refreshing) {
    refreshing = fetch(CONFIG.baseUrl + '/auth/refresh', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refreshToken: tokens.refreshToken }) })
      .then(async r => { if (!r.ok) return false; const j = await r.json(); const d = CONFIG.envelope && j.data ? j.data : j; setTokens({ ...tokens, ...d }); return true })
      .catch(() => false).finally(() => { refreshing = null })
  }
  return refreshing
}

export async function request(method, path, { params, query, body, auth = true, idempotencyKey, retried = false } = {}) {
  const { href } = url(path, params, query)
  const headers = { Accept: 'application/json', 'X-Request-Id': rid() }
  if (body !== undefined && method !== 'GET') headers['Content-Type'] = 'application/json'
  if (auth && tokens?.accessToken) headers.Authorization = 'Bearer ' + tokens.accessToken
  if (method !== 'GET' && method !== 'HEAD') headers['Idempotency-Key'] = idempotencyKey || rid()
  const attempts = method === 'GET' ? 3 : 1
  let lastErr
  for (let i = 0; i < attempts; i++) {
    const ctl = new AbortController(); const timer = setTimeout(() => ctl.abort(), CONFIG.timeoutMs)
    try {
      const res = await fetch(href, { method, headers, body: body !== undefined && method !== 'GET' ? JSON.stringify(body) : undefined, signal: ctl.signal, credentials: 'include' })
      clearTimeout(timer)
      if (res.status === 401 && auth && !retried && (await refresh())) return request(method, path, { params, query, body, auth, idempotencyKey: headers['Idempotency-Key'], retried: true })
      if (res.status === 401 && auth) { setTokens(null); signedOutEvent() }
      const text = await res.text()
      let json = null; try { json = text ? JSON.parse(text) : null } catch (e) { json = null }
      if (!res.ok) {
        const er = (json && (json.error || json)) || {}
        throw new ApiError(res.status, er.code || 'http_' + res.status, er.message || res.statusText, er.fields)
      }
      return CONFIG.envelope && json && typeof json === 'object' && 'data' in json ? { data: json.data, sync: json.sync, meta: json.meta } : { data: json, sync: json && json.sync }
    } catch (e) {
      clearTimeout(timer)
      lastErr = e instanceof ApiError ? e : new ApiError(0, e.name === 'AbortError' ? 'timeout' : 'network', e.name === 'AbortError' ? 'The server took too long to answer.' : 'Could not reach the server. Check your connection.')
      if (lastErr.status !== 0 || i === attempts - 1) throw lastErr
      await new Promise(r => setTimeout(r, 400 * (i + 1)))
    }
  }
  throw lastErr
}
