import { useEffect } from 'react'

// Sets the page title, description and canonical link while a page is on screen, then puts the defaults back.
// (Crawlers get the same values from the server, see server/api/page.php.)
export function usePageMeta({ title, description, canonical, image, noindex }) {
  useEffect(() => {
    if (!title) return
    const prevTitle = document.title
    const touched = []
    const setMeta = (sel, attrs, content) => {
      let el = document.head.querySelector(sel); const created = !el
      if (!el) { el = document.createElement(sel.startsWith('link') ? 'link' : 'meta'); Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v)); document.head.appendChild(el) }
      const key = sel.startsWith('link') ? 'href' : 'content'
      const old = el.getAttribute(key)
      el.setAttribute(key, content)
      touched.push(() => { if (created) el.remove(); else if (old === null) el.removeAttribute(key); else el.setAttribute(key, old) })
    }
    document.title = title
    if (description) { setMeta('meta[name="description"]', { name: 'description' }, description); setMeta('meta[property="og:description"]', { property: 'og:description' }, description) }
    setMeta('meta[property="og:title"]', { property: 'og:title' }, title)
    if (canonical) { setMeta('link[rel="canonical"]', { rel: 'canonical' }, canonical); setMeta('meta[property="og:url"]', { property: 'og:url' }, canonical) }
    if (image) setMeta('meta[property="og:image"]', { property: 'og:image' }, image)
    if (noindex) setMeta('meta[name="robots"]', { name: 'robots' }, 'noindex,nofollow')
    return () => { document.title = prevTitle; touched.forEach(f => f()) }
  }, [title, description, canonical, image, noindex])
}
