// Sample catalogue data for the products added after the first build: mutual funds, public offers,
// insurance, news and corporate actions, service requests, treasury ledger, staff and integrations.
// Everything here is illustrative. In live mode the same shapes come from the API (see src/api/contract.js).
import { STOCKS } from './mock.js'

const DAY = 86400000
export const rel = (days) => new Date(Date.now() + days * DAY).toISOString()
export const relDate = (days) => rel(days).slice(0, 10)

// ---------- deterministic price series for charts ----------
function rng(seed) { let s = seed % 2147483647; if (s <= 0) s += 2147483646; return () => (s = (s * 16807) % 2147483647) / 2147483647 }
const hashStr = (str) => [...str].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7)

// Brownian bridge from `start` to `end` with n points. Same inputs always give the same line.
export function bridge(start, end, n, vol, seed) {
  const r = rng(seed + 11), out = [start]
  let drift = 0
  for (let i = 1; i < n - 1; i++) {
    const t = i / (n - 1)
    drift += (r() - 0.5) * vol
    out.push(Math.max(0.0001, (start + (end - start) * t) * (1 + drift * (1 - t))))
  }
  out.push(end)
  return out.map(v => Number(v.toFixed(v < 10 ? 3 : 2)))
}

export const RANGES = ['1D', '1W', '1M', '3M', '6M', '1Y', '5Y']
const RANGE_META = {
  '1D': { n: 28, vol: 0.004, unit: 'time' }, '1W': { n: 35, vol: 0.006, unit: 'day', span: 7 }, '1M': { n: 22, vol: 0.012, unit: 'day', span: 30 },
  '3M': { n: 40, vol: 0.016, unit: 'day', span: 90 }, '6M': { n: 52, vol: 0.02, unit: 'day', span: 182 }, '1Y': { n: 52, vol: 0.026, unit: 'day', span: 365 }, '5Y': { n: 60, vol: 0.05, unit: 'month', span: 1825 },
}
// Returns { values, labels } for a stock or fund at the given range, ending at `price`.
export function seriesFor(key, price, prev, range, low52, high52) {
  const m = RANGE_META[range] || RANGE_META['1M']
  const seed = hashStr(key + range)
  const lo = low52 || price * 0.7, hi = high52 || price * 1.1
  const startAt = { '1D': prev || price, '1W': price * (1 - 0.012 + ((seed % 7) - 3) * 0.004), '1M': price * (1 - 0.03 + ((seed % 9) - 4) * 0.012), '3M': price * (1 - 0.07 + ((seed % 11) - 5) * 0.02),
    '6M': lo + (price - lo) * 0.25, '1Y': lo + (price - lo) * 0.05, '5Y': Math.max(price * 0.25, lo * 0.4) }[range]
  const values = bridge(startAt, price, m.n, m.vol, seed)
  const now = Date.now(), labels = values.map((_, i) => {
    const f = (values.length - 1 - i) / (values.length - 1)
    if (m.unit === 'time') { const d = new Date(now); d.setHours(10 + Math.round((1 - f) * 4.5), Math.round((1 - f) * 270) % 60, 0, 0); return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) }
    return new Date(now - f * m.span * DAY).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: m.span > 300 ? '2-digit' : undefined })
  })
  return { values, labels }
}

// ---------- mutual funds ----------
const nav = (base, growth, seed, n = 90) => bridge(base * (1 - growth), base, n, 0.004, seed)
export const FUNDS = [
  { id: 'mmf', name: 'Naira Money Market Fund', type: 'Money market', manager: '[Fund manager A]', risk: 1, yield: 18.2, nav: 118.42, ret: { m1: 1.5, m3: 4.4, y1: 18.1 }, minInitial: 5000, minTopUp: 1000, fee: 1.0, redemption: 'T+1', currency: 'NGN', status: 'Open', aum: '₦212bn',
    about: 'Lends your money short term to banks and the government. Steady, easy to withdraw, and the place most people park cash they may need soon.', mix: [['Treasury bills', 46], ['Bank placements', 34], ['Commercial paper', 15], ['Cash', 5]], history: nav(118.42, 0.18, 1) },
  { id: 'fif', name: 'Naira Fixed Income Fund', type: 'Fixed income', manager: '[Fund manager B]', risk: 2, yield: 19.6, nav: 224.1, ret: { m1: 1.7, m3: 5.0, y1: 19.9 }, minInitial: 10000, minTopUp: 5000, fee: 1.25, redemption: 'T+2', currency: 'NGN', status: 'Open', aum: '₦96bn',
    about: 'Holds government and corporate bonds. Pays more than a money market fund, but the unit price can dip when interest rates rise.', mix: [['FGN bonds', 58], ['Corporate bonds', 22], ['Treasury bills', 14], ['Cash', 6]], history: nav(224.1, 0.2, 2) },
  { id: 'bal', name: 'Balanced Growth Fund', type: 'Balanced', manager: '[Fund manager C]', risk: 3, yield: 0, nav: 163.88, ret: { m1: 2.2, m3: 6.1, y1: 24.1 }, minInitial: 10000, minTopUp: 5000, fee: 1.5, redemption: 'T+3', currency: 'NGN', status: 'Open', aum: '₦41bn',
    about: 'A mix of shares and bonds in one fund. Grows more than fixed income over the years, with bumpier months along the way.', mix: [['Equities', 45], ['FGN bonds', 35], ['Treasury bills', 12], ['Cash', 8]], history: nav(163.88, 0.24, 3) },
  { id: 'eqf', name: 'Nigerian Equity Fund', type: 'Equity', manager: '[Fund manager D]', risk: 4, yield: 0, nav: 91.35, ret: { m1: 3.1, m3: 9.4, y1: 38.4 }, minInitial: 20000, minTopUp: 10000, fee: 2.0, redemption: 'T+3', currency: 'NGN', status: 'Open', aum: '₦27bn',
    about: 'Invests in a spread of NGX-listed companies, picked by a professional manager. Can fall sharply in a bad year; best held for five years or more.', mix: [['Banking', 34], ['Industrial goods', 22], ['Telecoms', 16], ['Oil and gas', 14], ['Other', 14]], history: nav(91.35, 0.38, 4) },
  { id: 'dif', name: 'Dividend Income Fund', type: 'Equity income', manager: '[Fund manager D]', risk: 3, yield: 9.4, nav: 58.2, ret: { m1: 1.9, m3: 5.2, y1: 27.0 }, minInitial: 10000, minTopUp: 5000, fee: 1.75, redemption: 'T+3', currency: 'NGN', status: 'Open', aum: '₦18bn',
    about: 'Focuses on companies with a long record of paying dividends, and passes the income on to you.', mix: [['Banking', 40], ['Consumer goods', 20], ['Telecoms', 20], ['Industrial goods', 15], ['Cash', 5]], history: nav(58.2, 0.27, 5) },
  { id: 'usd', name: 'Dollar Income Fund', type: 'Dollar', manager: '[Fund manager E]', risk: 2, yield: 6.1, nav: 10.84, ret: { m1: 0.5, m3: 1.5, y1: 6.3 }, minInitial: 100, minTopUp: 50, fee: 1.0, redemption: 'T+3', currency: 'USD', status: 'Open', aum: '$38m',
    about: 'Earns dollar interest from Eurobonds and dollar deposits. Priced in US dollars; you fund it in naira at the day\'s rate.', mix: [['Eurobonds', 62], ['Dollar deposits', 28], ['Cash', 10]], history: nav(10.84, 0.063, 6) },
  { id: 'eth', name: 'Ethical Fund (Sharia-compliant)', type: 'Ethical', manager: '[Fund manager F]', risk: 3, yield: 0, nav: 74.6, ret: { m1: 1.8, m3: 5.5, y1: 21.2 }, minInitial: 10000, minTopUp: 5000, fee: 1.5, redemption: 'T+3', currency: 'NGN', status: 'Suspended', aum: '₦9bn',
    about: 'Invests only in businesses and instruments that meet Sharia screening rules, reviewed by an independent advisory board.', mix: [['Sukuk', 40], ['Equities', 40], ['Cash', 20]], history: nav(74.6, 0.21, 7) },
]
export const FUND_TYPES = ['All', ...new Set(FUNDS.map(f => f.type))]
export const FUND_HOLDINGS = [
  { fundId: 'mmf', units: 2104.4, avgCost: 112.1 },
  { fundId: 'bal', units: 310.2, avgCost: 151.4 },
]

// ---------- public offers ----------
export const OFFERS = [
  { id: 'off-1', kind: 'IPO', name: 'Orikun Refining Plc, Initial Public Offer', issuer: 'Orikun Refining Plc', sector: 'Oil and gas', status: 'Open', unitPrice: 480, minUnits: 20, multiple: 10, opens: relDate(-6), closes: relDate(19), allotment: relDate(32), listing: relDate(40),
    sizeUnits: 250000000, baseSubscribed: 171000000, registrar: '[Registrar]', theme: 'a',
    summary: 'A new Nigerian refiner raising money to expand its processing capacity. You are buying shares in the company at the offer price, before they list on the exchange.',
    highlights: ['Offer price is fixed at ₦480 per share for everyone', 'Shares are credited to your CSCS account after allotment', 'Money you pay for shares you are not allotted comes back to you'],
    useOfProceeds: [['Expand refining capacity', 55], ['Repay existing loans', 25], ['Working capital', 15], ['Offer costs', 5]],
    risks: 'Refining margins move with oil prices and the exchange rate. Shares can fall below the offer price after listing. Read the prospectus before you apply.',
    docs: ['Prospectus (PDF)', 'Application form guide', 'Offer timetable'] },
  { id: 'off-2', kind: 'Rights issue', name: 'Harmattan Solar Plc, Rights Issue', issuer: 'Harmattan Solar Plc', sector: 'Industrial goods', status: 'Open', unitPrice: 12.5, minUnits: 100, multiple: 1, opens: relDate(-9), closes: relDate(7), allotment: relDate(18), listing: relDate(24),
    sizeUnits: 400000000, baseSubscribed: 322000000, registrar: '[Registrar]', theme: 'b', ratio: '1 new share for every 4 you hold',
    summary: 'Existing shareholders can buy new shares at a discount to the market price, in proportion to what they already own.',
    highlights: ['Only for people who held the shares on the qualification date', 'Priced below today\'s market price', 'You can also sell your right instead of using it'],
    useOfProceeds: [['New solar assembly plant', 70], ['Debt reduction', 20], ['Offer costs', 10]],
    risks: 'If the market price falls below ₦12.50 before allotment, taking up the rights could cost more than buying on the exchange.',
    docs: ['Rights circular (PDF)', 'Acceptance form guide'] },
  { id: 'off-3', kind: 'Public offer', name: 'Ajoke Foods Plc, Follow-on Offer', issuer: 'Ajoke Foods Plc', sector: 'Consumer goods', status: 'Upcoming', unitPrice: 38, minUnits: 500, multiple: 100, opens: relDate(9), closes: relDate(30), allotment: relDate(43), listing: relDate(50),
    sizeUnits: 120000000, baseSubscribed: 0, registrar: '[Registrar]', theme: 'c',
    summary: 'A listed food manufacturer is selling new shares to fund two new factories. Applications open soon.',
    highlights: ['Opens in a few days; you can set a reminder', 'Minimum 500 shares, in blocks of 100', 'Shares list on the same exchange as the existing ones'],
    useOfProceeds: [['Two new factories', 65], ['Raw material stock', 25], ['Offer costs', 10]], risks: 'Food input costs and the exchange rate can hurt margins.', docs: ['Prospectus (PDF)'] },
  { id: 'off-4', kind: 'Bond offer', name: 'FGN-guaranteed Infrastructure Bond, Series 4', issuer: 'InfraCo Nigeria', sector: 'Fixed income', status: 'Open', unitPrice: 1000, minUnits: 5, multiple: 1, opens: relDate(-3), closes: relDate(5), allotment: relDate(12), listing: relDate(16),
    sizeUnits: 150000000, baseSubscribed: 90000000, registrar: '[Registrar]', theme: 'b', coupon: 16.5, tenor: 7,
    summary: 'A seven-year bond guaranteed by the Federal Government. It pays a fixed 16.5% a year, every six months, and returns your ₦1,000 per unit at the end.',
    highlights: ['Fixed 16.5% a year, paid every six months', 'Guaranteed by the Federal Government', 'Coupons are tax free under current rules'],
    useOfProceeds: [['Roads and bridges', 60], ['Power transmission', 40]], risks: 'Your money is locked for seven years unless you sell on the bond market, where the price can be lower than ₦1,000.', docs: ['Pricing supplement (PDF)'] },
  { id: 'off-5', kind: 'IPO', name: 'Eko Telecom Plc, Initial Public Offer', issuer: 'Eko Telecom Plc', sector: 'Telecoms', status: 'Allotted', unitPrice: 20, minUnits: 500, multiple: 100, opens: relDate(-70), closes: relDate(-45), allotment: relDate(-30), listing: relDate(-22),
    sizeUnits: 300000000, baseSubscribed: 410000000, registrar: '[Registrar]', theme: 'a', ticker: 'EKOTEL',
    summary: 'Closed and allotted. The offer was oversubscribed, so each applicant received about 80% of the shares they applied for.',
    highlights: ['Oversubscribed by 37%', 'Allotment ratio 80%', 'Shares listed on the exchange'], useOfProceeds: [['Network rollout', 100]], risks: '', docs: ['Allotment announcement'] },
]
export const OFFER_APPS = [
  { id: 'APP-3301', offerId: 'off-5', owner: 'u-1', ownerName: 'Damilola Ojo', units: 2000, amount: 40000, status: 'Allotted', allottedUnits: 1600, refund: 8000, ts: rel(-60) },
  { id: 'APP-3340', offerId: 'off-4', owner: 'u-1', ownerName: 'Damilola Ojo', units: 20, amount: 20000, status: 'Submitted', ts: rel(-2) },
  { id: 'APP-3345', offerId: 'off-1', owner: 'u-2', ownerName: 'Fatima Abubakar', units: 2500, amount: 1200000, status: 'Submitted', ts: rel(-4) },
  { id: 'APP-3351', offerId: 'off-1', owner: 'u-4', ownerName: 'Bola Adeyemi', units: 10000, amount: 4800000, status: 'Submitted', ts: rel(-3) },
  { id: 'APP-3356', offerId: 'off-2', owner: 'u-3', ownerName: 'Chinedu Eze', units: 4000, amount: 50000, status: 'Submitted', ts: rel(-1) },
  { id: 'APP-3360', offerId: 'off-4', owner: 'u-6', ownerName: 'Grace Nwosu', units: 50, amount: 50000, status: 'Submitted', ts: rel(-1) },
]

// ---------- insurance ----------
export const INSURANCE = [
  { id: 'life', name: 'Life cover', from: 12000, per: 'year', blurb: 'A lump sum for your family if you die. Choose the amount of cover and how long you want it.', cover: ['Death benefit', 'Optional critical illness add-on', 'Premiums fixed for the term'], fields: [{ key: 'sum', label: 'Cover you want (₦)', type: 'number', ph: '10,000,000' }, { key: 'age', label: 'Your age', type: 'number', ph: '34' }] },
  { id: 'motor', name: 'Motor insurance', from: 15000, per: 'year', blurb: 'Third-party cover is the legal minimum. Comprehensive also pays for damage to your own car.', cover: ['Third party injury and damage', 'Own damage and theft (comprehensive)', 'Roadside assistance'], fields: [{ key: 'car', label: 'Make, model and year', type: 'text', ph: 'Toyota Camry 2018' }, { key: 'value', label: 'Car value (₦)', type: 'number', ph: '8,500,000' }, { key: 'plan', label: 'Cover type', type: 'select', options: ['Third party', 'Comprehensive'] }] },
  { id: 'health', name: 'Health plans', from: 45000, per: 'year', blurb: 'Pays hospital and clinic bills through a network of providers. Plans for one person or a family.', cover: ['Outpatient and inpatient care', 'Maternity (higher plans)', 'Emergency evacuation (top plan)'], fields: [{ key: 'people', label: 'Who needs cover', type: 'select', options: ['Just me', 'Me and my spouse', 'My family'] }, { key: 'city', label: 'City', type: 'text', ph: 'Lagos' }] },
  { id: 'travel', name: 'Travel insurance', from: 8000, per: 'trip', blurb: 'Medical emergencies, lost bags and cancelled flights while you are away. Meets most visa requirements.', cover: ['Emergency medical', 'Lost or delayed baggage', 'Trip cancellation'], fields: [{ key: 'where', label: 'Where are you going', type: 'text', ph: 'United Kingdom' }, { key: 'days', label: 'Number of days', type: 'number', ph: '14' }] },
  { id: 'home', name: 'Home and contents', from: 20000, per: 'year', blurb: 'Fire, flood, theft and burglary cover for your home and what is inside it.', cover: ['Building cover', 'Contents cover', 'Alternative accommodation'], fields: [{ key: 'val', label: 'Value of home and contents (₦)', type: 'number', ph: '25,000,000' }, { key: 'own', label: 'Do you own or rent', type: 'select', options: ['Own', 'Rent'] }] },
  { id: 'gadget', name: 'Phone and gadget cover', from: 6000, per: 'year', blurb: 'Repairs or replaces your phone, laptop or tablet after accidental damage or theft.', cover: ['Accidental damage', 'Theft with police report', 'Screen repair'], fields: [{ key: 'dev', label: 'Device and value (₦)', type: 'text', ph: 'iPhone 15, 900,000' }] },
]

// ---------- news and corporate actions ----------
const dstr = (d) => relDate(d)
function buildNews() {
  const items = []
  let n = 1
  const add = (ticker, cat, title, days, body) => items.push({ id: 'nw-' + n++, ticker, cat, title, date: dstr(days), body: body || '', by: 'NGX filing' })
  for (const s of STOCKS) {
    if (s.nextDiv) add(s.ticker, 'Corporate action', `${s.name}: ${s.nextDiv.type} dividend of ₦${s.nextDiv.amount.toFixed(2)} per share declared`, -((s.ticker.length % 5) + 1), `Qualification date ${s.nextDiv.qual}. Payment date ${s.nextDiv.pay}. Dividends are paid after 10% withholding tax.`)
    add(s.ticker, 'Board meeting', `${s.name}: notice of board meeting to consider results`, -((s.ticker.length % 7) + 3), 'The board will meet to approve the next set of results and consider any dividend. A closed period for insiders applies until results are released.')
  }
  add('ZENITHBANK', 'Results', 'Zenith Bank half-year profit rises, interim dividend proposed', -9, 'Profit before tax grew on higher interest income. The board proposed an interim dividend.')
  add('MTNN', 'Results', 'MTN Nigeria reports higher revenue on data growth', -14, 'Data and fintech revenue grew faster than voice. Cost pressure from the weaker naira continued.')
  add('SEPLAT', 'Corporate action', 'Seplat Energy announces Q3 dividend', -6, 'Interim dividend of ₦60 per share, payable after the qualification date.')
  add('NAHCO', 'Regulatory', 'NAHCO shares: exchange queries unusual trading activity', -4, 'The exchange asked the company to confirm whether it is aware of any information that could explain the trading in its shares.')
  add(null, 'Market news', 'NGX All-Share Index extends gains as banks lead', -1, 'Buying in banking shares lifted the index for a third session. Turnover rose on the day.')
  add(null, 'Market news', 'CBN holds rates; analysts see room for treasury yields to ease', -3, 'The central bank kept its policy rate unchanged. Yields on treasury bills moved lower at the latest auction.')
  add(null, 'Market news', 'DMO opens October FGN Savings Bond offer', -6, 'Two-year and three-year bonds are on offer. Applications close on Friday.')
  add(null, 'Regulatory', 'SEC reminds investors to deal only with registered brokers', -8, 'The Commission published a list of registered capital market operators and warned of unregistered investment schemes.')
  return items.sort((a, b) => b.date.localeCompare(a.date))
}
export const NEWS = buildNews()
export const NEWS_CATS = ['Corporate action', 'Board meeting', 'Results', 'Regulatory', 'Market news']

// ---------- service requests ----------
export const SERVICE_TYPES = [
  { key: 'statement', label: 'Statement of account', desc: 'A signed statement of your cash and trades for any period.', sla: 1, pin: false, fields: [{ key: 'from', label: 'From', type: 'date' }, { key: 'to', label: 'To', type: 'date' }, { key: 'purpose', label: 'What is it for', type: 'select', options: ['My records', 'Visa application', 'Bank or loan', 'Tax'] }] },
  { key: 'contract', label: 'Contract note copy', desc: 'A copy of the contract note for a trade you made.', sla: 1, pin: false, fields: [{ key: 'order', label: 'Order ID', type: 'text', ph: 'VND-26-004790' }] },
  { key: 'transfer', label: 'Move shares in from another broker', desc: 'Bring shares you hold with another stockbroker into your Vendii account at CSCS.', sla: 5, pin: true, fields: [{ key: 'broker', label: 'Current broker', type: 'text', ph: 'Name of the stockbroker' }, { key: 'chn', label: 'CHN at that broker', type: 'text', ph: '7 digits' }, { key: 'what', label: 'Which shares', type: 'textarea', ph: 'Company and number of units' }] },
  { key: 'bank', label: 'Change withdrawal bank account', desc: 'Pick a new bank account for withdrawals. We check the name matches yours.', sla: 1, pin: true, fields: [{ key: 'bank', label: 'Bank', type: 'text', ph: 'e.g. GTBank' }, { key: 'acct', label: 'Account number', type: 'text', ph: '10 digits' }] },
  { key: 'contact', label: 'Update phone or email', desc: 'Change the phone number or email on your account.', sla: 1, pin: true, fields: [{ key: 'which', label: 'What are you changing', type: 'select', options: ['Phone number', 'Email address'] }, { key: 'value', label: 'New value', type: 'text' }] },
  { key: 'mandate', label: 'E-dividend mandate', desc: 'Have dividends paid straight to your bank account by every registrar.', sla: 3, pin: false, fields: [{ key: 'registrar', label: 'Registrar (optional)', type: 'text', ph: 'Leave blank for all' }] },
  { key: 'estate', label: 'Report a death or claim an estate', desc: 'Start the process to claim shares of a late relative. A person will call you.', sla: 2, pin: false, fields: [{ key: 'name', label: 'Name of the deceased', type: 'text' }, { key: 'rel', label: 'Your relationship', type: 'text', ph: 'Son, daughter, spouse…' }] },
  { key: 'close', label: 'Close my account', desc: 'Withdraw everything and close the account. Shares are transferred out first.', sla: 5, pin: true, fields: [{ key: 'why', label: 'Why are you leaving (optional)', type: 'textarea' }] },
]
export const SR_STATUSES = ['Submitted', 'In review', 'Needs info', 'Completed', 'Rejected']
export const SERVICE_REQUESTS = [
  { id: 'SR-1031', owner: 'u-1', ownerName: 'Damilola Ojo', type: 'statement', subject: 'Statement of account', detail: 'From 2026-01-01 to 2026-09-30. Purpose: Visa application.', opened: rel(-12), due: relDate(-11), status: 'Completed', assignee: 'Support', notes: [] },
  { id: 'SR-1046', owner: 'u-1', ownerName: 'Damilola Ojo', type: 'bank', subject: 'Change withdrawal bank account', detail: 'New account: Access Bank 0123456789', opened: rel(-1), due: relDate(1), status: 'In review', assignee: 'Support', notes: [{ by: 'Support', ts: rel(-1), text: 'Name check against BVN passed. Waiting for cooling-off period.' }] },
  { id: 'SR-1049', owner: 'u-2', ownerName: 'Fatima Abubakar', type: 'transfer', subject: 'Move shares in from another broker', detail: 'Broker: [Other broker]. CHN 1845023. 40,000 FIRSTHOLDCO.', opened: rel(-3), due: relDate(2), status: 'In review', assignee: 'Claims', notes: [] },
  { id: 'SR-1050', owner: 'u-6', ownerName: 'Grace Nwosu', type: 'contact', subject: 'Update phone or email', detail: 'New phone number 0803 555 0101.', opened: rel(-1), due: relDate(1), status: 'Submitted', assignee: null, notes: [] },
  { id: 'SR-1052', owner: 'u-5', ownerName: 'Estate of Samuel Okoro', type: 'estate', subject: 'Report a death or claim an estate', detail: 'Name of deceased: Samuel Okoro. Relationship: Son.', opened: rel(-5), due: relDate(-3), status: 'Needs info', assignee: 'Claims', notes: [{ by: 'Claims', ts: rel(-4), text: 'Asked for letters of administration.' }] },
  { id: 'SR-1055', owner: 'u-3', ownerName: 'Chinedu Eze', type: 'insurance', subject: 'Motor insurance quote', detail: 'Toyota Camry 2018, ₦8,500,000, Comprehensive.', opened: rel(0), due: relDate(1), status: 'Submitted', assignee: null, notes: [] },
]

// ---------- treasury ledger ----------
const tx = (id, days, owner, ownerName, type, dir, amount, status, ref, extra = {}) => ({ id, ts: rel(days), owner, ownerName, type, dir, amount, status, ref, ...extra })
export const TRANSACTIONS = [
  tx('TX-90412', -0.1, 'u-4', 'Bola Adeyemi', 'Withdrawal', 'out', 3500000, 'Pending approval', 'Access Bank ••2031', { needsApproval: true }),
  tx('TX-90411', -0.2, 'u-2', 'Fatima Abubakar', 'Deposit', 'in', 800000, 'Completed', 'NIP from GTBank'),
  tx('TX-90410', -0.4, 'u-6', 'Grace Nwosu', 'Withdrawal', 'out', 95000, 'Completed', 'Zenith ••7712'),
  tx('TX-90409', -0.5, 'u-1', 'Damilola Ojo', 'Trade settlement', 'out', 73215, 'Completed', 'VND-26-004790 GTCO buy'),
  tx('TX-90408', -1, 'u-3', 'Chinedu Eze', 'Deposit', 'in', 250000, 'Pending', 'Unmatched transfer, name mismatch', { unmatched: true }),
  tx('TX-90407', -1, 'u-1', 'Damilola Ojo', 'Claim payout', 'in', 37080, 'Completed', 'CLM-0412 net of 10% fee'),
  tx('TX-90406', -2, 'u-2', 'Fatima Abubakar', 'Loan repayment', 'in', 196000, 'Completed', 'VBL-2026-00241 instalment'),
  tx('TX-90405', -2, 'u-4', 'Bola Adeyemi', 'Fund subscription', 'out', 1000000, 'Completed', 'Naira Money Market Fund'),
  tx('TX-90404', -3, 'u-3', 'Chinedu Eze', 'Loan disbursement', 'out', 600000, 'Completed', 'VBL-2026-00097'),
  tx('TX-90403', -3, 'u-10', 'Yemi Alade', 'Deposit', 'in', 55000, 'Completed', 'NIP from Kuda'),
  tx('TX-90402', -4, 'u-6', 'Grace Nwosu', 'Withdrawal', 'out', 60000, 'Failed', 'Bank returned: account closed', { failed: true }),
  tx('TX-90401', -5, 'u-2', 'Fatima Abubakar', 'Offer payment', 'out', 1200000, 'Completed', 'Orikun Refining IPO'),
  tx('TX-90400', -6, 'u-1', 'Damilola Ojo', 'Deposit', 'in', 300000, 'Completed', 'NIP from GTBank'),
]

// ---------- staff and permissions ----------
// Each role maps to the admin areas it may open. '*' means everything.
export const ROLES = {
  'Super admin': ['*'],
  'Order desk': ['overview', 'orders', 'users', 'content'],
  'Claims': ['overview', 'claims', 'users', 'requests'],
  'Credit': ['overview', 'lending', 'users'],
  'Compliance': ['overview', 'users', 'compliance', 'audit', 'reports', 'requests'],
  'Support': ['overview', 'users', 'requests', 'compliance'],
  'Treasury': ['overview', 'treasury', 'reports', 'users'],
  'Product': ['overview', 'products', 'content', 'settings', 'requests'],
}
export const AREAS = [['overview', 'Overview'], ['orders', 'Order desk'], ['users', 'Customers'], ['claims', 'Recovery claims'], ['lending', 'Loan book'], ['products', 'Products'], ['requests', 'Service requests'], ['treasury', 'Treasury'], ['content', 'News and halts'], ['compliance', 'Compliance'], ['reports', 'Reports'], ['settings', 'Fees and flags'], ['audit', 'Audit log'], ['staff', 'Staff and roles'], ['integrations', 'Integrations']]
export const can = (role, area) => { const p = ROLES[role] || []; return p.includes('*') || p.includes(area) }
export const STAFF = [
  { id: 's-1', name: 'Tomi Adeyinka', email: 'tomi@vendii.ng', role: 'Super admin', status: 'Active', last: rel(-0.02), twoFA: true },
  { id: 's-2', name: 'A. Bello', email: 'a.bello@vendii.ng', role: 'Order desk', status: 'Active', last: rel(-0.05), twoFA: true },
  { id: 's-3', name: 'K. Obi', email: 'k.obi@vendii.ng', role: 'Claims', status: 'Active', last: rel(-0.3), twoFA: true },
  { id: 's-4', name: 'R. Ade', email: 'r.ade@vendii.ng', role: 'Compliance', status: 'Active', last: rel(-0.2), twoFA: true },
  { id: 's-5', name: 'Ife Okonkwo', email: 'ife@vendii.ng', role: 'Treasury', status: 'Active', last: rel(-1), twoFA: true },
  { id: 's-6', name: 'Maryam Sule', email: 'maryam@vendii.ng', role: 'Support', status: 'Active', last: rel(-0.1), twoFA: false },
  { id: 's-7', name: 'Dayo Coker', email: 'dayo@vendii.ng', role: 'Credit', status: 'Invited', last: null, twoFA: false },
  { id: 's-8', name: 'Seun Lawal', email: 'seun@vendii.ng', role: 'Product', status: 'Deactivated', last: rel(-40), twoFA: true },
]

// ---------- integrations (what the back end has to connect to) ----------
export const INTEGRATIONS = [
  { id: 'auth', name: 'Identity and sessions', provider: '[Your auth service]', purpose: 'Sign in, one-time codes, refresh tokens, staff roles.', ops: ['auth.login', 'auth.verify', 'auth.refresh', 'auth.logout', 'session.bootstrap'], core: true },
  { id: 'kyc', name: 'BVN, NIN and selfie checks', provider: '[Identity verification provider]', purpose: 'Verify who a customer is at signup and screen against sanctions and PEP lists.', ops: ['kyc.submit', 'kyc.decide'] },
  { id: 'broker', name: 'Broker and order routing', provider: '[Sponsoring broker]', purpose: 'Send orders to the exchange, return fills and contract notes, hold client cash.', ops: ['orders.place', 'orders.cancel', 'orders.advance'] },
  { id: 'cscs', name: 'CSCS (shares register and liens)', provider: 'CSCS', purpose: 'Read holdings, open CHNs, place and lift liens for loans.', ops: ['loans.create', 'loans.approve', 'loans.liquidate'] },
  { id: 'market', name: 'Market data', provider: '[NGX data licence]', purpose: 'Prices, volumes, 52-week range, corporate actions and news.', ops: ['market.stocks', 'market.stock', 'market.news'] },
  { id: 'payments', name: 'Payments and virtual accounts', provider: '[Bank or payments provider]', purpose: 'Customer funding accounts, bank transfers in, payouts out, name enquiry.', ops: ['funding.deposit', 'funding.withdraw', 'treasury.decide'] },
  { id: 'funds', name: 'Fund managers', provider: '[Fund managers]', purpose: 'Daily unit prices, subscriptions and redemptions for mutual funds.', ops: ['funds.subscribe', 'funds.redeem', 'funds.nav'] },
  { id: 'offers', name: 'Registrars and receiving agents', provider: '[Registrars]', purpose: 'Take applications for public offers and return allotments.', ops: ['offers.apply', 'offers.cancel', 'offers.allot'] },
  { id: 'bonds', name: 'DMO (savings bonds)', provider: 'Debt Management Office', purpose: 'Monthly FGN Savings Bond window and subscriptions.', ops: ['bonds.subscribe'] },
  { id: 'claims', name: 'Registrar claims', provider: '[21 registrars]', purpose: 'Submit unclaimed dividend claims and track each registrar\'s response.', ops: ['claims.start', 'claims.advance'] },
  { id: 'insurers', name: 'Insurance partners', provider: '[Insurers]', purpose: 'Quotes and policy issue for insurance products.', ops: ['requests.create'] },
  { id: 'messaging', name: 'SMS, WhatsApp and email', provider: '[Messaging provider]', purpose: 'One-time codes, order alerts, margin call notices, statements.', ops: ['notifications.read'] },
  { id: 'files', name: 'Document storage', provider: '[Object storage]', purpose: 'KYC documents, claim certificates, signed loan agreements, statements.', ops: ['files.upload'] },
]
