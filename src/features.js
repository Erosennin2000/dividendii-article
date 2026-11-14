// Feature switches. Lending (share-backed loans / "Borrow") is built but hidden until launch.
// To show it again: set VITE_ENABLE_LENDING=true in .env (or in the host's build environment) and rebuild. Nothing has been deleted.
export const LENDING_ENABLED = import.meta.env.VITE_ENABLE_LENDING === 'true'

// Hides lending rows from display lists (the underlying records are untouched).
const LENDING_TEXT = /\b(loans?|collateral|lien|margin call|liquidat\w*)\b/i
export const visibleAudit = (rows) => LENDING_ENABLED ? rows : rows.filter(a => !LENDING_TEXT.test(a.action + ' ' + a.detail))

// The customer app and the staff demo console run on sample data with a pretend sign-in. They stay closed to the public
// until real sign-in exists. To open them for private testing only, set VITE_ENABLE_DEMO=true when building.
export const DEMO_ENABLED = import.meta.env.VITE_ENABLE_DEMO === 'true'

// The customer side of the demo (/app) is open to signed-in Dividendii account holders: the check app at /check runs the
// accounts. Sample data only, with a banner on every screen. The staff demo console stays closed. Set VITE_ACCOUNT_DEMO=false to hide it.
export const ACCOUNT_DEMO = import.meta.env.VITE_ACCOUNT_DEMO !== 'false'
