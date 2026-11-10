import React, { useCallback, useEffect, useRef, useState } from 'react'
import { Link, Route, Routes, useNavigate, useParams } from 'react-router-dom'
import { adminApi, setCsrf, slugify, fmtLong } from '../../../api/articles.js'
import { Logo } from '../../../components/ui.jsx'
import { usePageMeta } from '../../../lib/pageMeta.js'
import { ArticleView } from '../../site/Article.jsx'
import RichEditor from './RichEditor.jsx'

const stateOf = (a) => a.status === 'published' ? (a.published_at && new Date(a.published_at) > new Date() ? 'scheduled' : 'published') : 'draft'
const PILL = { draft: ['grey', 'Draft'], published: ['good', 'Published'], scheduled: ['warn', 'Scheduled'] }
const toLocalInput = (iso) => { if (!iso) return ''; const d = new Date(iso); const p = (n) => String(n).padStart(2, '0'); return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}` }

export default function ArticlesAdmin() {
  usePageMeta({ title: 'Articles | Dividendii admin', noindex: true })
  const [auth, setAuth] = useState(undefined)
  const [expired, setExpired] = useState(false)
  useEffect(() => { adminApi.me().then(r => { if (r.data) { setCsrf(r.data.csrf); setAuth(r.data) } else setAuth(null) }).catch(e => setAuth({ error: e.message })) }, [])
  const onExpired = useCallback(() => { setExpired(true); setAuth(null) }, [])
  if (auth === undefined) return <div className="adm"><p className="muted" style={{ padding: 40 }}>Loading…</p></div>
  if (auth?.error) return <div className="adm"><div className="card" style={{ margin: 40 }}><h2>The article service is not available</h2><p className="muted" style={{ marginTop: 8 }}>{auth.error}</p><p className="muted small" style={{ marginTop: 8 }}>If you have not run the one-time setup yet, open <code>/api/install.php</code> on your website.</p></div></div>
  if (!auth) return <Login expired={expired} onDone={(d) => { setCsrf(d.csrf); setAuth(d); setExpired(false) }} />
  return (
    <div className="adm">
      <header className="adm-bar"><div className="adm-wrap">
        <Link to="/admin/articles" className="brand" style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, color: 'var(--ink)' }}><Logo size={28} />Articles</Link>
        <span className="muted small" style={{ marginLeft: 'auto' }}>{auth.email}</span>
        <Link className="btn btn-o btn-s" to="/learn" target="_blank">View Learn page</Link>
        <button className="btn btn-o btn-s" type="button" onClick={async () => { try { await adminApi.logout() } catch { /* ignore */ } setCsrf(''); setAuth(null) }}>Sign out</button>
      </div></header>
      <div className="adm-wrap adm-main">
        <Routes>
          <Route index element={<List onExpired={onExpired} />} />
          <Route path=":id" element={<Editor onExpired={onExpired} />} />
        </Routes>
      </div>
    </div>
  )
}

function Login({ onDone, expired }) {
  const [email, setEmail] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState(''), [busy, setBusy] = useState(false)
  const go = async (e) => {
    e.preventDefault(); setBusy(true); setErr('')
    try { const r = await adminApi.login(email, pw); onDone(r.data) } catch (x) { setErr(x.message) } finally { setBusy(false) }
  }
  return (
    <div className="adm adm-login"><form className="card" onSubmit={go} style={{ width: 'min(420px, 92vw)', margin: '12vh auto 0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontWeight: 700, fontSize: 20 }}><Logo size={30} />Article admin</div>
      <p className="muted" style={{ marginTop: 8 }}>{expired ? 'Your session ended. Please sign in again.' : 'Sign in to write and publish articles.'}</p>
      {err && <div className="alert bad" role="alert" style={{ marginTop: 14 }}>{err}</div>}
      <label className="lbl" htmlFor="em" style={{ marginTop: 16 }}>Email</label><input id="em" className="inp" type="email" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} required />
      <label className="lbl" htmlFor="pw" style={{ marginTop: 12 }}>Password</label><input id="pw" className="inp" type="password" autoComplete="current-password" value={pw} onChange={e => setPw(e.target.value)} required />
      <button className="btn btn-p btn-l btn-block" type="submit" disabled={busy} style={{ marginTop: 18 }}>{busy ? 'Signing in…' : 'Sign in'}</button>
    </form></div>
  )
}

function List({ onExpired }) {
  const [items, setItems] = useState(null), [tab, setTab] = useState('all'), [err, setErr] = useState('')
  useEffect(() => { adminApi.list().then(r => setItems(r.data)).catch(e => { if (e.status === 401) onExpired(); else setErr(e.message) }) }, [])
  if (err) return <div className="alert bad">{err}</div>
  if (!items) return <p className="muted">Loading…</p>
  const shown = items.filter(a => tab === 'all' || (tab === 'draft' ? a.status === 'draft' : a.status === 'published'))
  const count = (t) => items.filter(a => t === 'all' || (t === 'draft' ? a.status === 'draft' : a.status === 'published')).length
  return (
    <>
      <div className="row" style={{ flexWrap: 'wrap', marginBottom: 18 }}>
        <div><h1 style={{ fontSize: 28 }}>Articles</h1><p className="muted" style={{ marginTop: 4 }}>Write, preview and publish articles for the Learn page.</p></div>
        <Link className="btn btn-p" to="/admin/articles/new">+ New article</Link>
      </div>
      <div className="seg" style={{ maxWidth: 420, marginBottom: 14 }} role="tablist">{[['all', 'All'], ['draft', 'Drafts'], ['published', 'Published']].map(([v, l]) => <button key={v} type="button" role="tab" aria-selected={tab === v} className={tab === v ? 'on' : ''} onClick={() => setTab(v)}>{l} ({count(v)})</button>)}</div>
      <div className="card tight"><div className="scroll"><table className="tbl"><thead><tr><th>Title</th><th>Category</th><th>Status</th><th>Last edited</th><th></th></tr></thead><tbody>
        {shown.map(a => { const s = stateOf(a); return <tr key={a.id}><td><Link to={'/admin/articles/' + a.id}><strong>{a.title}</strong></Link><div className="muted xs">/learn/{a.slug}</div></td><td>{a.category || '—'}</td><td><span className={'pill ' + PILL[s][0]}>{PILL[s][1]}</span>{s !== 'draft' && a.published_at && <div className="muted xs">{fmtLong(a.published_at)}</div>}</td><td className="muted">{fmtLong(a.updated_at)}</td><td style={{ textAlign: 'right' }}><Link className="btn btn-o btn-s" to={'/admin/articles/' + a.id}>Edit</Link>{s === 'published' && <> <a className="btn btn-o btn-s" href={'/learn/' + a.slug} target="_blank" rel="noreferrer">View</a></>}</td></tr> })}
        {!shown.length && <tr><td colSpan="5" className="muted" style={{ textAlign: 'center', padding: 28 }}>Nothing here yet.</td></tr>}
      </tbody></table></div></div>
    </>
  )
}

const BLANK = { title: '', slug: '', excerpt: '', body_html: '', featured_image: '', featured_image_alt: '', author: '', category: '', seo_title: '', seo_description: '', date: '' }

function Editor({ onExpired }) {
  const { id: idParam } = useParams()
  const nav = useNavigate()
  const isNew = idParam === 'new'
  const [f, setF] = useState(BLANK)
  const [meta, setMeta] = useState({ id: null, status: 'draft' })
  const [cats, setCats] = useState([])
  const [loaded, setLoaded] = useState(isNew)
  const [ver, setVer] = useState(0)       // bumps to remount the body editor when content is loaded
  const [notice, setNotice] = useState(null)
  const [fields, setFields] = useState({})
  const [busy, setBusy] = useState('')
  const [dirty, setDirty] = useState(false)
  const [preview, setPreview] = useState(null)
  const [confirmUn, setConfirmUn] = useState(false)
  const slugTouched = useRef(false)
  const imgInput = useRef(null)

  const fill = (a) => { setF({ title: a.title, slug: a.slug, excerpt: a.excerpt, body_html: a.body_html, featured_image: a.featured_image, featured_image_alt: a.featured_image_alt, author: a.author, category: a.category, seo_title: a.seo_title, seo_description: a.seo_description, date: toLocalInput(a.published_at) }); setMeta({ id: a.id, status: a.status }) }
  useEffect(() => {
    if (isNew) { setF(BLANK); setMeta({ id: null, status: 'draft' }); slugTouched.current = false; setLoaded(true); setVer(v => v + 1); adminApi.list().then(r => setCats(r.categories)).catch(() => {}); return }
    if (meta.id === Number(idParam)) return // just created: already on screen
    setLoaded(false)
    adminApi.get(idParam).then(r => { fill(r.data); slugTouched.current = true; setLoaded(true); setVer(v => v + 1); setDirty(false) }).catch(e => { if (e.status === 401) onExpired(); else setNotice({ kind: 'bad', text: e.message }) })
    adminApi.list().then(r => setCats(r.categories)).catch(() => {})
  }, [idParam])
  useEffect(() => { const h = (e) => { if (dirty) { e.preventDefault(); e.returnValue = '' } }; window.addEventListener('beforeunload', h); return () => window.removeEventListener('beforeunload', h) }, [dirty])

  const set = (k, v) => { setF(p => ({ ...p, [k]: v })); setDirty(true); setFields(p => ({ ...p, [k]: undefined })) }
  const onTitle = (v) => { setF(p => ({ ...p, title: v, slug: !slugTouched.current && meta.status !== 'published' ? slugify(v) : p.slug })); setDirty(true); setFields(p => ({ ...p, title: undefined })) }

  const payload = () => ({ ...f, published_at: f.date ? new Date(f.date).toISOString() : null })
  const fail = (e) => { if (e.status === 401) { onExpired(); return } setFields(e.fields || {}); setNotice({ kind: 'bad', text: e.message }); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const persist = async () => {
    const r = meta.id ? await adminApi.update(meta.id, payload()) : await adminApi.create(payload())
    const a = r.data; setMeta({ id: a.id, status: a.status }); setF(p => ({ ...p, slug: a.slug, body_html: a.body_html, date: toLocalInput(a.published_at) })); setDirty(false); setFields({})
    if (!meta.id) nav('/admin/articles/' + a.id, { replace: true })
    return a
  }
  const run = async (kind, fn, okText) => { setBusy(kind); setNotice(null); try { const a = await fn(); if (okText) setNotice({ kind: 'good', text: okText }); return a } catch (e) { fail(e) } finally { setBusy('') } }

  const save = () => run('save', persist, meta.status === 'published' ? 'Changes saved and live.' : 'Draft saved.')
  const doPreview = async () => { const a = await run('preview', persist); if (a) { setPreview(a); window.scrollTo(0, 0) } }
  const publish = () => run('publish', async () => { const a = await persist(); const r = await adminApi.publish(a.id); setMeta({ id: r.data.id, status: r.data.status }); setF(p => ({ ...p, date: toLocalInput(r.data.published_at) })); return r.data }, f.date && new Date(f.date) > new Date() ? 'Scheduled. It will appear on its publication date.' : 'Published. It is now live on your Learn page.')
  const unpublish = () => run('unpublish', async () => { const r = await adminApi.unpublish(meta.id); setMeta({ id: r.data.id, status: 'draft' }); setConfirmUn(false); return r.data }, 'Unpublished. It is now a draft and no longer public.')
  useEffect(() => { const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); if (!busy) save() } }; window.addEventListener('keydown', h); return () => window.removeEventListener('keydown', h) })

  const uploadImg = async (file) => { const r = await adminApi.upload(file); return r.data.url }
  const pickFeatured = async (e) => { const file = e.target.files?.[0]; e.target.value = ''; if (!file) return; setBusy('img'); try { set('featured_image', await uploadImg(file)) } catch (x) { if (x.status === 401) onExpired(); else setNotice({ kind: 'bad', text: x.message }) } finally { setBusy('') } }

  if (!loaded) return <p className="muted">{notice ? '' : 'Loading…'}{notice && <span className="alert bad">{notice.text}</span>}</p>
  const live = meta.status === 'published'
  const future = f.date && new Date(f.date) > new Date()
  const err = (k) => fields[k] ? <div className="ferr" role="alert">{fields[k]}</div> : null
  const url = `${window.location.host}/learn/${f.slug || 'your-article-url'}`
  const seoT = (f.seo_title || f.title || 'Article title') + ' | Dividendii'
  const seoD = f.seo_description || f.excerpt || 'Add a short description so people know what the article covers.'

  if (preview) return (
    <div>
      <div className="alert warn row" style={{ position: 'sticky', top: 56, zIndex: 5, flexWrap: 'wrap' }}><span><strong>Preview.</strong> {live ? 'This is how the live article looks.' : 'This article is a draft and is not visible to the public.'}</span><button className="btn btn-p btn-s" type="button" onClick={() => setPreview(null)}>← Back to editing</button></div>
      <div className="site" style={{ background: 'var(--paper)', marginTop: 12, borderRadius: 12, overflow: 'hidden' }}><ArticleView a={{ ...preview, published_at: preview.published_at || new Date().toISOString() }} preview /></div>
    </div>
  )
  return (
    <>
      <div className="row" style={{ flexWrap: 'wrap', marginBottom: 14 }}><div><Link to="/admin/articles" className="small">← All articles</Link><h1 style={{ fontSize: 26, marginTop: 4 }}>{isNew && !meta.id ? 'New article' : 'Edit article'}</h1></div><span className={'pill ' + PILL[live ? (future ? 'scheduled' : 'published') : 'draft'][0]}>{PILL[live ? (future ? 'scheduled' : 'published') : 'draft'][1]}</span></div>
      {notice && <div className={'alert ' + notice.kind} role={notice.kind === 'bad' ? 'alert' : 'status'} style={{ marginBottom: 14 }}>{notice.text}</div>}
      <div className="adm-grid">
        <div className="stack" style={{ gap: 16 }}>
          <div className="card">
            <label className="lbl" htmlFor="t">Title</label><input id="t" className="inp" style={{ fontSize: 20, fontWeight: 600 }} value={f.title} onChange={e => onTitle(e.target.value)} placeholder="e.g. What is a dividend?" maxLength={200} />{err('title')}
            <label className="lbl" htmlFor="s" style={{ marginTop: 14 }}>Web address (URL slug)</label>
            <input id="s" className="inp" value={f.slug} onChange={e => { slugTouched.current = true; set('slug', slugify(e.target.value)) }} placeholder="what-is-a-dividend" />
            <div className="muted xs" style={{ marginTop: 6 }}>{url}{!slugTouched.current && !live ? ' · suggested from the title, you can edit it' : ''}</div>{err('slug')}
            {live && <div className="muted xs" style={{ marginTop: 4, color: 'var(--warn)' }}>This article is live. Changing the URL will break links people already have.</div>}
            <label className="lbl" htmlFor="x" style={{ marginTop: 14 }}>Excerpt <span className="muted">({f.excerpt.length}/400)</span></label>
            <textarea id="x" className="inp" rows={3} maxLength={400} value={f.excerpt} onChange={e => set('excerpt', e.target.value)} placeholder="One or two sentences shown on the article card and under the title." />{err('excerpt')}
          </div>
          <div className="card">
            <label className="lbl">Article</label>
            <RichEditor key={ver} initialHtml={f.body_html} onChange={h => { setF(p => ({ ...p, body_html: h })); setDirty(true); setFields(p => ({ ...p, body_html: undefined })) }} upload={uploadImg} onError={t => setNotice({ kind: 'bad', text: t })} />
            {err('body_html')}
            <div className="muted xs" style={{ marginTop: 8 }}>Tip: use "Heading" for sections. Three or more headings create a table of contents automatically.</div>
          </div>
        </div>
        <div className="stack" style={{ gap: 16 }}>
          <div className="card">
            <h2 style={{ fontSize: 16 }}>Publish</h2>
            <label className="lbl" htmlFor="d" style={{ marginTop: 12 }}>Publication date <span className="muted">(optional)</span></label>
            <input id="d" className="inp" type="datetime-local" value={f.date} onChange={e => set('date', e.target.value)} />
            <div className="muted xs" style={{ marginTop: 6 }}>Leave empty to use the moment you publish. A future date schedules the article.</div>
            <div className="stack" style={{ gap: 10, marginTop: 16 }}>
              <button className="btn btn-o btn-block" type="button" disabled={!!busy} onClick={save}>{busy === 'save' ? 'Saving…' : live ? 'Save changes' : 'Save draft'}</button>
              <button className="btn btn-o btn-block" type="button" disabled={!!busy} onClick={doPreview}>{busy === 'preview' ? 'Preparing…' : 'Preview'}</button>
              {!live && <button className="btn btn-p btn-block" type="button" disabled={!!busy} onClick={publish}>{busy === 'publish' ? 'Publishing…' : future ? 'Schedule' : 'Publish'}</button>}
              {live && !confirmUn && <button className="btn btn-d btn-block" type="button" disabled={!!busy} onClick={() => setConfirmUn(true)}>Unpublish</button>}
              {live && confirmUn && <div className="alert warn">Take this article off the public site? <div style={{ display: 'flex', gap: 8, marginTop: 8 }}><button className="btn btn-d btn-s" type="button" onClick={unpublish} disabled={!!busy}>Yes, unpublish</button><button className="btn btn-o btn-s" type="button" onClick={() => setConfirmUn(false)}>Cancel</button></div></div>}
            </div>
            {dirty && <div className="muted xs" style={{ marginTop: 10 }}>You have unsaved changes. (Ctrl+S saves)</div>}
          </div>
          <div className="card">
            <h2 style={{ fontSize: 16 }}>Featured image</h2>
            {f.featured_image ? <div style={{ marginTop: 10 }}><img src={f.featured_image} alt="" style={{ width: '100%', borderRadius: 8, display: 'block' }} /><label className="lbl" htmlFor="ia" style={{ marginTop: 10 }}>Image description</label><input id="ia" className="inp" value={f.featured_image_alt} onChange={e => set('featured_image_alt', e.target.value)} placeholder="Describe the image in a few words" maxLength={200} /><div style={{ display: 'flex', gap: 8, marginTop: 10 }}><button className="btn btn-o btn-s" type="button" onClick={() => imgInput.current.click()}>Replace</button><button className="btn btn-d btn-s" type="button" onClick={() => { set('featured_image', ''); set('featured_image_alt', '') }}>Remove</button></div></div>
              : <button className="btn btn-o btn-block" type="button" style={{ marginTop: 10 }} disabled={busy === 'img'} onClick={() => imgInput.current.click()}>{busy === 'img' ? 'Uploading…' : 'Upload image'}</button>}
            {err('featured_image')}
            <input ref={imgInput} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={pickFeatured} />
            <div className="muted xs" style={{ marginTop: 8 }}>JPG, PNG or WebP, up to 6 MB. 1200 × 630 px works well for sharing.</div>
          </div>
          <div className="card">
            <h2 style={{ fontSize: 16 }}>Details</h2>
            <label className="lbl" htmlFor="c" style={{ marginTop: 12 }}>Category</label><input id="c" className="inp" list="cats" value={f.category} onChange={e => set('category', e.target.value)} maxLength={60} placeholder="Choose or type a new one" /><datalist id="cats">{cats.map(c => <option key={c} value={c} />)}</datalist>
            <label className="lbl" htmlFor="a" style={{ marginTop: 12 }}>Author</label><input id="a" className="inp" value={f.author} onChange={e => set('author', e.target.value)} maxLength={120} placeholder="Dividendii Team" />
          </div>
          <div className="card">
            <h2 style={{ fontSize: 16 }}>Search appearance (SEO)</h2>
            <div className="serp" aria-label="Search result preview"><div className="serp-t">{seoT.slice(0, 62)}{seoT.length > 62 ? '…' : ''}</div><div className="serp-u">{url}</div><div className="serp-d">{seoD.slice(0, 158)}{seoD.length > 158 ? '…' : ''}</div></div>
            <label className="lbl" htmlFor="st" style={{ marginTop: 12 }}>SEO title <span className="muted">({f.seo_title.length}/60 ideal)</span></label><input id="st" className="inp" value={f.seo_title} onChange={e => set('seo_title', e.target.value)} maxLength={120} placeholder="Leave empty to use the article title" />
            <label className="lbl" htmlFor="sd" style={{ marginTop: 12 }}>SEO description <span className="muted">({f.seo_description.length}/155 ideal)</span></label><textarea id="sd" className="inp" rows={3} value={f.seo_description} onChange={e => set('seo_description', e.target.value)} maxLength={255} placeholder="Leave empty to use the excerpt" />
          </div>
        </div>
      </div>
    </>
  )
}
