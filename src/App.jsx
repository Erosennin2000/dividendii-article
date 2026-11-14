import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './store/store.jsx'
import SiteLayout from './layouts/SiteLayout.jsx'
import AdminShell from './layouts/AdminShell.jsx'
import Home from './pages/site/Home.jsx'
import Check from './pages/site/Check.jsx'
import Invest from './pages/site/Invest.jsx'
import Pricing from './pages/site/Pricing.jsx'
import Safety from './pages/site/Safety.jsx'
import Learn from './pages/site/Learn.jsx'
import Article from './pages/site/Article.jsx'
import SignIn from './pages/auth/SignIn.jsx'
import SignUp from './pages/auth/SignUp.jsx'
import Overview from './pages/admin/Overview.jsx'
import OrderDesk from './pages/admin/OrderDesk.jsx'
import Users from './pages/admin/Users.jsx'
import Claims from './pages/admin/Claims.jsx'
import Compliance from './pages/admin/Compliance.jsx'
import AdminSettings from './pages/admin/Settings.jsx'
import Products from './pages/admin/Products.jsx'
import Requests from './pages/admin/Requests.jsx'
import Treasury from './pages/admin/Treasury.jsx'
import Content from './pages/admin/Content.jsx'
import Staff from './pages/admin/Staff.jsx'
import Reports from './pages/admin/Reports.jsx'
import Integrations from './pages/admin/Integrations.jsx'
import Customer from './pages/admin/Customer.jsx'
import Audit from './pages/admin/Audit.jsx'
import { can } from './data/catalog.js'
import { LENDING_ENABLED, DEMO_ENABLED, ACCOUNT_DEMO } from './features.js'
import AccountGate from './components/AccountGate.jsx'
import Legal from './pages/site/Legal.jsx'
import { publicApi } from './api/articles.js'

// Lending screens are loaded only when the switch is on, so with it off they are not in the shipped bundle at all.
const lazyIf = (load) => (LENDING_ENABLED ? React.lazy(load) : () => null)
const Borrow = lazyIf(() => import('./pages/site/Borrow.jsx'))
const LendShell = lazyIf(() => import('./layouts/LendShell.jsx'))
const LendDashboard = lazyIf(() => import('./pages/lend/Dashboard.jsx'))
const Start = lazyIf(() => import('./pages/lend/Start.jsx'))
const Build = lazyIf(() => import('./pages/lend/Build.jsx'))
const Review = lazyIf(() => import('./pages/lend/Review.jsx'))
const Documents = lazyIf(() => import('./pages/lend/Documents.jsx'))
const LendLearn = lazyIf(() => import('./pages/lend/Learn.jsx'))
const ArticlesAdmin = React.lazy(() => import('./pages/admin/articles/ArticlesAdmin.jsx'))
// The investing demo loads only when someone opens it.
const AppShell = React.lazy(() => import('./layouts/AppShell.jsx'))
const Dashboard = React.lazy(() => import('./pages/app/Dashboard.jsx'))
const Markets = React.lazy(() => import('./pages/app/Markets.jsx'))
const Stock = React.lazy(() => import('./pages/app/Stock.jsx'))
const Equities = React.lazy(() => import('./pages/app/Equities.jsx'))
const Trade = React.lazy(() => import('./pages/app/Trade.jsx'))
const Funds = React.lazy(() => import('./pages/app/Funds.jsx'))
const FundDetail = React.lazy(() => import('./pages/app/FundDetail.jsx'))
const Offers = React.lazy(() => import('./pages/app/Offers.jsx'))
const OfferDetail = React.lazy(() => import('./pages/app/OfferDetail.jsx'))
const Insurance = React.lazy(() => import('./pages/app/Insurance.jsx'))
const Trusts = React.lazy(() => import('./pages/app/Trusts.jsx'))
const Services = React.lazy(() => import('./pages/app/Services.jsx'))
const Orders = React.lazy(() => import('./pages/app/Orders.jsx'))
const FixedIncome = React.lazy(() => import('./pages/app/FixedIncome.jsx'))
const Dividends = React.lazy(() => import('./pages/app/Dividends.jsx'))
const Funding = React.lazy(() => import('./pages/app/Funding.jsx'))
const Settings = React.lazy(() => import('./pages/app/Settings.jsx'))
const Support = React.lazy(() => import('./pages/app/Support.jsx'))
const Notifications = React.lazy(() => import('./pages/app/Notifications.jsx'))
const Lending = lazyIf(() => import('./pages/admin/Lending.jsx'))

function RequireAuth({ children, admin }) {
  const { state } = useStore()
  const loc = useLocation()
  if (!state.auth.signedIn) return <Navigate to={`/signin?${admin ? 'staff=1&' : ''}next=${encodeURIComponent(loc.pathname)}`} replace />
  if (admin && !state.auth.admin) return <Navigate to={`/signin?staff=1&next=${encodeURIComponent(loc.pathname)}`} replace />
  return children
}

function Perm({ area, children }) {
  const { state } = useStore()
  const role = state.auth.role || 'Super admin'
  if (can(role, area)) return children
  return <div className="content"><div className="card"><h2>Not available for your role</h2><p className="muted" style={{ marginTop: 8 }}>You are signed in as {role}. Ask a Super admin if you need access to this area.</p></div></div>
}

function ScrollTop() {
  const { pathname, hash } = useLocation()
  React.useEffect(() => {
    if (hash) { const t = setTimeout(() => { const el = document.getElementById(decodeURIComponent(hash.slice(1))); if (el) el.scrollIntoView(); else window.scrollTo(0, 0) }, 60); return () => clearTimeout(t) }
    window.scrollTo(0, 0)
  }, [pathname, hash])
  // Cookie-free visit count: one small request per page view, no cookie and no personal data.
  React.useEffect(() => { if (!pathname.startsWith('/admin')) publicApi.hit(pathname) }, [pathname])
  return null
}

export function AppRoutes() {
  return (
    <>
        <ScrollTop />
        <React.Suspense fallback={null}>
        <Routes>
          <Route element={<SiteLayout />}>
            <Route path="/" element={<Home />} />
            <Route path="/check" element={<Check />} />
            <Route path="/invest" element={<Invest />} />
            {LENDING_ENABLED ? <Route path="/borrow" element={<Borrow />} /> : <Route path="/borrow" element={<Navigate to="/" replace />} />}
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/safety" element={<Safety />} />
            <Route path="/learn" element={<Learn />} />
            <Route path="/learn/:slug" element={<Article />} />
            <Route path="/legal" element={<Legal />} />
          </Route>
          {!DEMO_ENABLED && <Route path="/signin" element={<Navigate to="/" replace />} />}
          {!DEMO_ENABLED && <Route path="/signup" element={<Navigate to="/check" replace />} />}
          {DEMO_ENABLED && <Route path="/signin" element={<SignIn />} />}
          {DEMO_ENABLED && <Route path="/signup" element={<SignUp />} />}
          <Route path="/app" element={DEMO_ENABLED ? <RequireAuth><AppShell /></RequireAuth> : ACCOUNT_DEMO ? <AccountGate><AppShell account /></AccountGate> : <Navigate to="/" replace />}>
            <Route index element={<Dashboard />} />
            <Route path="markets" element={<Markets />} />
            <Route path="stock/:ticker" element={<Stock />} />
            <Route path="equities" element={<Equities />} />
            <Route path="trade/:ticker" element={<Trade />} />
            <Route path="funds" element={<Funds />} />
            <Route path="funds/:id" element={<FundDetail />} />
            <Route path="offers" element={<Offers />} />
            <Route path="offers/:id" element={<OfferDetail />} />
            <Route path="insurance" element={<Insurance />} />
            <Route path="trusts" element={<Trusts />} />
            <Route path="services" element={<Services />} />
            <Route path="orders" element={<Orders />} />
            <Route path="fixed-income" element={<FixedIncome />} />
            <Route path="dividends" element={<Dividends />} />
            <Route path="funding" element={<Funding />} />
            <Route path="settings" element={<Settings />} />
            <Route path="support" element={<Support />} />
            <Route path="notifications" element={<Notifications />} />
          </Route>
          {!LENDING_ENABLED && <Route path="/lend/*" element={<Navigate to={DEMO_ENABLED || ACCOUNT_DEMO ? '/app' : '/'} replace />} />}
          {LENDING_ENABLED && <Route path="/lend" element={<RequireAuth><LendShell /></RequireAuth>}>
            <Route index element={<LendDashboard />} />
            <Route path="start" element={<Start />} />
            <Route path="build" element={<Build />} />
            <Route path="review" element={<Review />} />
            <Route path="documents" element={<Documents />} />
            <Route path="learn" element={<LendLearn />} />
          </Route>}
          <Route path="/admin/articles/*" element={<ArticlesAdmin />} />
          {!DEMO_ENABLED && <Route path="/admin/*" element={<Navigate to="/admin/articles" replace />} />}
          {DEMO_ENABLED && <Route path="/admin" element={<RequireAuth admin><AdminShell /></RequireAuth>}>
            <Route index element={<Overview />} />
            <Route path="orders" element={<Perm area="orders"><OrderDesk /></Perm>} />
            <Route path="users" element={<Perm area="users"><Users /></Perm>} />
            <Route path="claims" element={<Perm area="claims"><Claims /></Perm>} />
            {LENDING_ENABLED ? <Route path="lending" element={<Perm area="lending"><Lending /></Perm>} /> : <Route path="lending" element={<Navigate to="/admin" replace />} />}
            <Route path="compliance" element={<Perm area="compliance"><Compliance /></Perm>} />
            <Route path="settings" element={<Perm area="settings"><AdminSettings /></Perm>} />
            <Route path="users/:id" element={<Perm area="users"><Customer /></Perm>} />
            <Route path="products" element={<Perm area="products"><Products /></Perm>} />
            <Route path="requests" element={<Perm area="requests"><Requests /></Perm>} />
            <Route path="treasury" element={<Perm area="treasury"><Treasury /></Perm>} />
            <Route path="content" element={<Perm area="content"><Content /></Perm>} />
            <Route path="staff" element={<Perm area="staff"><Staff /></Perm>} />
            <Route path="reports" element={<Perm area="reports"><Reports /></Perm>} />
            <Route path="integrations" element={<Perm area="integrations"><Integrations /></Perm>} />
            <Route path="audit" element={<Perm area="audit"><Audit /></Perm>} />
          </Route>}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </React.Suspense>
    </>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </StoreProvider>
  )
}
