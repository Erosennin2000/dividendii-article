// One entry point for the whole front end: api.call('orders.place', {...}).
// In mock mode this runs on sample data. In live mode it calls your API using src/api/contract.js.
import { CONFIG, isLive, anyLive } from './config.js'
import { OPS, ACTION_OPS, bodyFor, paramsFor } from './contract.js'
import { request, setTokens, getTokens, hasSession, ApiError } from './http.js'
import { mockCall } from './mock.js'

export { CONFIG, isLive, anyLive, ApiError, hasSession, setTokens, getTokens, OPS, ACTION_OPS }

// Call an operation by name with a flat payload. Path params (id, ticker …) are taken from the payload.
export async function call(name, payload = {}) {
  const def = OPS[name]
  if (!def) throw new Error('Unknown API operation: ' + name)
  if (!isLive(name)) return mockCall(name, payload)
  const names = [...def.path.matchAll(/:([A-Za-z]+)/g)].map(m => m[1])
  const params = Object.fromEntries(names.map(n => [n, payload[n]]))
  const query = {}; (def.query || []).forEach(k => { if (payload[k] !== undefined) query[k] = payload[k] })
  const body = def.method === 'GET' || def.method === 'DELETE' ? undefined : Object.fromEntries(Object.entries(payload).filter(([k]) => !names.includes(k) && !(def.query || []).includes(k)))
  return request(def.method, def.path, { params, query, body, auth: !def.public, idempotencyKey: payload.clientId })
}

// Send a reducer action to the server (live mode only). Returns { data, sync }.
export async function send(name, action) {
  const def = OPS[name]
  const params = paramsFor(name, action)
  const body = def.method === 'GET' ? undefined : bodyFor(name, action)
  const clientId = action.order?.id || action.app?.id || action.tx?.id || action.req?.id || action.complaint?.id
  return request(def.method, def.path, { params, body, auth: !def.public, idempotencyKey: clientId })
}

export const api = { call, send, config: CONFIG, isLive, hasSession }
export default api
