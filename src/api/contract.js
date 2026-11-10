// THE API CONTRACT.
//
// Every operation the Vendii front end performs is listed here once: HTTP method, path, who may call it,
// what it sends and what it expects back. The front end, the mock mode and the generated docs (docs/API_CONTRACT.md)
// all read this file, so it cannot drift from the code.
//
// To connect your back end:
//   1. Set VITE_API_MODE=live and VITE_API_BASE_URL in .env (see .env.example).
//   2. Make each endpoint below return the response shown. If your paths differ, change them here, nothing else.
//   3. Writes should return { data, sync }. `data` is the thing created or changed. `sync` lists every other record
//      the operation changed (for example the new cash balance after an order), keyed by slice name. The screens merge
//      `sync` into what they show, so the server stays the single source of truth for money and status.
//
// Conventions
//   - JSON everywhere. Money is a number in naira (or the fund's currency), never a string. Dates are ISO 8601.
//   - Every write carries an `Idempotency-Key` header. Replaying a key must not repeat the action.
//   - Success: 200/201 with { "data": ..., "sync": ... }. Failure: 4xx/5xx with { "error": { "code", "message", "fields" } }.
//   - `fields` on a 422 maps input names to messages and is shown next to the matching input.
//   - Auth is Bearer JWT. 401 triggers one silent POST /auth/refresh, then sign-out.
//   - `area: 'customer'` operations act on the signed-in customer only. `area: 'admin'` operations require a staff role.

const ORDER = { id: 'VND-26-004830', clientId: 'c-8F2K1A', ts: '2026-10-11T10:42:00Z', side: 'Buy', ticker: 'ZENITHBANK', units: 2000, filled: 0, type: 'Limit', limit: 48.5, status: 'Received', validity: 'Day', owner: 'u-1', timeline: [['Received', '2026-10-11T10:42:00Z']] }
const CASH = { settled: 115000, unsettled: 48500, unsettledDate: '2026-10-14', sweep: false }

export const OPS = {}
const op = (name, method, path, area, summary, extra = {}) => { OPS[name] = { name, method, path, area, summary, ...extra } }

// ------------------------------------------------------------------ session
op('auth.signup', 'POST', '/auth/signup', 'public', 'Create a customer account (step 1 of onboarding). BVN and NIN checks run behind it.', {
  public: true, request: { name: 'Damilola Ojo', email: 'damilola@example.com', phone: '08030000221', password: '••••••••', bvn: '22212345678', nin: '12345678901' }, response: { challengeId: 'ch_9d1', channel: 'sms' } })
op('auth.login', 'POST', '/auth/login', 'public', 'Check email/phone and password, send a one-time code. Staff pass staff:true.', {
  public: true, request: { identifier: 'damilola@example.com', password: '••••••••', staff: false }, response: { challengeId: 'ch_9d1', channel: 'sms', maskedTo: '0803 ••• 0221' } })
op('auth.verify', 'POST', '/auth/verify', 'public', 'Exchange the one-time code for tokens. Staff responses include role.', {
  public: true, request: { challengeId: 'ch_9d1', code: '123456' }, response: { accessToken: 'eyJ…', refreshToken: 'rt_…', expiresIn: 900, admin: false, role: null, user: { id: 'u-1', name: 'Damilola Ojo', email: 'damilola@example.com' } } })
op('auth.refresh', 'POST', '/auth/refresh', 'public', 'Swap a refresh token for a new access token.', { public: true, request: { refreshToken: 'rt_…' }, response: { accessToken: 'eyJ…', expiresIn: 900 } })
op('auth.logout', 'POST', '/auth/logout', 'customer', 'Revoke the refresh token.', { request: {}, response: { ok: true } })
op('session.bootstrap', 'GET', '/me/bootstrap', 'customer', 'Everything the customer apps need on load, in one call. Each key is a slice of app state; shapes are in the sections below.', {
  response: { user: '{ id, name, firstName, email, phone, bvnLast, chn, tier, kyc, bank:{name,last4,accountName}, beneficiary, virtualAccount:{bank,number}, security, risk }', holdings: '[{ ticker, units, avgCost }]', bonds: '[…]', cash: CASH, orders: '[Order]', paidDividends: '[…]', claims: '[Claim]', mandates: '[…]', loans: '[Loan]', funds: '[Fund]', fundHoldings: '[{ fundId, units, avgCost }]', offers: '[Offer]', offerApps: '[OfferApplication]', serviceRequests: '[ServiceRequest]', transactions: '[Transaction]', notifications: '[…]', news: '[NewsItem]', watchlist: "['SEPLAT']", settings: '{ commission, secFee, ngxFee, cscsFee, stampDuty, vat, flags:{…}, haltedTickers:[…] } (public fee schedule and feature flags only)' } })
op('admin.bootstrap', 'GET', '/admin/bootstrap', 'admin', 'Everything the staff console needs on load, limited to what the staff role may see.', {
  response: { adminUsers: '[…]', orders: '[Order (all customers)]', claims: '[Claim]', loans: '[Loan]', amlFlags: '[…]', complaints: '[…]', serviceRequests: '[ServiceRequest]', transactions: '[Transaction]', offers: '[Offer]', offerApps: '[OfferApplication]', funds: '[Fund]', staff: '[Staff]', integrations: '[Integration]', settings: '{ full settings }', audit: '[…]', news: '[NewsItem]' } })

// ------------------------------------------------------------------ market data
op('market.stocks', 'GET', '/market/stocks', 'customer', 'All listed securities with today\'s price. Poll every 15 s while the market is open, or use the WebSocket in VITE_API_WS_URL.', {
  response: [{ ticker: 'ZENITHBANK', name: 'Zenith Bank Plc', sector: 'Banking', price: 48.5, prev: 47.8, bid: 48.4, ask: 48.55, volume: 1240000, deals: 1240, avgValue: 1.9e9, pe: 4.8, yld: 9.3, mcap: '₦1.52tn', low52: 31.2, high52: 50.1, liquidity: 'High', etf: false, bank: true, about: '…', nextDiv: { type: 'Interim 2026', amount: 1.25, qual: '2026-10-20', pay: '2026-11-07' }, pastDivs: [] }] })
op('market.stock', 'GET', '/market/stocks/:ticker', 'customer', 'One security.', { response: 'Stock' })
op('market.history', 'GET', '/market/stocks/:ticker/history', 'customer', 'Price series for the chart. range is one of 1D 1W 1M 3M 6M 1Y 5Y.', {
  query: ['range'], response: { values: [48.2, 48.4, 48.5], labels: ['10:00', '10:30', '11:00'] } })
op('market.indices', 'GET', '/market/indices', 'customer', 'Headline indices.', { response: { asi: 165412.08, asiChg: 0.6, banking: 1842.11, bankingChg: 1.1, mcap: '₦104.2tn' } })
op('market.news', 'GET', '/market/news', 'customer', 'Corporate actions, board meetings, results and market news. Filter by ticker.', {
  query: ['ticker', 'category'], response: [{ id: 'nw-1', ticker: 'ZENITHBANK', cat: 'Corporate action', title: '…', date: '2026-10-09', body: '…', by: 'NGX filing' }] })

// ------------------------------------------------------------------ trading
op('orders.place', 'POST', '/orders', 'customer', 'Place a buy or sell order. The server re-checks cash or units, the price band and trading halts, then reserves cash.', {
  action: 'PLACE_ORDER', body: (a) => ({ clientId: a.order.id, side: a.order.side, ticker: a.order.ticker, units: a.order.units, type: a.order.type, limit: a.order.limit, validity: a.order.validity, pin: a.pin }),
  request: { clientId: 'c-8F2K1A', side: 'Buy', ticker: 'ZENITHBANK', units: 2000, type: 'Limit', limit: 48.5, validity: 'Day', pin: '1234' }, response: { data: ORDER, sync: { cash: CASH } },
  errors: ['422 insufficient_cash', '422 outside_price_band', '423 trading_halted', '403 bad_pin'] })
op('orders.cancel', 'POST', '/orders/:id/cancel', 'customer', 'Cancel the open part of an order.', { action: 'CANCEL_ORDER', request: {}, response: { data: { ...ORDER, status: 'Cancelled' } } })

// ------------------------------------------------------------------ money
op('funding.deposit', 'POST', '/funding/deposits', 'customer', 'Customers fund by bank transfer to their virtual account; the payment provider\'s webhook credits cash. This endpoint records an intent or a confirmed transfer.', {
  action: 'DEPOSIT', request: { amount: 500000, method: 'transfer' }, response: { data: { id: 'TX-90420', status: 'Completed' }, sync: { cash: CASH } } })
op('funding.withdraw', 'POST', '/funding/withdrawals', 'customer', 'Withdraw to the customer\'s verified bank account. Above the approval limit the status is "Pending approval" and treasury must approve.', {
  action: 'WITHDRAW', body: (a) => ({ amount: a.amount, pin: a.pin }), request: { amount: 100000, pin: '1234' }, response: { data: { id: 'TX-90421', status: 'Completed' }, sync: { cash: CASH } }, errors: ['422 insufficient_cash', '403 bad_pin'] })
op('funding.sweep', 'PUT', '/funding/sweep', 'customer', 'Turn on or off sweeping idle cash into the money market fund.', { action: 'TOGGLE_SWEEP', request: { on: true }, response: { data: { sweep: true } } })
op('recurring.add', 'POST', '/recurring', 'customer', 'Create a recurring buy plan.', { action: 'ADD_RECURRING', body: (a) => a.plan, request: { ticker: 'STANBICETF30', amount: 50000, day: 28 }, response: { data: { id: 'rp-1' } } })
op('recurring.remove', 'DELETE', '/recurring/:id', 'customer', 'Remove a recurring plan.', { action: 'REMOVE_RECURRING', response: { data: { ok: true } } })
op('bonds.subscribe', 'POST', '/bonds/subscriptions', 'customer', 'Subscribe to the open FGN Savings Bond window.', { action: 'SUBSCRIBE_BOND', body: (a) => a.bond, request: { tenor: 3, units: 50, amount: 50000, pin: '1234' }, response: { data: { id: 'b-2' }, sync: { cash: CASH } } })

// ------------------------------------------------------------------ mutual funds
op('funds.subscribe', 'POST', '/funds/:fundId/subscriptions', 'customer', 'Buy units in a mutual fund at the next NAV. The server returns the units allotted.', {
  action: 'FUND_SUBSCRIBE', body: (a) => ({ fundId: a.fundId, amount: a.amount, pin: a.pin, clientId: a.tx?.id }), request: { fundId: 'mmf', amount: 100000, pin: '1234' },
  response: { data: { fundId: 'mmf', units: 844.4, nav: 118.42, status: 'Completed' }, sync: { cash: CASH, fundHoldings: [{ fundId: 'mmf', units: 2948.8, avgCost: 113.4 }] } }, errors: ['422 below_minimum', '422 insufficient_cash', '409 fund_suspended'] })
op('funds.redeem', 'POST', '/funds/:fundId/redemptions', 'customer', 'Sell units back to the fund. Proceeds settle after the fund\'s redemption cycle.', {
  action: 'FUND_REDEEM', body: (a) => ({ fundId: a.fundId, units: a.units, pin: a.pin }), request: { fundId: 'mmf', units: 100, pin: '1234' }, response: { data: { proceeds: 11842, settles: '2026-10-12' }, sync: { cash: CASH } } })

// ------------------------------------------------------------------ public offers
op('offers.apply', 'POST', '/offers/:offerId/applications', 'customer', 'Apply for units in an open public offer. The amount is held from cash until allotment.', {
  action: 'OFFER_APPLY', body: (a) => ({ offerId: a.app.offerId, units: a.app.units, pin: a.pin, clientId: a.app.id }), request: { offerId: 'off-1', units: 1000, pin: '1234' },
  response: { data: { id: 'APP-3402', offerId: 'off-1', units: 1000, amount: 480000, status: 'Submitted' }, sync: { cash: CASH } }, errors: ['422 below_minimum', '422 not_a_multiple', '409 offer_closed', '422 insufficient_cash'] })
op('offers.cancel', 'DELETE', '/offers/applications/:id', 'customer', 'Withdraw an application before the offer closes. The held amount returns to cash.', { action: 'OFFER_CANCEL', response: { data: { status: 'Cancelled' }, sync: { cash: CASH } } })

// ------------------------------------------------------------------ dividends, claims
op('claims.start', 'POST', '/claims', 'customer', 'Sign the power of attorney and submit recovery claims found by the dividend check.', { action: 'START_CLAIMS', body: (a) => ({ claims: a.claims }), request: { claims: [{ company: 'Nestle Nigeria', registrar: 'Meristem Registrars', years: '2014 to 2019', amount: 41200 }] }, response: { data: [{ id: 'CLM-0420', status: 'Submitted' }] } })
op('claims.upload', 'POST', '/claims/:id/documents', 'customer', 'Attach a document (for example an old share certificate) to a claim. Upload the file first with files.upload.', { action: 'UPLOAD_CLAIM_DOC', request: { fileId: 'f_81c' }, response: { data: { status: 'With registrar' } } })
op('mandates.submit', 'POST', '/mandates', 'customer', 'Submit an e-dividend mandate to a registrar.', { action: 'SUBMIT_MANDATE', body: (a) => ({ registrar: a.registrar }), request: { registrar: 'Meristem Registrars' }, response: { data: { status: 'Submitted' } } })

// ------------------------------------------------------------------ lending
op('loans.create', 'POST', '/loans', 'customer', 'Apply for a share-backed loan. The server re-prices the collateral and checks concentration limits.', {
  action: 'CREATE_LOAN', body: (a) => ({ amount: a.loan.amount, tenor: a.loan.tenor, plan: a.loan.plan, purpose: a.loan.purpose, collateral: a.loan.collateral }), request: { amount: 900000, tenor: 6, plan: 'Monthly', purpose: 'Personal', collateral: [{ ticker: 'MTNN', units: 3500 }] }, response: { data: { id: 'VBL-2026-00320', status: 'Pending approval' } } })
op('loans.repay', 'POST', '/loans/:id/repayments', 'customer', 'Repay part or all of a loan from cash or by bank transfer.', { action: 'REPAY', body: (a) => ({ amount: a.amount, fromCash: a.fromCash }), request: { amount: 100000, fromCash: true }, response: { data: { outstanding: 657311 }, sync: { cash: CASH } } })
op('loans.pledge', 'POST', '/loans/:id/collateral', 'customer', 'Pledge more shares to a loan.', { action: 'PLEDGE_MORE', body: (a) => a.item, request: { ticker: 'GTCO', units: 1000 }, response: { data: { ok: true } } })

// ------------------------------------------------------------------ account
op('profile.update', 'PATCH', '/me', 'customer', 'Update profile fields (name changes need a document, so go through requests.create).', { action: 'UPDATE_USER', body: (a) => a.patch, request: { risk: 'Balanced' }, response: { data: { ok: true } } })
op('security.update', 'PATCH', '/me/security', 'customer', 'Change security preferences (biometric, timeout, screenshots).', { action: 'SET_SECURITY', body: (a) => a.patch, request: { biometric: true }, response: { data: { ok: true } } })
op('watchlist.toggle', 'PUT', '/me/watchlist/:ticker', 'customer', 'Add or remove a security from the watchlist.', { action: 'WATCH_TOGGLE', request: { on: true }, response: { data: { ok: true } } })
op('notifications.read', 'POST', '/notifications/read', 'customer', 'Mark all notifications read.', { action: 'READ_NOTIFS', request: {}, response: { data: { ok: true } } })
op('requests.create', 'POST', '/requests', 'customer', 'Raise a service request (statement, bank change, share transfer, estate claim, insurance quote…). Types are in the Service hub.', {
  action: 'SR_CREATE', body: (a) => ({ type: a.req.type, subject: a.req.subject, detail: a.req.detail, fields: a.req.fields, pin: a.pin }), request: { type: 'bank', fields: { bank: 'Access Bank', acct: '0123456789' }, pin: '1234' }, response: { data: { id: 'SR-1060', status: 'Submitted', due: '2026-10-13' } } })
op('complaints.create', 'POST', '/complaints', 'customer', 'Log a complaint. Acknowledge within 1 working day.', { action: 'COMPLAINT', body: (a) => a.complaint, request: { subject: 'Order filled at a worse price', detail: '…' }, response: { data: { id: 'CMP-120', status: 'Open' } } })
op('interest.create', 'POST', '/interest', 'customer', 'Register interest in a product that is coming soon (trusts, kids accounts).', { action: 'INTEREST', body: (a) => ({ kind: a.kind }), request: { kind: 'trusts' }, response: { data: { ok: true } } })
op('files.upload', 'POST', '/files', 'customer', 'Request an upload URL for a document (KYC, claim certificate, loan agreement). PUT the file to uploadUrl, then pass fileId to the operation that needs it.', { request: { name: 'certificate.pdf', type: 'application/pdf', size: 240000 }, response: { fileId: 'f_81c', uploadUrl: 'https://…signed-url…' } })
op('kyc.submit', 'POST', '/me/kyc', 'customer', 'Submit onboarding details and the selfie.', { action: 'KYC_SUBMIT', request: { bvn: '22212345678', nin: '12345678901', selfieFileId: 'f_77a' }, response: { data: { kyc: 'Pending review' } } })

// ------------------------------------------------------------------ staff: operations
op('orders.advance', 'POST', '/admin/orders/:id/advance', 'admin', 'Order desk moves an order one step: Received → Sent to broker → On exchange → Filled → Settled. On Settled the server books cash and holdings.', { action: 'ADVANCE_ORDER', area: 'admin', permission: 'orders', request: {}, response: { data: { ...ORDER, status: 'Sent to broker' }, sync: { cash: CASH } } })
op('kyc.decide', 'POST', '/admin/users/:id/kyc', 'admin', 'Approve or reject a customer in the KYC queue.', { action: 'KYC', permission: 'users', body: (a) => ({ status: a.status }), request: { status: 'Verified' }, response: { data: { kyc: 'Verified', chn: 'pending' } } })
op('users.status', 'POST', '/admin/users/:id/status', 'admin', 'Suspend or reactivate a customer. Suspended customers cannot place orders or withdraw.', { action: 'USER_STATUS', permission: 'users', body: (a) => ({ status: a.status, reason: a.reason }), request: { status: 'Suspended', reason: 'Awaiting source of funds' }, response: { data: { status: 'Suspended' } } })
op('users.note', 'POST', '/admin/users/:id/notes', 'admin', 'Add an internal note to a customer record.', { action: 'USER_NOTE', permission: 'users', body: (a) => ({ text: a.text }), request: { text: 'Called customer, confirmed new number.' }, response: { data: { ok: true } } })
op('claims.advance', 'POST', '/admin/claims/:id/advance', 'admin', 'Move a recovery claim to its next stage.', { action: 'ADVANCE_CLAIM', permission: 'claims', request: {}, response: { data: { status: 'Identity check' } } })
op('flags.resolve', 'POST', '/admin/compliance/flags/:id', 'admin', 'Resolve or escalate an AML flag.', { action: 'RESOLVE_FLAG', permission: 'compliance', body: (a) => ({ status: a.status }), request: { status: 'Resolved' }, response: { data: { status: 'Resolved' } } })
op('complaints.status', 'POST', '/admin/complaints/:id', 'admin', 'Update a complaint\'s status.', { action: 'COMPLAINT_STATUS', permission: 'compliance', body: (a) => ({ status: a.status }), request: { status: 'Investigating' }, response: { data: { status: 'Investigating' } } })
op('requests.update', 'POST', '/admin/requests/:id', 'admin', 'Change a service request\'s status or assignee, optionally with a note.', { action: 'SR_STATUS', permission: 'requests', body: (a) => ({ status: a.status, assignee: a.assignee, note: a.note }), request: { status: 'Completed', note: 'Statement emailed.' }, response: { data: { status: 'Completed' } } })
op('requests.note', 'POST', '/admin/requests/:id/notes', 'admin', 'Add an internal note to a service request.', { action: 'SR_NOTE', permission: 'requests', body: (a) => ({ text: a.text }), request: { text: 'Waiting on certificate.' }, response: { data: { ok: true } } })

// ------------------------------------------------------------------ staff: lending
op('loans.approve', 'POST', '/admin/loans/:id/approve', 'admin', 'Approve a loan. The server places the CSCS lien and pays out to the customer\'s bank before returning.', { action: 'APPROVE_LOAN', permission: 'lending', request: {}, response: { data: { status: 'Active' } } })
op('loans.decline', 'POST', '/admin/loans/:id/decline', 'admin', 'Decline a loan application.', { action: 'DECLINE_LOAN', permission: 'lending', request: { reason: 'Concentration limit' }, response: { data: { status: 'Declined' } } })
op('loans.liquidate', 'POST', '/admin/loans/:id/liquidate', 'admin', 'Sell collateral to restore loan health after an uncured margin call.', { action: 'LIQUIDATE', permission: 'lending', body: (a) => ({ ticker: a.ticker, units: a.units }), request: { ticker: 'GTCO', units: 4000 }, response: { data: { proceeds: 160000, outstanding: 597311 } } })
op('advance.rate', 'PUT', '/admin/advance-rates/:ticker', 'admin', 'Change how much can be borrowed against a security (0 to 1).', { action: 'ADVANCE_RATE', permission: 'lending', body: (a) => ({ rate: a.rate }), request: { rate: 0.45 }, response: { data: { ticker: 'NAHCO', rate: 0.45 } } })

// ------------------------------------------------------------------ staff: products and content
op('offers.upsert', 'PUT', '/admin/offers/:id', 'admin', 'Create or edit a public offer.', { action: 'OFFER_UPSERT', permission: 'products', body: (a) => a.offer, request: { name: 'Orikun Refining Plc, Initial Public Offer', kind: 'IPO', unitPrice: 480, minUnits: 20, multiple: 10, opens: '2026-10-05', closes: '2026-10-30' }, response: { data: 'Offer' } })
op('offers.status', 'POST', '/admin/offers/:id/status', 'admin', 'Open or close an offer.', { action: 'OFFER_STATUS', permission: 'products', body: (a) => ({ status: a.status }), request: { status: 'Closed' }, response: { data: { status: 'Closed' } } })
op('offers.allot', 'POST', '/admin/offers/:id/allot', 'admin', 'Run allotment at a ratio between 0 and 1 (1 means everyone gets what they applied for). Refunds for unallotted units are credited to cash.', { action: 'OFFER_ALLOT', permission: 'products', body: (a) => ({ ratio: a.ratio }), request: { ratio: 0.8 }, response: { data: { applications: 312, allottedUnits: 1.2e8, refunded: 4200000 }, sync: { offerApps: '[…]' } } })
op('funds.upsert', 'PUT', '/admin/funds/:id', 'admin', 'Create or edit a mutual fund listing (fees, minimums, status).', { action: 'FUND_UPSERT', permission: 'products', body: (a) => a.fund, request: { name: 'Naira Money Market Fund', minInitial: 5000, status: 'Open' }, response: { data: 'Fund' } })
op('funds.nav', 'POST', '/admin/funds/:id/nav', 'admin', 'Publish the day\'s unit price (NAV).', { action: 'FUND_NAV', permission: 'products', body: (a) => ({ nav: a.nav }), request: { nav: 118.9 }, response: { data: { nav: 118.9 } } })
op('news.publish', 'POST', '/admin/news', 'admin', 'Publish a news item or corporate action. Appears on the stock page and, if flagged, as a customer alert.', { action: 'NEWS_PUBLISH', permission: 'content', body: (a) => a.item, request: { ticker: 'ZENITHBANK', cat: 'Corporate action', title: '…', body: '…' }, response: { data: { id: 'nw-90' } } })
op('news.remove', 'DELETE', '/admin/news/:id', 'admin', 'Remove a news item.', { action: 'NEWS_REMOVE', permission: 'content', response: { data: { ok: true } } })
op('halts.toggle', 'PUT', '/admin/halts/:ticker', 'admin', 'Halt or resume trading in one security on the platform (for example when the exchange suspends it).', { action: 'HALT_TOGGLE', permission: 'content', request: { halted: true }, response: { data: { halted: true } } })

// ------------------------------------------------------------------ staff: treasury and control
op('treasury.decide', 'POST', '/admin/treasury/:id/decision', 'admin', 'Approve or reject a pending payment. Approval needs a second person from the one who requested it (maker-checker).', { action: 'TX_DECISION', permission: 'treasury', body: (a) => ({ decision: a.decision, reason: a.reason }), request: { decision: 'Approve' }, response: { data: { status: 'Completed' } } })
op('settings.update', 'PATCH', '/admin/settings', 'admin', 'Change fee rates, loan thresholds and limits.', { action: 'SETTINGS', permission: 'settings', body: (a) => a.patch, request: { commission: 0.0135 }, response: { data: 'Settings' } })
op('flags.set', 'PUT', '/admin/flags/:key', 'admin', 'Pause or resume a product (trading, lending, recovery, offers, funds, insurance…).', { action: 'FLAG', permission: 'settings', body: (a) => ({ value: a.value }), request: { value: false }, response: { data: { key: 'trading', value: false } } })
op('staff.upsert', 'PUT', '/admin/staff/:id', 'admin', 'Invite a staff member or change their role.', { action: 'STAFF_UPSERT', permission: 'staff', body: (a) => a.staff, request: { name: 'Dayo Coker', email: 'dayo@vendii.ng', role: 'Credit' }, response: { data: 'Staff' } })
op('staff.status', 'POST', '/admin/staff/:id/status', 'admin', 'Activate or deactivate a staff account (also revokes their sessions).', { action: 'STAFF_STATUS', permission: 'staff', body: (a) => ({ status: a.status }), request: { status: 'Deactivated' }, response: { data: { status: 'Deactivated' } } })
op('integrations.update', 'PUT', '/admin/integrations/:id', 'admin', 'Save an integration\'s mode and endpoint. Secrets are stored server-side only; the browser never sees them.', { action: 'INTEGRATION', permission: 'integrations', body: (a) => a.patch, request: { mode: 'live', baseUrl: 'https://broker.example.com' }, response: { data: 'Integration' } })
op('integrations.ping', 'POST', '/admin/integrations/:id/ping', 'admin', 'Server-side health check of one integration.', { permission: 'integrations', request: {}, response: { data: { ok: true, latencyMs: 142, checked: '2026-10-11T10:00:00Z' } } })
op('reports.run', 'GET', '/admin/reports/:key', 'admin', 'Run a report (orders, customers, claims, loans, ledger, revenue). Returns rows for the on-screen table; CSV is built in the browser.', { permission: 'reports', query: ['from', 'to'], response: { columns: ['Date', 'Order', 'Customer'], rows: [['2026-10-11', 'VND-26-004830', 'Damilola Ojo']] } })
op('audit.list', 'GET', '/admin/audit', 'admin', 'Audit log, newest first. Page with cursor.', { permission: 'audit', query: ['cursor', 'actor'], response: [{ ts: '2026-10-11T10:43:00Z', actor: 'Order desk (A. Bello)', action: 'Sent order to broker', detail: 'VND-26-004812' }] })

// ------------------------------------------------------------------ helpers used by the store
export const ACTION_OPS = Object.fromEntries(Object.values(OPS).filter(o => o.action).map(o => [o.action, o.name]))

// Turn a reducer action into the JSON body for its operation.
export function bodyFor(opName, action) {
  const def = OPS[opName]
  if (def.body) return def.body(action)
  const { type, fromServer, ...rest } = action
  return rest
}
// Pull `:params` for the path from an action (id, fundId, ticker, key, offerId).
export function paramsFor(opName, action) {
  const def = OPS[opName]
  const names = [...def.path.matchAll(/:([A-Za-z]+)/g)].map(m => m[1])
  const src = { ...action, offerId: action.offerId || action.app?.offerId, id: action.id ?? action.offer?.id ?? action.fund?.id ?? action.staff?.id ?? action.item?.id, ticker: action.ticker ?? action.order?.ticker }
  return Object.fromEntries(names.map(n => [n, src[n]]))
}

// Keys used when merging server `sync` data into state.
export const SLICE_KEYS = { holdings: 'ticker', fundHoldings: 'fundId', mandates: 'registrar' }
