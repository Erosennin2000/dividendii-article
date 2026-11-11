// Client for the Dividendii article API (PHP + MySQL on the web host). Same origin, so no keys or secrets in the browser.
let csrf = ''
export const setCsrf = (t) => { csrf = t || '' }

async function req(method, path, { body, form } = {}) {
  const opts = { method, credentials: 'same-origin', headers: {} }
  if (form) opts.body = form
  else if (body !== undefined) { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body) }
  if (method !== 'GET') opts.headers['X-CSRF-Token'] = csrf
  let r
  try { r = await fetch('/api/v1' + path, opts) } catch { const e = new Error('Could not reach the server. Check your connection.'); e.status = 0; e.fields = {}; throw e }
  let j = null
  try { j = await r.json() } catch { /* not JSON */ }
  if (!r.ok || !j) { const e = new Error(j?.error?.message || 'Something went wrong. Please try again.'); e.status = r.status; e.fields = j?.error?.fields || {}; throw e }
  return j
}

const qs = (o) => { const p = new URLSearchParams(); Object.entries(o).forEach(([k, v]) => { if (v) p.set(k, v) }); const s = p.toString(); return s ? '?' + s : '' }

export const publicApi = {
  list: (o = {}) => req('GET', '/articles' + qs(o)),
  categories: () => req('GET', '/categories'),
  get: (slug) => req('GET', '/articles/' + encodeURIComponent(slug)),
  request: (b) => req('POST', '/requests', { body: b }),
  hit: (path) => { try { fetch('/api/v1/hit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ path }), keepalive: true }).catch(() => {}) } catch { /* counting is optional */ } },
}
export const adminApi = {
  me: () => req('GET', '/admin/me'),
  login: (email, password) => req('POST', '/admin/login', { body: { email, password } }),
  logout: () => req('POST', '/admin/logout', { body: {} }),
  list: () => req('GET', '/admin/articles'),
  get: (id) => req('GET', '/admin/articles/' + id),
  create: (a) => req('POST', '/admin/articles', { body: a }),
  update: (id, a) => req('PUT', '/admin/articles/' + id, { body: a }),
  publish: (id) => req('POST', `/admin/articles/${id}/publish`, { body: {} }),
  unpublish: (id) => req('POST', `/admin/articles/${id}/unpublish`, { body: {} }),
  upload: (file) => { const f = new FormData(); f.append('image', file); return req('POST', '/admin/upload', { form: f }) },
  requests: () => req('GET', '/admin/requests'),
  setHandled: (id, handled) => req('POST', `/admin/requests/${id}/handled`, { body: { handled } }),
  stats: () => req('GET', '/admin/stats'),
  password: (current, next) => req('POST', '/admin/password', { body: { current, new: next } }),
}

export const fmtLong = (iso) => iso ? new Date(iso).toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }) : ''
export const slugify = (s) => String(s || '').replace(/&/g, ' and ').replace(/₦/g, ' naira ').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 120)
