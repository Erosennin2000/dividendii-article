import React, { createContext, useContext, useReducer, useEffect, useMemo, useCallback, useRef } from 'react'
import * as M from '../data/mock.js'
import * as C from '../data/catalog.js'
import { uid, today, computeFees, amortise, sum, addMonths } from '../utils.js'
import { api, isLive, anyLive, hasSession, getTokens, setTokens, CONFIG } from '../api/index.js'
import { ACTION_OPS, SLICE_KEYS } from '../api/contract.js'

const VERSION = 4
const KEY = 'vendii-demo-v' + VERSION

function initial() {
  return {
    auth: { signedIn: false, admin: false, role: null },
    user: M.USER,
    holdings: M.HOLDINGS,
    bonds: M.BONDS,
    cash: M.CASH,
    orders: M.ORDERS,
    paidDividends: M.PAID_DIVIDENDS,
    claims: M.CLAIMS,
    mandates: M.MANDATES,
    loans: M.LOANS,
    notifications: M.NOTIFICATIONS,
    adminUsers: M.ADMIN_USERS,
    amlFlags: M.AML_FLAGS,
    complaints: M.COMPLAINTS,
    settings: M.SETTINGS,
    audit: M.AUDIT,
    funds: C.FUNDS,
    fundHoldings: C.FUND_HOLDINGS,
    offers: C.OFFERS,
    offerApps: C.OFFER_APPS,
    news: C.NEWS,
    serviceRequests: C.SERVICE_REQUESTS,
    transactions: C.TRANSACTIONS,
    staff: C.STAFF,
    integrations: C.INTEGRATIONS.map(i => ({ id: i.id, mode: 'mock', baseUrl: '', keyLast4: '', health: 'unknown', checked: null })),
    userNotes: {},
    interest: [],
    watchlist: ['SEPLAT', 'ARADEL', 'UBA', 'NGXGROUP'],
    prefs: { hideBalances: false },
    waitlist: [],
    recurring: [],
    toasts: [],
    draftLoan: null,
    lastCheck: null,
  }
}

// In live mode nothing from the demo data may show before the server answers.
function emptyState() {
  const base = initial()
  return {
    ...base,
    user: { id: '', name: '', firstName: 'there', email: '', phone: '', bvnLast: '', ninLast: '', chn: '', tier: 1, kyc: 'Pending', joined: '', bank: { name: '', last4: '', accountName: '' }, beneficiary: { name: '', relationship: '', phone: '', confirmed: '' }, risk: '', experience: '', virtualAccount: { bank: '', number: '' }, security: { biometric: false, timeout: true, screenshots: true, devices: [] } },
    holdings: [], bonds: [], cash: { settled: 0, unsettled: 0, unsettledDate: null, sweep: false }, orders: [], paidDividends: [], claims: [], mandates: [], loans: [], notifications: [],
    adminUsers: [], amlFlags: [], complaints: [], audit: [], funds: [], fundHoldings: [], offers: [], offerApps: [], news: [], serviceRequests: [], transactions: [], staff: [], watchlist: [],
  }
}

function load() {
  if (anyLive() && CONFIG.mode === 'live') {
    const t = getTokens()
    let prefs = initial().prefs
    try { prefs = { ...prefs, ...JSON.parse(localStorage.getItem(KEY + '-prefs') || '{}') } } catch (e) { /* ignore */ }
    return { ...emptyState(), prefs, auth: t && t.accessToken ? { signedIn: true, admin: !!t.admin, role: t.role || null } : { signedIn: false, admin: false, role: null } }
  }
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) { const saved = JSON.parse(raw); return { ...initial(), ...saved, auth: { ...initial().auth, ...(saved.auth || {}) }, toasts: [] } }
  } catch (e) { /* ignore */ }
  return initial()
}

const audit = (state, actor, action, detail) => [{ ts: today(), actor, action, detail }, ...state.audit].slice(0, 200)
const tx = (state, t) => [{ id: uid('TX'), ts: today(), owner: 'u-1', ownerName: state.user.name, status: 'Completed', ...t }, ...state.transactions].slice(0, 300)
const notify = (state, title, body) => [{ id: uid('n'), ts: today(), title, body, read: false }, ...state.notifications].slice(0, 50)

function reducer(state, a) {
  switch (a.type) {
    case 'RESET': return initial()
    case 'TOAST': return { ...state, toasts: [...state.toasts, { id: uid('t'), text: a.text, kind: a.kind || '' }] }
    case 'UNTOAST': return { ...state, toasts: state.toasts.filter(t => t.id !== a.id) }
    case 'SIGN_IN': return { ...state, auth: { signedIn: true, admin: !!a.admin, role: a.admin ? (a.role || 'Super admin') : null } }
    case 'SET_ROLE': return { ...state, auth: { ...state.auth, role: a.role } }
    case 'SIGN_OUT': return { ...state, auth: { signedIn: false, admin: false, role: null } }
    case 'HYDRATE': return { ...state, ...a.data, auth: state.auth, toasts: state.toasts, prefs: state.prefs }
    case 'TOAST_QUIET': return state
    case 'READ_NOTIFS': return { ...state, notifications: state.notifications.map(n => ({ ...n, read: true })) }
    case 'SET_CHECK': return { ...state, lastCheck: a.check }
    case 'WAITLIST': return { ...state, waitlist: [...state.waitlist, a.entry] }

    case 'PLACE_ORDER': {
      const o = a.order
      return {
        ...state, orders: [o, ...state.orders],
        notifications: notify(state, 'Order received', `${o.side} ${o.units.toLocaleString()} ${o.ticker}. We will tell you at every step.`),
        audit: audit(state, 'Customer', 'Order placed', `${o.id} ${o.ticker} ${o.side} ${o.units}`),
      }
    }
    case 'CANCEL_ORDER': {
      return {
        ...state,
        orders: state.orders.map(o => o.id === a.id ? { ...o, status: o.filled > 0 ? 'Cancelled (part filled)' : 'Cancelled', timeline: [...o.timeline, ['Cancelled', today()]] } : o),
        audit: audit(state, 'Customer', 'Order cancelled', a.id),
      }
    }
    case 'ADVANCE_ORDER': {
      // admin desk moves an order along: Received -> Sent to broker -> On exchange -> Filled -> Settled
      const steps = ['Received', 'Sent to broker', 'On exchange', 'Filled', 'Settled']
      let holdings = state.holdings, cash = state.cash
      const orders = state.orders.map(o => {
        if (o.id !== a.id) return o
        const idx = Math.max(0, steps.indexOf(o.status === 'Partly filled' || o.status === 'Queued for open' ? 'On exchange' : o.status))
        const next = steps[Math.min(steps.length - 1, idx + 1)]
        const upd = { ...o, status: next, timeline: [...o.timeline, [next, today()]] }
        if (next === 'Filled') upd.filled = o.units
        if (next === 'Settled' && o.owner === 'u-1') {
          const px = o.limit || (M.STOCKS.find(s => s.ticker === o.ticker)?.price || 0)
          const gross = o.units * px
          const fees = computeFees(gross, state.settings).total
          if (o.side === 'Buy') {
            const h = holdings.find(h => h.ticker === o.ticker)
            holdings = h
              ? holdings.map(h => h.ticker === o.ticker ? { ...h, avgCost: (h.avgCost * h.units + gross) / (h.units + o.units), units: h.units + o.units } : h)
              : [...holdings, { ticker: o.ticker, units: o.units, avgCost: px }]
            cash = { ...cash, settled: Math.max(0, cash.settled - gross - fees) }
            upd.total = gross + fees
          } else {
            holdings = holdings.map(h => h.ticker === o.ticker ? { ...h, units: Math.max(0, h.units - o.units) } : h).filter(h => h.units > 0)
            cash = { ...cash, settled: cash.settled + gross - fees }
            upd.total = gross - fees
          }
        }
        return upd
      })
      const o = orders.find(x => x.id === a.id)
      const settledNow = o.status === 'Settled' && o.owner === 'u-1'
      return {
        ...state, orders, holdings, cash,
        transactions: settledNow ? tx(state, { type: 'Trade settlement', dir: o.side === 'Buy' ? 'out' : 'in', amount: o.total || 0, ref: `${o.id} ${o.ticker} ${o.side.toLowerCase()}` }) : state.transactions,
        notifications: o.owner === 'u-1' ? notify(state, `Order ${o.status.toLowerCase()}`, `${o.side} ${o.units.toLocaleString()} ${o.ticker} is now ${o.status.toLowerCase()}.`) : state.notifications,
        audit: audit(state, 'Order desk', 'Order moved to ' + o.status, a.id),
      }
    }
    case 'DEPOSIT': return { ...state, transactions: tx(state, { type: 'Deposit', dir: 'in', amount: a.amount, ref: 'Bank transfer' }), cash: { ...state.cash, settled: state.cash.settled + a.amount }, notifications: notify(state, 'Money received', `₦${a.amount.toLocaleString()} landed in your Vendii account.`), audit: audit(state, 'System', 'Deposit', `₦${a.amount.toLocaleString()} by transfer`) }
    case 'WITHDRAW': { const needs = a.amount > (state.settings.withdrawalApprovalLimit || Infinity); return { ...state, transactions: tx(state, { type: 'Withdrawal', dir: 'out', amount: a.amount, status: needs ? 'Pending approval' : 'Completed', needsApproval: needs, ref: `${state.user.bank.name} ••${state.user.bank.last4}` }), cash: { ...state.cash, settled: state.cash.settled - a.amount }, notifications: notify(state, 'Withdrawal sent', `₦${a.amount.toLocaleString()} is on its way to ${state.user.bank.name} ••${state.user.bank.last4}.`), audit: audit(state, 'Customer', 'Withdrawal', `₦${a.amount.toLocaleString()} to ${state.user.bank.name}`) } }
    case 'TOGGLE_SWEEP': return { ...state, cash: { ...state.cash, sweep: !state.cash.sweep } }
    case 'ADD_RECURRING': return { ...state, recurring: [...state.recurring, a.plan] }
    case 'REMOVE_RECURRING': return { ...state, recurring: state.recurring.filter(p => p.id !== a.id) }
    case 'SUBSCRIBE_BOND': {
      const b = a.bond
      return { ...state, bonds: [...state.bonds, b], cash: { ...state.cash, settled: state.cash.settled - b.amount }, notifications: notify(state, 'Savings bond subscribed', `₦${b.amount.toLocaleString()} in the ${b.tenor}-year FGN Savings Bond. Settles ${M.BOND_WINDOW.settles}.`), audit: audit(state, 'Customer', 'Bond subscription', `${b.units} units, ${b.tenor} year`) }
    }
    case 'UPDATE_USER': return { ...state, user: { ...state.user, ...a.patch }, audit: audit(state, 'Customer', 'Profile updated', Object.keys(a.patch).join(', ')) }
    case 'SET_SECURITY': return { ...state, user: { ...state.user, security: { ...state.user.security, ...a.patch } } }

    case 'START_CLAIMS': {
      const claims = a.claims.map(c => ({ ...c, id: uid('CLM'), owner: 'u-1', status: 'Submitted', step: 2, updated: today(), note: 'POA signed. Sent to registrar.' }))
      return { ...state, claims: [...claims, ...state.claims], notifications: notify(state, 'Recovery started', `${claims.length} claims submitted. We chase each registrar for you.`), audit: audit(state, 'Customer', 'Recovery claims started', claims.map(c => c.company).join(', ')) }
    }
    case 'UPLOAD_CLAIM_DOC': return { ...state, claims: state.claims.map(c => c.id === a.id ? { ...c, status: 'With registrar', step: 3, note: 'Certificate uploaded, registrar reviewing', updated: today() } : c), audit: audit(state, 'Customer', 'Claim document uploaded', a.id) }
    case 'ADVANCE_CLAIM': {
      const flow = ['Awaiting probate', 'Identity check', 'With registrar', 'Approved', 'Paid']
      let cash = state.cash
      const claims = state.claims.map(c => {
        if (c.id !== a.id) return c
        const cur = flow.indexOf(c.status)
        const idx = cur < 0 ? (c.status === 'Submitted' || c.status === 'Action needed' ? 1 : 0) : cur
        const next = flow[Math.min(flow.length - 1, idx + 1)]
        return { ...c, status: next, step: Math.min(5, idx + 2), updated: today(), note: next === 'Paid' ? 'Paid to bank, fee collected by direct debit' : next }
      })
      const c = claims.find(x => x.id === a.id)
      return { ...state, claims, cash, notifications: c.owner === 'u-1' ? notify(state, `Claim ${c.status.toLowerCase()}`, `${c.company}: ${c.status}.`) : state.notifications, audit: audit(state, 'Claims team', 'Claim moved to ' + c.status, a.id) }
    }
    case 'SUBMIT_MANDATE': return { ...state, mandates: state.mandates.map(m => m.registrar === a.registrar ? { ...m, status: 'Submitted' } : m), audit: audit(state, 'Customer', 'E-dividend mandate submitted', a.registrar) }

    case 'SET_DRAFT_LOAN': return { ...state, draftLoan: a.draft }
    case 'CREATE_LOAN': {
      const l = a.loan
      return { ...state, loans: [l, ...state.loans], draftLoan: null, notifications: notify(state, 'Loan application received', `₦${l.amount.toLocaleString()} for ${l.tenor} months. Trust Bank usually decides within one working day.`), audit: audit(state, 'Customer', 'Loan application', `${l.id} ₦${l.amount.toLocaleString()}`) }
    }
    case 'APPROVE_LOAN': {
      const loans = state.loans.map(l => l.id === a.id ? { ...l, status: 'Active', start: today(), alerts: [[today(), 'Lien placed at CSCS on ' + l.collateral.length + ' securities', 'email'], [today(), `Loan paid out ₦${l.amount.toLocaleString()} to bank`, 'SMS, WhatsApp, email'], ...(l.alerts || [])] } : l)
      const l = loans.find(x => x.id === a.id)
      return { ...state, loans, notifications: l.owner === 'u-1' ? notify(state, 'Loan approved and paid', `₦${l.amount.toLocaleString()} is on its way to ${state.user.bank.name} ••${state.user.bank.last4}.`) : state.notifications, audit: audit(state, 'Credit (Trust Bank)', 'Loan approved', a.id) }
    }
    case 'DECLINE_LOAN': return { ...state, loans: state.loans.map(l => l.id === a.id ? { ...l, status: 'Declined' } : l), audit: audit(state, 'Credit (Trust Bank)', 'Loan declined', a.id) }
    case 'REPAY': {
      const loans = state.loans.map(l => {
        if (l.id !== a.id) return l
        const out = Math.max(0, l.outstanding - a.amount)
        return { ...l, outstanding: out, status: out === 0 ? 'Repaid' : l.status, payments: [...l.payments, { n: l.payments.length + 1, date: today(), amount: a.amount, status: 'Paid' }], alerts: [[today(), `Repayment of ₦${a.amount.toLocaleString()} received`, 'SMS, email, app'], ...(l.alerts || [])] }
      })
      const l = loans.find(x => x.id === a.id)
      return { ...state, loans, cash: a.fromCash ? { ...state.cash, settled: state.cash.settled - a.amount } : state.cash, notifications: notify(state, l.status === 'Repaid' ? 'Loan repaid, lien lifting' : 'Repayment received', `₦${a.amount.toLocaleString()} applied to ${l.id}.${l.status === 'Repaid' ? ' Your shares are free within 1 working day.' : ''}`), audit: audit(state, 'Customer', 'Loan repayment', `${a.id} ₦${a.amount.toLocaleString()}`) }
    }
    case 'PLEDGE_MORE': {
      const loans = state.loans.map(l => l.id === a.id ? { ...l, collateral: [...l.collateral, a.item], alerts: [[today(), `Pledged ${a.item.units.toLocaleString()} ${a.item.ticker}`, 'email, app'], ...(l.alerts || [])] } : l)
      return { ...state, loans, audit: audit(state, 'Customer', 'Collateral added', `${a.id} ${a.item.ticker} ${a.item.units}`) }
    }
    case 'LIQUIDATE': {
      const loans = state.loans.map(l => l.id === a.id ? { ...l, outstanding: Math.max(0, l.outstanding - a.proceeds), collateral: l.collateral.map(c => c.ticker === a.ticker ? { ...c, units: c.units - a.units } : c).filter(c => c.units > 0), alerts: [[today(), `Sold ${a.units.toLocaleString()} ${a.ticker} to restore loan health. Record sent.`, 'SMS, WhatsApp, email, app'], ...(l.alerts || [])] } : l)
      return { ...state, loans, audit: audit(state, 'Credit (Trust Bank)', 'Collateral sold', `${a.id} ${a.ticker} ${a.units} for ₦${a.proceeds.toLocaleString()}`) }
    }

    case 'KYC': return { ...state, adminUsers: state.adminUsers.map(u => u.id === a.id ? { ...u, kyc: a.status, chn: a.status === 'Verified' && !u.chn ? 'pending' : u.chn } : u), audit: audit(state, 'Onboarding (admin)', 'KYC ' + a.status, a.id) }
    case 'RESOLVE_FLAG': return { ...state, amlFlags: state.amlFlags.map(f => f.id === a.id ? { ...f, status: a.status } : f), audit: audit(state, 'Compliance', 'Flag ' + a.status, a.id) }
    case 'COMPLAINT': return { ...state, complaints: [a.complaint, ...state.complaints], audit: audit(state, 'Customer', 'Complaint logged', a.complaint.id) }
    case 'COMPLAINT_STATUS': return { ...state, complaints: state.complaints.map(c => c.id === a.id ? { ...c, status: a.status } : c), audit: audit(state, 'Support', 'Complaint ' + a.status, a.id) }
    case 'SETTINGS': return { ...state, settings: { ...state.settings, ...a.patch }, audit: audit(state, 'Admin', 'Settings changed', Object.keys(a.patch).join(', ')) }
    case 'FLAG': return { ...state, settings: { ...state.settings, flags: { ...state.settings.flags, [a.key]: a.value } }, audit: audit(state, 'Admin', 'Feature flag ' + a.key, String(a.value)) }
    case 'ADVANCE_RATE': return { ...state, settings: { ...state.settings, advance: { ...state.settings.advance, [a.ticker]: a.rate } }, audit: audit(state, 'Credit (Trust Bank)', 'Advance rate changed', `${a.ticker} ${Math.round(a.rate * 100)}%`) }
    // ---------- added: preferences, watchlist ----------
    case 'TOGGLE_HIDE': return { ...state, prefs: { ...state.prefs, hideBalances: !state.prefs.hideBalances } }
    case 'WATCH_TOGGLE': return { ...state, watchlist: state.watchlist.includes(a.ticker) ? state.watchlist.filter(t => t !== a.ticker) : [...state.watchlist, a.ticker] }
    case 'INTEREST': return { ...state, interest: [{ id: uid('int'), kind: a.kind, ts: today(), owner: 'u-1', ownerName: state.user.name }, ...state.interest], notifications: notify(state, 'You are on the list', `We will tell you first when ${a.kind} opens.`) }

    // ---------- added: mutual funds ----------
    case 'FUND_SUBSCRIBE': {
      const f = state.funds.find(x => x.id === a.fundId)
      const units = a.units ?? a.amount / f.nav
      const cur = state.fundHoldings.find(h => h.fundId === a.fundId)
      const fundHoldings = cur
        ? state.fundHoldings.map(h => h.fundId === a.fundId ? { ...h, avgCost: (h.avgCost * h.units + units * f.nav) / (h.units + units), units: h.units + units } : h)
        : [...state.fundHoldings, { fundId: a.fundId, units, avgCost: f.nav }]
      return { ...state, fundHoldings, cash: { ...state.cash, settled: state.cash.settled - a.amount },
        transactions: tx(state, { id: a.tx?.id, type: 'Fund subscription', dir: 'out', amount: a.amount, ref: f.name }),
        notifications: notify(state, 'Fund purchase received', `₦${Math.round(a.amount).toLocaleString()} into ${f.name}. About ${units.toLocaleString('en-NG', { maximumFractionDigits: 2 })} units at ${f.currency === 'USD' ? '$' : '₦'}${f.nav}.`),
        audit: audit(state, 'Customer', 'Fund subscription', `${f.name} ₦${Math.round(a.amount).toLocaleString()}`) }
    }
    case 'FUND_REDEEM': {
      const f = state.funds.find(x => x.id === a.fundId)
      const fundHoldings = state.fundHoldings.map(h => h.fundId === a.fundId ? { ...h, units: Math.max(0, h.units - a.units) } : h).filter(h => h.units > 0.0001)
      const settle = new Date(); settle.setDate(settle.getDate() + 1)
      return { ...state, fundHoldings, cash: { ...state.cash, unsettled: state.cash.unsettled + a.proceeds, unsettledDate: settle.toISOString().slice(0, 10) },
        transactions: tx(state, { type: 'Fund redemption', dir: 'in', amount: a.proceeds, ref: f.name }),
        notifications: notify(state, 'Fund sale received', `₦${Math.round(a.proceeds).toLocaleString()} from ${f.name} settles ${f.redemption}.`),
        audit: audit(state, 'Customer', 'Fund redemption', `${f.name} ${a.units.toLocaleString('en-NG', { maximumFractionDigits: 2 })} units`) }
    }
    case 'FUND_UPSERT': {
      const exists = state.funds.some(x => x.id === a.fund.id)
      return { ...state, funds: exists ? state.funds.map(x => x.id === a.fund.id ? { ...x, ...a.fund } : x) : [...state.funds, a.fund], audit: audit(state, 'Product', exists ? 'Fund edited' : 'Fund created', a.fund.name) }
    }
    case 'FUND_NAV': return { ...state, funds: state.funds.map(x => x.id === a.id ? { ...x, nav: a.nav, history: [...x.history.slice(1), a.nav] } : x), audit: audit(state, 'Product', 'NAV published', `${a.id} ${a.nav}`) }

    // ---------- added: public offers ----------
    case 'OFFER_APPLY': {
      const of = state.offers.find(x => x.id === a.app.offerId)
      return { ...state, offerApps: [a.app, ...state.offerApps], cash: { ...state.cash, settled: state.cash.settled - a.app.amount },
        transactions: tx(state, { type: 'Offer payment', dir: 'out', amount: a.app.amount, ref: of.name }),
        notifications: notify(state, 'Application received', `${a.app.units.toLocaleString()} units of ${of.issuer}. ₦${a.app.amount.toLocaleString()} is held until allotment.`),
        audit: audit(state, 'Customer', 'Offer application', `${a.app.id} ${of.issuer} ${a.app.units}`) }
    }
    case 'OFFER_CANCEL': {
      const app = state.offerApps.find(x => x.id === a.id)
      return { ...state, offerApps: state.offerApps.map(x => x.id === a.id ? { ...x, status: 'Cancelled' } : x), cash: { ...state.cash, settled: state.cash.settled + app.amount },
        transactions: tx(state, { type: 'Offer refund', dir: 'in', amount: app.amount, ref: 'Application withdrawn ' + app.id }),
        audit: audit(state, 'Customer', 'Offer application withdrawn', a.id) }
    }
    case 'OFFER_UPSERT': {
      const exists = state.offers.some(x => x.id === a.offer.id)
      return { ...state, offers: exists ? state.offers.map(x => x.id === a.offer.id ? { ...x, ...a.offer } : x) : [a.offer, ...state.offers], audit: audit(state, 'Product', exists ? 'Offer edited' : 'Offer created', a.offer.name) }
    }
    case 'OFFER_STATUS': return { ...state, offers: state.offers.map(x => x.id === a.id ? { ...x, status: a.status } : x), audit: audit(state, 'Product', 'Offer ' + a.status.toLowerCase(), a.id) }
    case 'OFFER_ALLOT': {
      const of = state.offers.find(x => x.id === a.id)
      let refundMine = 0
      const apps = state.offerApps.map(x => {
        if (x.offerId !== a.id || x.status !== 'Submitted') return x
        const allottedUnits = Math.floor(x.units * a.ratio / (of.multiple || 1)) * (of.multiple || 1)
        const refund = Math.round((x.units - allottedUnits) * of.unitPrice * 100) / 100
        if (x.owner === 'u-1') refundMine += refund
        return { ...x, status: 'Allotted', allottedUnits, refund }
      })
      const mine = apps.filter(x => x.offerId === a.id && x.owner === 'u-1' && x.status === 'Allotted')
      return { ...state, offers: state.offers.map(x => x.id === a.id ? { ...x, status: 'Allotted' } : x), offerApps: apps,
        cash: { ...state.cash, settled: state.cash.settled + refundMine },
        transactions: refundMine > 0 ? tx(state, { type: 'Offer refund', dir: 'in', amount: refundMine, ref: 'Unallotted units, ' + of.issuer }) : state.transactions,
        notifications: mine.length ? notify(state, 'Allotment done', `${of.issuer}: you were allotted ${mine[0].allottedUnits.toLocaleString()} of ${mine[0].units.toLocaleString()} units.${refundMine ? ` ₦${refundMine.toLocaleString()} returned to cash.` : ''}`) : state.notifications,
        audit: audit(state, 'Product', 'Allotment run', `${of.issuer} at ${Math.round(a.ratio * 100)}%`) }
    }

    // ---------- added: service requests ----------
    case 'SR_CREATE': return { ...state, serviceRequests: [a.req, ...state.serviceRequests], notifications: notify(state, 'Request received', `${a.req.subject}. Reference ${a.req.id}.`), audit: audit(state, 'Customer', 'Service request', `${a.req.id} ${a.req.subject}`) }
    case 'SR_STATUS': {
      const serviceRequests = state.serviceRequests.map(r => r.id !== a.id ? r : { ...r, status: a.status ?? r.status, assignee: a.assignee ?? r.assignee, notes: a.note ? [...r.notes, { by: a.by || 'Staff', ts: today(), text: a.note }] : r.notes })
      const r = serviceRequests.find(x => x.id === a.id)
      return { ...state, serviceRequests, notifications: r.owner === 'u-1' && a.status ? notify(state, `Request ${a.status.toLowerCase()}`, `${r.subject} (${r.id}) is now ${a.status.toLowerCase()}.`) : state.notifications, audit: audit(state, 'Support', 'Request ' + (a.status || 'updated'), a.id) }
    }
    case 'SR_NOTE': return { ...state, serviceRequests: state.serviceRequests.map(r => r.id === a.id ? { ...r, notes: [...r.notes, { by: a.by || 'Staff', ts: today(), text: a.text }] } : r) }

    // ---------- added: treasury ----------
    case 'TX_DECISION': {
      const t = state.transactions.find(x => x.id === a.id)
      const approve = a.decision === 'Approve'
      const refund = !approve && t.type === 'Withdrawal' && t.owner === 'u-1'
      return { ...state, transactions: state.transactions.map(x => x.id === a.id ? { ...x, status: approve ? 'Completed' : 'Reversed', needsApproval: false, decidedBy: a.by || 'Treasury' } : x),
        cash: refund ? { ...state.cash, settled: state.cash.settled + t.amount } : state.cash,
        notifications: t.owner === 'u-1' ? notify(state, approve ? 'Withdrawal approved' : 'Withdrawal not approved', approve ? `₦${t.amount.toLocaleString()} is on its way to your bank.` : `₦${t.amount.toLocaleString()} was returned to your cash balance. Contact us if you need to know why.`) : state.notifications,
        audit: audit(state, 'Treasury', 'Payment ' + (approve ? 'approved' : 'rejected'), `${a.id} ₦${t.amount.toLocaleString()} ${t.ownerName}`) }
    }

    // ---------- added: content, halts, people ----------
    case 'NEWS_PUBLISH': return { ...state, news: [{ id: uid('nw'), date: today().slice(0, 10), by: 'Vendii', ...a.item }, ...state.news], audit: audit(state, 'Content', 'News published', a.item.title) }
    case 'NEWS_REMOVE': return { ...state, news: state.news.filter(n => n.id !== a.id), audit: audit(state, 'Content', 'News removed', a.id) }
    case 'HALT_TOGGLE': {
      const cur = state.settings.haltedTickers || []
      const halted = cur.includes(a.ticker)
      return { ...state, settings: { ...state.settings, haltedTickers: halted ? cur.filter(t => t !== a.ticker) : [...cur, a.ticker] }, audit: audit(state, 'Order desk', halted ? 'Trading resumed' : 'Trading halted', a.ticker) }
    }
    case 'USER_STATUS': return { ...state, adminUsers: state.adminUsers.map(u => u.id === a.id ? { ...u, status: a.status } : u), audit: audit(state, 'Compliance', 'Customer ' + a.status.toLowerCase(), `${a.id}${a.reason ? ': ' + a.reason : ''}`) }
    case 'USER_NOTE': return { ...state, userNotes: { ...state.userNotes, [a.id]: [...(state.userNotes[a.id] || []), { ts: today(), by: a.by || 'Staff', text: a.text }] }, audit: audit(state, 'Staff', 'Customer note added', a.id) }
    case 'STAFF_UPSERT': {
      const exists = state.staff.some(x => x.id === a.staff.id)
      return { ...state, staff: exists ? state.staff.map(x => x.id === a.staff.id ? { ...x, ...a.staff } : x) : [...state.staff, a.staff], audit: audit(state, 'Admin', exists ? 'Staff role changed' : 'Staff invited', `${a.staff.name} (${a.staff.role})`) }
    }
    case 'STAFF_STATUS': return { ...state, staff: state.staff.map(x => x.id === a.id ? { ...x, status: a.status } : x), audit: audit(state, 'Admin', 'Staff ' + a.status.toLowerCase(), a.id) }
    case 'INTEGRATION': return { ...state, integrations: state.integrations.map(i => i.id === a.id ? { ...i, ...a.patch } : i), audit: audit(state, 'Admin', 'Integration changed', a.id + ' ' + Object.keys(a.patch).join(', ')) }

    // ---------- added: server sync ----------
    case 'SYNC': {
      const next = { ...state }
      for (const [slice, val] of Object.entries(a.sync || {})) {
        const cur = state[slice]
        if (Array.isArray(val) && Array.isArray(cur)) {
          const key = SLICE_KEYS[slice] || 'id'
          let arr = [...cur]
          for (const item of val) {
            const i = arr.findIndex(x => x[key] === item[key] || (item.clientId && x[key] === item.clientId))
            if (i >= 0) arr[i] = { ...arr[i], ...item }; else arr = [item, ...arr]
          }
          next[slice] = arr
        } else if (val && typeof val === 'object' && !Array.isArray(val) && cur && typeof cur === 'object') next[slice] = { ...cur, ...val }
        else next[slice] = val
      }
      return next
    }
    default: return state
  }
}

const Ctx = createContext(null)

// Replace the static securities list in place so every screen that imports it sees new prices.
function applyStocks(list) {
  if (!Array.isArray(list) || !list.length) return
  const next = list.map(s => ({ liquidity: 'Medium', pastDivs: [], nextDiv: null, advance: 0, ...s, history: s.history && s.history.length ? s.history : [s.price] }))
  M.STOCKS.splice(0, M.STOCKS.length, ...next)
}

export function StoreProvider({ children, override }) {
  const [state, rawDispatch] = useReducer(reducer, override, o => o ? { ...initial(), ...o } : load())
  const stateRef = useRef(state)
  stateRef.current = state

  // Persist. Live mode never writes money data to the browser, only display preferences.
  useEffect(() => {
    const { toasts, ...rest } = state
    try {
      if (CONFIG.mode === 'live') localStorage.setItem(KEY + '-prefs', JSON.stringify(state.prefs))
      else localStorage.setItem(KEY, JSON.stringify(rest))
    } catch (e) { /* ignore */ }
  }, [state])

  const toast = useCallback((text, kind) => { rawDispatch({ type: 'TOAST', text, kind }) }, [])
  useEffect(() => {
    if (!state.toasts.length) return
    const t = setTimeout(() => rawDispatch({ type: 'UNTOAST', id: state.toasts[0].id }), 3200)
    return () => clearTimeout(t)
  }, [state.toasts])

  // Pull everything from the server (live mode) and refresh market prices.
  const resync = useCallback(async () => {
    try {
      if (isLive('session.bootstrap') && stateRef.current.auth.signedIn) {
        const r = await api.call(stateRef.current.auth.admin ? 'admin.bootstrap' : 'session.bootstrap')
        if (r?.data) rawDispatch({ type: 'HYDRATE', data: r.data })
      }
      if (isLive('market.stocks')) {
        const m = await api.call('market.stocks')
        if (m?.data) { applyStocks(m.data); rawDispatch({ type: 'TOAST_QUIET' }) }
      }
    } catch (e) { if (e.status !== 401) toast(e.message || 'Could not refresh', 'bad') }
  }, [toast])

  useEffect(() => {
    if (!anyLive()) return
    resync()
    const poll = isLive('market.stocks') ? setInterval(() => { if (document.visibilityState === 'visible') resync() }, 15000) : null
    const out = () => rawDispatch({ type: 'SIGN_OUT' })
    window.addEventListener('vendii:signed-out', out)
    return () => { if (poll) clearInterval(poll); window.removeEventListener('vendii:signed-out', out) }
  }, [resync])

  // Legacy-style dispatch: apply locally at once, and in live mode also send to the server in the background.
  const dispatch = useCallback((action) => {
    rawDispatch(action)
    if (action.type === 'SIGN_OUT' && anyLive()) { api.call('auth.logout').catch(() => {}).finally(() => setTokens(null)); return }
    const name = ACTION_OPS[action.type]
    if (name && isLive(name) && !action.fromServer) {
      api.send(name, action)
        .then(res => { if (res.sync) rawDispatch({ type: 'SYNC', sync: res.sync }) })
        .catch(err => { toast(err.message || 'That did not go through', 'bad'); resync() })
    }
  }, [toast, resync])

  // Awaitable dispatch for money flows: live mode waits for the server, applies what it says, and throws on failure.
  // Mock mode applies the reducer at once, so screens behave the same either way.
  const act = useCallback(async (action) => {
    const name = ACTION_OPS[action.type]
    if (!name || !isLive(name)) { rawDispatch(action); return { data: null, mock: true } }
    const res = await api.send(name, action)
    if (res.sync) rawDispatch({ type: 'SYNC', sync: res.sync }); else rawDispatch({ ...action, fromServer: true })
    return res
  }, [])

  const value = useMemo(() => ({ state, dispatch, act, toast, resync }), [state, dispatch, act, toast, resync])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export const useStore = () => useContext(Ctx)

// ---------- selectors ----------
export function stockOf(ticker) { return M.STOCKS.find(s => s.ticker === ticker) }
export function priceOf(ticker, settings) {
  const s = stockOf(ticker)
  if (!s) return 0
  return s.price * (1 - (settings?.marketShock || 0))
}
export function portfolio(state) {
  const rows = state.holdings.map(h => {
    const s = stockOf(h.ticker)
    const px = priceOf(h.ticker, state.settings)
    const value = h.units * px
    const cost = h.units * h.avgCost
    const divs = sum(state.paidDividends.filter(d => d.ticker === h.ticker), d => d.net)
    return { ...h, stock: s, price: px, value, cost, gain: value - cost, divs, totalReturn: (value - cost + divs) / (cost || 1) }
  })
  const bondsValue = sum(state.bonds, b => b.amount)
  const fundRows = state.fundHoldings.map(h => {
    const f = state.funds.find(x => x.id === h.fundId)
    const fx = f?.currency === 'USD' ? (state.settings.fx || 1520) : 1
    const value = f ? h.units * f.nav * fx : 0, cost = h.units * h.avgCost * fx
    return { ...h, fund: f, value, cost, gain: value - cost }
  }).filter(r => r.fund)
  const fundsValue = sum(fundRows, r => r.value)
  const equity = sum(rows, r => r.value)
  const dayChange = sum(rows, r => r.units * (r.price - r.stock.prev * (1 - (state.settings.marketShock || 0))))
  const openBuys = state.orders.filter(o => o.owner === 'u-1' && o.side === 'Buy' && ['Received', 'Sent to broker', 'On exchange', 'Partly filled', 'Queued for open'].includes(o.status))
  const reserved = sum(openBuys, o => (o.units - o.filled) * (o.limit || stockOf(o.ticker).price))
  const cost = sum(rows, r => r.cost) + bondsValue + sum(fundRows, r => r.cost)
  const divsAll = sum(state.paidDividends, d => d.net)
  const invested = equity + bondsValue + fundsValue
  return { rows, fundRows, equity, bondsValue, fundsValue, invested, total: invested + state.cash.settled + state.cash.unsettled, dayChange, reserved, cost, divsAll, totalReturn: (invested - cost + divsAll) / (cost || 1) }
}
export function upcomingDividends(state) {
  return state.holdings.map(h => {
    const s = stockOf(h.ticker)
    if (!s?.nextDiv) return null
    const gross = h.units * s.nextDiv.amount
    return { ticker: h.ticker, ...s.nextDiv, units: h.units, gross, wht: gross * 0.1, net: gross * 0.9 }
  }).filter(Boolean).sort((a, b) => a.pay.localeCompare(b.pay))
}
export function offerStats(o, state) {
  const mine = sum(state.offerApps.filter(a => a.offerId === o.id && a.status !== 'Cancelled'), a => a.units)
  const subscribed = (o.baseSubscribed || 0) + mine
  return { subscribed, pct: o.sizeUnits ? subscribed / o.sizeUnits * 100 : 0, minEntry: o.minUnits * o.unitPrice, apps: state.offerApps.filter(a => a.offerId === o.id && a.status !== 'Cancelled') }
}
export function fundOf(id, state) { return state.funds.find(f => f.id === id) }
export const fundFx = (f, settings) => (f?.currency === 'USD' ? (settings?.fx || 1520) : 1)
export function isHalted(ticker, settings) { return (settings.haltedTickers || []).includes(ticker) }
export function activeLoan(state) {
  return state.loans.find(l => l.owner === 'u-1' && ['Active', 'Pending approval'].includes(l.status)) || null
}
export function loanMetrics(loan, state) {
  const s = state.settings
  const rows = loan.collateral.map(c => {
    const st = stockOf(c.ticker)
    const px = priceOf(c.ticker, s)
    return { ...c, name: st?.name, price: px, value: c.units * px, base: c.units * st.price, advance: s.advance[c.ticker] ?? st.advance, liquidity: st.liquidity }
  })
  const collateral = sum(rows, r => r.value)
  const ltv = collateral > 0 ? loan.outstanding / collateral : 0
  const band = ltv >= s.liqLtv ? 'liquidation' : ltv >= s.callLtv ? 'call' : ltv >= s.warnLtv ? 'warning' : 'healthy'
  const cureNeeded = Math.max(0, loan.outstanding - collateral * s.warnLtv)
  const fallToCall = collateral > 0 ? Math.max(0, 1 - loan.outstanding / (s.callLtv * collateral)) : 0
  const schedule = amortise(loan.amount, loan.rate, loan.tenor).map((r, i) => ({ ...r, date: addMonths(loan.start || today(), i + 1), status: i < loan.payments.filter(p => p.status === 'Paid').length ? 'Paid' : 'Scheduled' }))
  return { rows, collateral, ltv, band, cureNeeded, fallToCall, schedule }
}
export function eligibleCollateral(state) {
  const s = state.settings
  return state.holdings.map(h => {
    const st = stockOf(h.ticker)
    const px = priceOf(h.ticker, s)
    const h6 = st.history.slice(-6)
    const avg30 = Math.min(px, (h6.reduce((a, b) => a + b, 0) / (h6.length || 1)) * (1 - (s.marketShock || 0)))
    const adv = s.advance[h.ticker] ?? st.advance
    const value = h.units * avg30
    return { ...h, stock: st, valuation: avg30, value, advance: adv, borrowable: value * adv, liquidity: st.liquidity, bank: !!st.bank }
  })
}

export { reducer, initial }
