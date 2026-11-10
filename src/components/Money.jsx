import React from 'react'
import { useStore } from '../store/store.jsx'
import { naira } from '../utils.js'
import { Eye, EyeOff } from './icons.jsx'

// Shows an amount in naira, or dots when the customer has chosen to hide balances.
export function Money({ v, dec = 0, className, prefix = '' }) {
  const { state } = useStore()
  if (state.prefs.hideBalances) return <span className={className} aria-label="Amount hidden">{prefix}₦ ••••••</span>
  return <span className={className}>{prefix}{naira(v, { dec })}</span>
}
// Hides any text (for example percentages or units) when balances are hidden.
export function Mask({ children, className }) {
  const { state } = useStore()
  return <span className={className}>{state.prefs.hideBalances ? '••••' : children}</span>
}
export function EyeToggle({ label = 'balances' }) {
  const { state, dispatch } = useStore()
  const hidden = state.prefs.hideBalances
  return (
    <button type="button" className="eye" aria-pressed={hidden} aria-label={hidden ? `Show ${label}` : `Hide ${label}`} title={hidden ? 'Show balances' : 'Hide balances'} onClick={() => dispatch({ type: 'TOGGLE_HIDE' })}>
      {hidden ? <EyeOff /> : <Eye />}
    </button>
  )
}
