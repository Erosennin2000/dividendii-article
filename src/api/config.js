// API configuration. Everything is driven by environment variables so the same build can point at any back end.
//
//   VITE_API_MODE        'mock' (default) runs on built-in sample data. 'live' sends every operation to your API.
//   VITE_API_BASE_URL    e.g. https://api.vendii.ng/v1   (no trailing slash needed)
//   VITE_API_LIVE_OPS    optional, only in mock mode: comma list of operation groups to send live while the rest stay on
//                        sample data, e.g. "auth,market" to go live one module at a time.
//   VITE_API_TIMEOUT_MS  request timeout, default 20000
//   VITE_API_ENVELOPE    'off' if your API returns the bare payload instead of { "data": ... }
//   VITE_API_WS_URL      optional WebSocket for live prices, e.g. wss://api.vendii.ng/v1/market/stream
const env = (typeof import.meta !== 'undefined' && import.meta.env) || {}
const csv = (v) => String(v || '').split(',').map(s => s.trim()).filter(Boolean)

export const CONFIG = {
  mode: env.VITE_API_MODE === 'live' ? 'live' : 'mock',
  baseUrl: String(env.VITE_API_BASE_URL || '').replace(/\/$/, ''),
  liveOps: csv(env.VITE_API_LIVE_OPS),
  timeoutMs: Number(env.VITE_API_TIMEOUT_MS || 20000),
  envelope: env.VITE_API_ENVELOPE !== 'off',
  wsUrl: env.VITE_API_WS_URL || '',
}

// Should this operation go to the real API? 'orders.place' is live if mode is live, or if "orders.place" or "orders" is listed.
export const isLive = (op) => CONFIG.mode === 'live' || CONFIG.liveOps.includes(op) || CONFIG.liveOps.includes(String(op).split('.')[0])
export const anyLive = () => CONFIG.mode === 'live' || CONFIG.liveOps.length > 0
