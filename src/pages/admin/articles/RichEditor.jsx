import React, { useEffect, useRef, useState } from 'react'
import { cleanHtml, escapeHtml } from './clean.js'

const FORMATS = [['p', 'Paragraph'], ['h2', 'Heading'], ['h3', 'Subheading'], ['blockquote', 'Quote']]

export default function RichEditor({ initialHtml, onChange, upload, onError }) {
  const ref = useRef(null), sel = useRef(null), file = useRef(null)
  const [fmt, setFmt] = useState('p')
  const [on, setOn] = useState({})
  const [link, setLink] = useState(null)   // { url }
  const [img, setImg] = useState(null)     // { url, alt }
  const [busy, setBusy] = useState(false)

  useEffect(() => { ref.current.innerHTML = initialHtml || ''; try { document.execCommand('defaultParagraphSeparator', false, 'p') } catch { /* ignore */ } }, [])
  useEffect(() => {
    const h = () => {
      if (!ref.current || !ref.current.contains(document.getSelection()?.anchorNode)) return
      try { const v = (document.queryCommandValue('formatBlock') || 'p').replace(/[<>]/g, '').toLowerCase(); setFmt(FORMATS.some(f => f[0] === v) ? v : 'p'); setOn({ b: document.queryCommandState('bold'), i: document.queryCommandState('italic'), ul: document.queryCommandState('insertUnorderedList'), ol: document.queryCommandState('insertOrderedList') }) } catch { /* ignore */ }
    }
    document.addEventListener('selectionchange', h); return () => document.removeEventListener('selectionchange', h)
  }, [])

  const emit = () => onChange(ref.current.innerHTML)
  const saveSel = () => { const s = document.getSelection(); if (s && s.rangeCount && ref.current.contains(s.anchorNode)) sel.current = s.getRangeAt(0).cloneRange() }
  const restore = () => { ref.current.focus(); if (sel.current) { const s = document.getSelection(); s.removeAllRanges(); s.addRange(sel.current) } }
  const exec = (cmd, val) => { ref.current.focus(); document.execCommand(cmd, false, val); emit() }
  const tb = (label, title, active, fn, extra) => <button type="button" className={'tb' + (active ? ' on' : '')} title={title} aria-label={title} aria-pressed={!!active} onMouseDown={e => e.preventDefault()} onClick={fn} {...extra}>{label}</button>

  const onPaste = (e) => {
    e.preventDefault()
    const html = e.clipboardData.getData('text/html'), text = e.clipboardData.getData('text/plain')
    if (html) document.execCommand('insertHTML', false, cleanHtml(html))
    else document.execCommand('insertText', false, text)
    emit()
  }
  const openLink = () => { saveSel(); const a = document.getSelection()?.anchorNode?.parentElement?.closest('a'); setLink({ url: a ? a.getAttribute('href') : '' }) }
  const applyLink = () => {
    restore(); const url = link.url.trim()
    if (!url) { exec('unlink'); setLink(null); return }
    const href = /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) ? url : 'https://' + url
    if (document.getSelection().isCollapsed) exec('insertHTML', `<a href="${escapeHtml(href)}">${escapeHtml(url)}</a>`)
    else exec('createLink', href)
    setLink(null)
  }
  const chooseFile = async (e) => {
    const f = e.target.files?.[0]; e.target.value = ''; if (!f) return
    setBusy(true)
    try { const url = await upload(f); setImg({ url, alt: '' }) } catch (err) { onError?.(err.message) } finally { setBusy(false) }
  }
  const insertImg = () => { restore(); exec('insertHTML', `<img src="${escapeHtml(img.url)}" alt="${escapeHtml(img.alt)}">`); setImg(null) }

  return (
    <div className="rte">
      <div className="rte-bar" role="toolbar" aria-label="Formatting">
        <select className="tb-sel" aria-label="Text style" value={fmt} onChange={e => exec('formatBlock', '<' + e.target.value + '>')}>{FORMATS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        {tb(<b>B</b>, 'Bold', on.b, () => exec('bold'))}
        {tb(<i>I</i>, 'Italic', on.i, () => exec('italic'))}
        {tb('• List', 'Bulleted list', on.ul, () => exec('insertUnorderedList'))}
        {tb('1. List', 'Numbered list', on.ol, () => exec('insertOrderedList'))}
        {tb('Link', 'Add or edit link (Ctrl+K)', false, openLink)}
        {tb(busy ? 'Uploading…' : 'Image', 'Insert image', false, () => { saveSel(); file.current.click() }, { disabled: busy })}
        {tb('Clear', 'Remove formatting', false, () => exec('removeFormat'))}
        {tb('↶', 'Undo', false, () => exec('undo'))}
        {tb('↷', 'Redo', false, () => exec('redo'))}
        <input ref={file} type="file" accept="image/jpeg,image/png,image/webp,image/gif" hidden onChange={chooseFile} />
      </div>
      {link && <div className="rte-pop"><label className="sr" htmlFor="rte-url">Link address</label><input id="rte-url" className="inp" autoFocus placeholder="https://… or /learn/another-article" value={link.url} onChange={e => setLink({ url: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); applyLink() } if (e.key === 'Escape') setLink(null) }} /><button type="button" className="btn btn-p btn-s" onClick={applyLink}>{link.url ? 'Apply' : 'Remove link'}</button><button type="button" className="btn btn-o btn-s" onClick={() => setLink(null)}>Cancel</button></div>}
      {img && <div className="rte-pop"><img src={img.url} alt="" style={{ height: 44, borderRadius: 6 }} /><label className="sr" htmlFor="rte-alt">Image description</label><input id="rte-alt" className="inp" autoFocus placeholder="Describe the image for people using screen readers" value={img.alt} onChange={e => setImg({ ...img, alt: e.target.value })} onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); insertImg() } }} /><button type="button" className="btn btn-p btn-s" onClick={insertImg}>Insert image</button><button type="button" className="btn btn-o btn-s" onClick={() => setImg(null)}>Cancel</button></div>}
      <div ref={ref} className="prose rte-surface" contentEditable suppressContentEditableWarning role="textbox" aria-multiline="true" aria-label="Article body" data-placeholder="Start writing your article…"
        onInput={emit} onPaste={onPaste} onBlur={emit}
        onKeyDown={e => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openLink() } }} />
    </div>
  )
}
