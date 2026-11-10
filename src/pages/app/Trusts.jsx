import React, { useState } from 'react'
import { TopBar } from '../../layouts/Shell.jsx'
import { useStore } from '../../store/store.jsx'
import { Pill } from '../../components/ui.jsx'
import { Users, Sprout, Landmark } from '../../components/icons.jsx'

const ITEMS = [
  { kind: 'kids', icon: Sprout, title: 'Investing for your children', body: 'Open an account in your child\'s name that you manage until they are 18. Set up a small monthly amount into funds or shares and watch it grow.' },
  { kind: 'trust', icon: Landmark, title: 'Trusts and wills', body: 'Name who should get your shares and funds, and set rules for when. Fewer unclaimed holdings, fewer family disputes.' },
  { kind: 'joint', icon: Users, title: 'Joint and family accounts', body: 'Invest together with a spouse or sibling. Everyone sees the same holdings, and the account has clear rules for who can sell.' },
]
export default function Trusts() {
  const { state, dispatch, toast } = useStore()
  const joined = (k) => state.interest.some(i => i.owner === 'u-1' && i.kind === k)
  const [busy, setBusy] = useState('')
  return (
    <>
      <TopBar title="Family and trusts" />
      <div className="content">
        <div className="pagehead"><div><h2>Plan for the people you love</h2><div className="sub">These are being built with our partner trustees. Tell us which you want and we will tell you first.</div></div></div>
        <div className="cards wide">
          {ITEMS.map(({ kind, icon: I, title, body }) => (
            <div key={kind} className="card stack" style={{ gap: 10 }}>
              <div className="row"><I size={26} /><Pill kind="gold">Coming soon</Pill></div>
              <h3>{title}</h3><p className="muted small">{body}</p>
              <button className={'btn ' + (joined(kind) ? 'btn-o' : 'btn-p')} type="button" disabled={joined(kind) || busy === kind} style={{ marginTop: 'auto' }}
                onClick={() => { setBusy(kind); dispatch({ type: 'INTEREST', kind: title.toLowerCase() === '' ? kind : kind }); toast('You are on the list'); setBusy('') }}>{joined(kind) ? 'You are on the list ✓' : 'Notify me'}</button>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
