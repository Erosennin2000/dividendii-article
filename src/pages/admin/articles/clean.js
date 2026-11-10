// Cleans HTML pasted into the editor (Word, Google Docs, web pages). The server cleans again on save: this is for tidiness.
const KEEP = new Set(['P', 'H2', 'H3', 'H4', 'UL', 'OL', 'LI', 'A', 'STRONG', 'EM', 'U', 'BLOCKQUOTE', 'IMG', 'BR', 'HR', 'TABLE', 'THEAD', 'TBODY', 'TR', 'TH', 'TD', 'SUP', 'SUB'])
const DROP = new Set(['SCRIPT', 'STYLE', 'IFRAME', 'OBJECT', 'EMBED', 'FORM', 'INPUT', 'BUTTON', 'TEXTAREA', 'SELECT', 'SVG', 'MATH', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE', 'HEAD', 'TITLE'])
const MAP = { H1: 'H2', H5: 'H4', H6: 'H4', B: 'STRONG', I: 'EM' }
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
const safeHref = (h) => /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i.test((h || '').trim()) ? h.trim() : null
const safeSrc = (h) => /^(https:\/\/|\/uploads\/)/i.test((h || '').trim()) ? h.trim() : null

function ser(n) {
  if (n.nodeType === 3) return esc(n.nodeValue)
  if (n.nodeType !== 1) return ''
  let tag = n.tagName
  if (DROP.has(tag)) return ''
  if ((tag === 'B' || tag === 'STRONG') && /normal/.test(n.style?.fontWeight || '')) tag = 'SPAN' // Google Docs wrapper
  tag = MAP[tag] || tag
  const inner = Array.from(n.childNodes).map(ser).join('')
  if (!KEEP.has(tag)) return inner
  const t = tag.toLowerCase()
  if (t === 'br' || t === 'hr') return `<${t}>`
  if (t === 'a') { const h = safeHref(n.getAttribute('href')); return h ? `<a href="${esc(h)}">${inner}</a>` : inner }
  if (t === 'img') { const s = safeSrc(n.getAttribute('src')); return s ? `<img src="${esc(s)}" alt="${esc(n.getAttribute('alt') || '')}">` : '' }
  return `<${t}>${inner}</${t}>`
}
export function cleanHtml(html) {
  const doc = new DOMParser().parseFromString(html, 'text/html') // inert: nothing runs
  return Array.from(doc.body.childNodes).map(ser).join('')
}
export const escapeHtml = esc
