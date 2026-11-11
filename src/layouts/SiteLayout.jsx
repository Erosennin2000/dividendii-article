import React, { useState } from 'react'
import { Link, NavLink, Outlet } from 'react-router-dom'
import { Logo, Toasts } from '../components/ui.jsx'
import { SITE } from '../site.js'

const waLink = SITE.whatsapp + '?text=' + encodeURIComponent('Hello Dividendii, I would like to check for unclaimed dividends.')

export default function SiteLayout() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  return (
    <div className="site">
      <div className="notice" role="region" aria-label="Important notice">
        <div className="wrap">
          <span>Dividendii staff will never ask for your PIN, OTP or card details, and never ask you to pay into an account that isn't in your own name.</span>
          <span><a href={waLink} target="_blank" rel="noopener noreferrer">WhatsApp us</a></span>
        </div>
      </div>
      <header>
        <div className="wrap">
          <Link className="brand" to="/" aria-label="Dividendii home" onClick={close}><Logo size={32} />Dividendii</Link>
          <nav className={'main' + (open ? ' open' : '')} aria-label="Main">
            <NavLink to="/check" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>Check my dividends</NavLink>
            <Link to={{ pathname: '/', hash: '#how' }} onClick={close}>How it works</Link>
            <NavLink to="/pricing" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>Pricing</NavLink>
            <NavLink to="/safety" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>Safety</NavLink>
            <NavLink to="/learn" className={({ isActive }) => isActive ? 'active' : ''} onClick={close}>Learn</NavLink>
          </nav>
          <div className="headcta"><a className="btn btn-g" href={waLink} target="_blank" rel="noopener noreferrer">Chat with us</a></div>
          <button className="menubtn" type="button" aria-expanded={open} aria-label="Menu" onClick={() => setOpen(o => !o)}>{open ? 'Close' : 'Menu'}</button>
        </div>
      </header>
      <main><Outlet /></main>
      <footer>
        <div className="wrap">
          <div className="fgrid">
            <div>
              <Link className="brand" to="/" style={{ color: '#fff' }}><Logo size={30} />Dividendii</Link>
              <p style={{ marginTop: 14, maxWidth: '22em' }}>Find and recover dividends you are owed on the Nigerian market. Investing is coming next.</p>
              <p style={{ marginTop: 14 }}>{SITE.address}<br /><a href={'tel:' + SITE.phoneTel}>{SITE.phone}</a><br /><a href={'mailto:' + SITE.email}>{SITE.email}</a><br /><span className="muted-on-dark">{SITE.hours}</span></p>
            </div>
            <div><h4>Dividends</h4><ul><li><Link to="/check">Check my dividends</Link></li><li><Link to={{ pathname: '/', hash: '#how' }}>How it works</Link></li><li><Link to="/pricing">Pricing</Link></li><li><Link to="/invest">Investing, coming soon</Link></li></ul></div>
            <div><h4>Trust</h4><ul><li><Link to="/safety">Safety</Link></li><li><Link to="/pricing">How we make money</Link></li><li><Link to={{ pathname: '/safety', hash: '#complaints' }}>Complaints</Link></li><li><Link to={{ pathname: '/safety', hash: '#fraud' }}>Report fraud</Link></li></ul></div>
            <div><h4>Learn</h4><ul><li><Link to="/learn">Guides</Link></li><li><Link to={{ pathname: '/learn', hash: '#bond' }}>Bond calculator</Link></li><li><Link to={{ pathname: '/', hash: '#faq' }}>Questions</Link></li></ul></div>
            <div><h4>Legal</h4><ul><li><Link to={{ pathname: '/legal', hash: '#terms' }}>Terms of use</Link></li><li><Link to={{ pathname: '/legal', hash: '#privacy' }}>Privacy notice</Link></li><li><Link to={{ pathname: '/legal', hash: '#risk' }}>Risk disclosure</Link></li><li><Link to={{ pathname: '/legal', hash: '#cookies' }}>Cookies</Link></li><li><Link to={{ pathname: '/legal', hash: '#complaints-policy' }}>Complaints policy</Link></li></ul></div>
          </div>
          <div className="disc">
            <p><strong>{SITE.legal}</strong>, {SITE.rc}. {SITE.legal} has applied to the Securities and Exchange Commission, Nigeria, to be registered as a digital sub-broker. The application is pending, and we are not yet registered. When investing opens, trades will be placed through a licensed broker.</p>
            <p>{SITE.brand} does not give investment advice. The value of investments can go down as well as up, and you may get back less than you put in. Read the risk disclosure before investing.</p>
            <p>Dividend recovery depends on registrar records, and amounts are not guaranteed. If we cannot resolve a complaint, you can take it to the SEC.</p>
            <p>© 2026 {SITE.legal}</p>
          </div>
        </div>
      </footer>
      <Toasts />
    </div>
  )
}
