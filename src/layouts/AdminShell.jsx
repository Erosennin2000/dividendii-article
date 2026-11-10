import React from 'react'
import { Shell } from './Shell.jsx'
import { useStore, loanMetrics } from '../store/store.jsx'
import { can } from '../data/catalog.js'
import { LENDING_ENABLED } from '../features.js'

export default function AdminShell() {
  const { state } = useStore()
  const deskQueue = state.orders.filter(o => ['Received', 'Sent to broker', 'On exchange', 'Partly filled', 'Queued for open'].includes(o.status)).length
  const kycQueue = state.adminUsers.filter(u => !['Verified'].includes(u.kyc)).length
  const calls = state.loans.filter(l => l.status === 'Active').filter(l => loanMetrics(l, state).band !== 'healthy').length
  const pendingLoans = state.loans.filter(l => l.status === 'Pending approval').length
  const flags = state.amlFlags.filter(f => f.status === 'Open').length + state.complaints.filter(c => c.status !== 'Resolved').length
  const role = state.auth.role || 'Super admin'
  const openReqs = state.serviceRequests.filter(r => !['Completed', 'Rejected'].includes(r.status)).length
  const pendingPay = state.transactions.filter(t => t.needsApproval).length
  return (
    <Shell
      kind="admin"
      sections={[
        { items: [{ to: '/admin', label: 'Overview', end: true }] },
        { title: 'OPERATIONS', items: [
          { to: '/admin/orders', area: 'orders', label: 'Order desk', badge: deskQueue || null },
          { to: '/admin/users', area: 'users', label: 'Customers and KYC', badge: kycQueue || null, badgeKind: 'warn' },
          { to: '/admin/claims', area: 'claims', label: 'Recovery claims' },
          { to: '/admin/requests', area: 'requests', label: 'Service requests', badge: openReqs || null, badgeKind: 'warn' },
          { to: '/admin/content', area: 'content', label: 'News and halts' },
        ] },
        { title: 'MONEY AND PRODUCTS', items: [
          { to: '/admin/treasury', area: 'treasury', label: 'Treasury', badge: pendingPay || null, badgeKind: 'warn' },
          { to: '/admin/products', area: 'products', label: 'Offers and funds' },
          LENDING_ENABLED && { to: '/admin/lending', area: 'lending', label: 'Loan book', badge: (calls + pendingLoans) || null, badgeKind: calls ? 'bad' : 'warn' },
        ].filter(Boolean) },
        { title: 'CONTROL', items: [
          { to: '/admin/compliance', area: 'compliance', label: 'Compliance and complaints', badge: flags || null, badgeKind: 'bad' },
          { to: '/admin/reports', area: 'reports', label: 'Reports' },
          { to: '/admin/staff', area: 'staff', label: 'Staff and roles' },
          { to: '/admin/integrations', area: 'integrations', label: 'Integrations' },
          { to: '/admin/settings', area: 'settings', label: 'Fees, rates and flags' },
          { to: '/admin/audit', area: 'audit', label: 'Audit log' },
        ] },
      ].map(sec => ({ ...sec, items: sec.items.filter(i => !i.area || can(role, i.area)) })).filter(sec => sec.items.length)}
      box={{ title: 'Signed in as ' + role, body: 'Every action here is logged with your name and time. Customers see the results in their own apps.' }}
      footLinks={[{ to: '/app', label: 'Customer app' }, { to: '/', label: 'Website' }]}
    />
  )
}
