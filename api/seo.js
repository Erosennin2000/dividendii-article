// Serves /learn and /learn/<slug> with real titles, descriptions, canonical links, Open Graph tags,
// Article structured data and the article text already in the HTML, so Google and social apps can read it.
// Runs on Vercel's free tier. Reads articles from the article API; never touches the database directly.

const API_BASE = (process.env.DVD_API_BASE || 'https://api.dividendii.com').replace(/\/$/, '')
const SITE_URL = (process.env.DVD_SITE_URL || 'https://dividendii.com').replace(/\/$/, '')
const SITE_NAME = process.env.DVD_SITE_NAME || 'Dividendii'

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;')
const ld = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')
const longDate = (iso) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })

async function getJson(path) {
  const r = await fetch(API_BASE + path, { headers: { accept: 'application/json' }, signal: AbortSignal.timeout(8000) })
  let body = null
  try { body = await r.json() } catch { /* not json */ }
  return { status: r.status, body }
}

// The page shell is the site's own built index.html, served as a static file.
async function getShell(req) {
  const host = String(req.headers['x-forwarded-host'] || req.headers.host || '').toLowerCase()
  const trusted = /^([a-z0-9-]+\.)*(dividendii\.com|vercel\.app)$/.test(host)
  const origin = process.env.DVD_SHELL_ORIGIN || (trusted ? 'https://' + host : SITE_URL)
  const r = await fetch(origin + '/index.html', { signal: AbortSignal.timeout(8000) })
  if (!r.ok) throw new Error('shell ' + r.status)
  return r.text()
}

function render(shell, { title, desc, canonical, robots, extraHead, bodyHtml }) {
  const head = `<title>${esc(title)}</title>\n<meta name="description" content="${esc(desc)}" />\n<meta name="robots" content="${esc(robots)}" />\n`
    + (canonical ? `<link rel="canonical" href="${esc(canonical)}" />\n` : '') + (extraHead || '')
  let out = shell.replace(/<title>[\s\S]*?<\/title>/i, '')
  const i = out.toLowerCase().indexOf('</head>')
  if (i !== -1) out = out.slice(0, i) + head + out.slice(i)
  return out.replace('<div id="root"></div>', () => `<div id="root">${bodyHtml || ''}</div>`)
}

export default async function handler(req, res) {
  const type = req.query.type === 'article' ? 'article' : 'learn'
  const slug = String(req.query.slug || '')
  let shell
  try { shell = await getShell(req) } catch {
    res.statusCode = 302; res.setHeader('Location', '/'); return res.end()
  }
  const send = (code, html, indexable, cache) => {
    res.statusCode = code
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    if (!indexable) res.setHeader('X-Robots-Tag', 'noindex, nofollow')
    res.setHeader('Cache-Control', cache)
    res.end(html)
  }
  const FRESH = 'public, max-age=0, s-maxage=30, stale-while-revalidate=30'
  try {
    if (type === 'article') {
      if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) throw Object.assign(new Error('nf'), { notFound: true })
      const { status, body } = await getJson('/api/v1/articles/' + encodeURIComponent(slug))
      if (status === 404) throw Object.assign(new Error('nf'), { notFound: true })
      if (status !== 200 || !body || !body.data) throw new Error('api ' + status)
      const a = body.data
      const url = `${SITE_URL}/learn/${a.slug}`
      const shortTitle = a.seo_title || a.title
      const desc = a.seo_description || a.excerpt
      const img = a.featured_image ? (a.featured_image.startsWith('/') ? SITE_URL + a.featured_image : a.featured_image) : ''
      const isOrg = new RegExp('team|editorial|' + SITE_NAME.replace(/[^a-z0-9]/gi, ''), 'i').test(a.author || '')
      const article = {
        '@context': 'https://schema.org', '@type': 'Article', headline: String(a.title).slice(0, 110), description: desc,
        author: { '@type': isOrg ? 'Organization' : 'Person', name: a.author },
        publisher: { '@type': 'Organization', name: SITE_NAME, url: SITE_URL },
        datePublished: a.published_at, dateModified: a.updated_at || a.published_at,
        mainEntityOfPage: { '@type': 'WebPage', '@id': url }, url, inLanguage: 'en-NG', articleSection: a.category,
        ...(img ? { image: [img] } : {}),
      }
      const crumbs = {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL + '/' },
          { '@type': 'ListItem', position: 2, name: 'Learn', item: SITE_URL + '/learn' },
          { '@type': 'ListItem', position: 3, name: a.title, item: url }],
      }
      const meta = (k, v, attr = 'property') => `<meta ${attr}="${k}" content="${esc(v)}" />\n`
      const extraHead = meta('og:type', 'article') + meta('og:site_name', SITE_NAME) + meta('og:title', shortTitle) + meta('og:description', desc) + meta('og:url', url)
        + (img ? meta('og:image', img) : '') + meta('article:published_time', a.published_at) + meta('article:modified_time', a.updated_at || a.published_at)
        + meta('article:section', a.category) + meta('twitter:card', img ? 'summary_large_image' : 'summary', 'name') + meta('twitter:title', shortTitle, 'name')
        + meta('twitter:description', desc, 'name') + (img ? meta('twitter:image', img, 'name') : '')
        + `<script type="application/ld+json">${ld(article)}</script>\n<script type="application/ld+json">${ld(crumbs)}</script>\n`
      const bodyHtml = `<article><p>${esc(a.category)}</p><h1>${esc(a.title)}</h1><p>By ${esc(a.author)} · ${esc(longDate(a.published_at))} · ${Number(a.reading_minutes) || 1} min read</p>`
        + (img ? `<img src="${esc(a.featured_image)}" alt="${esc(a.featured_image_alt)}" />` : '') + a.body_html + '</article>'
      return send(200, render(shell, { title: `${shortTitle} | ${SITE_NAME}`, desc, canonical: url, robots: 'index,follow', extraHead, bodyHtml }), true, FRESH)
    }

    const { status, body } = await getJson('/api/v1/articles')
    if (status !== 200 || !body || !Array.isArray(body.data)) throw new Error('api ' + status)
    const title = `Learn about shares, dividends and the Nigerian market | ${SITE_NAME}`
    const desc = 'Plain-English guides to owning shares, dividends, the Nigerian Exchange and how the market works, plus free dividend and bond tools.'
    const url = SITE_URL + '/learn'
    const list = '<h1>Learn about shares, dividends and the Nigerian market</h1><ul>'
      + body.data.map((r) => `<li><a href="/learn/${esc(r.slug)}">${esc(r.title)}</a> - ${esc(r.excerpt)}</li>`).join('') + '</ul>'
    const extraHead = '<meta property="og:type" content="website" />\n' + `<meta property="og:site_name" content="${esc(SITE_NAME)}" />\n`
      + `<meta property="og:title" content="${esc(title)}" />\n<meta property="og:description" content="${esc(desc)}" />\n<meta property="og:url" content="${esc(url)}" />\n<meta name="twitter:card" content="summary" />\n`
    return send(200, render(shell, { title, desc, canonical: url, robots: 'index,follow', extraHead, bodyHtml: list }), true, FRESH)
  } catch (e) {
    if (e && e.notFound) {
      const html = render(shell, { title: `Article not found | ${SITE_NAME}`, desc: 'This article is not available.', canonical: '', robots: 'noindex,nofollow', extraHead: '', bodyHtml: '' })
      return send(404, html, false, 'public, max-age=0, s-maxage=30')
    }
    // API unreachable: still show the normal site rather than an error page
    return send(200, shell, false, 'no-store')
  }
}
