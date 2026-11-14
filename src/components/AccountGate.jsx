import React, { createContext, useContext, useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useStore } from '../store/store.jsx'

/**
 * The investing demo is for Dividendii account holders. Accounts live in the check app at /check; it answers
 * /check/api/account/me with 200 when the visitor is signed in (same site, so the cookie goes with it).
 * Not signed in: off to /check/account, which brings them back here afterwards.
 */
const AccountCtx = createContext(null)
export const useAccount = () => useContext(AccountCtx)

export default function AccountGate({ children }) {
  const { state, dispatch } = useStore()
  const loc = useLocation()
  const [me, setMe] = useState(null)

  useEffect(() => {
    let dead = false
    fetch('/check/api/account/me', { credentials: 'same-origin', cache: 'no-store' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then(d => {
        if (dead) return
        setMe(d.account)
        if (!state.auth.signedIn || state.auth.admin) dispatch({ type: 'SIGN_IN', admin: false })
      })
      .catch(() => { if (!dead) window.location.replace('/check/account?next=' + encodeURIComponent(loc.pathname)) })
    return () => { dead = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!me) return <div className="center-load" style={{ padding: 80, textAlign: 'center' }}><p className="muted">Opening the demo…</p></div>
  return <AccountCtx.Provider value={me}>{children}</AccountCtx.Provider>
}

/** Sits at the top of every demo screen. */
export function DemoBanner() {
  const me = useAccount()
  if (!me) return null
  return (
    <div className="demo-banner" role="note">
      <span><strong>Demo, {me.firstName}.</strong> This is a sample investor's account. Prices, balances and orders are not real, and no money moves. Investing opens once our SEC registration is approved.</span>
      <span className="demo-links">
        <a href="/check/account?tab=investing">{me.waitlist ? 'On the waitlist ✓' : 'Join the waitlist'}</a>
        <a href="/check/account?tab=feedback&from=demo">Give feedback</a>
        <a href="/check/account">My account</a>
      </span>
    </div>
  )
}
