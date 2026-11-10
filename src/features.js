// Feature switches. Lending (share-backed loans / "Borrow") is built but hidden until launch.
// To show it again: set VITE_ENABLE_LENDING=true in .env (or in the host's build environment) and rebuild. Nothing has been deleted.
export const LENDING_ENABLED = import.meta.env.VITE_ENABLE_LENDING === 'true'

// Hides lending rows from display lists (the underlying records are untouched).
const LENDING_TEXT = /\b(loans?|collateral|lien|margin call|liquidat\w*)\b/i
export const visibleAudit = (rows) => LENDING_ENABLED ? rows : rows.filter(a => !LENDING_TEXT.test(a.action + ' ' + a.detail))
