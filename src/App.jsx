import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { StoreProvider, useStore } from './store/store.jsx'
import SiteLayout from './layouts/SiteLayout.jsx'
import AppShell from './layouts/AppShell.jsx'
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
import Dashboard from './pages/app/Dashboard.jsx'
import Markets from './pages/app/Markets.jsx'
import Stock from './pages/app/Stock.jsx'
import Equities from './pages/app/Equities.jsx'
import Trade from './pages/app/Trade.jsx'
import Funds from './pages/app/Funds.jsx'
import FundDetail from './pages/app/FundDetail.jsx'
import Offers from './pages/app/Offers.jsx'
import OfferDetail from './pages/app/OfferDetail.jsx'
import Insurance from './pages/app/Insurance.jsx'
import Trusts from './pages/app/Trusts.jsx'
import Services from './pages/app/Services.jsx'
import Orders from './pages/app/Orders.jsx'
import FixedIncome from './pages/app/FixedIncome.jsx'
import Dividends from './pages/app/Dividends.jsx'
import Funding from './pages/app/Funding.jsx'
import Settings from './pages/app/Settings.jsx'
import Support from './pages/app/Support.jsx'
import Notifications from './pages/app/Notifications.jsx'
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
import { LENDING_ENABLED } from './features.js'

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
  const { pathname } = useLocation()
  React.useEffect(() => { window.scrollTo(0, 0) }, [pathname])
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
          </Route>
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/app" element={<RequireAuth><AppShell /></RequireAuth>}>
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
          {!LENDING_ENABLED && <Route path="/lend/*" element={<Navigate to="/app" replace />} />}
          {LENDING_ENABLED && <Route path="/lend" element={<RequireAuth><LendShell /></RequireAuth>}>
            <Route index element={<LendDashboard />} />
            <Route path="start" element={<Start />} />
            <Route path="build" element={<Build />} />
            <Route path="review" element={<Review />} />
            <Route path="documents" element={<Documents />} />
            <Route path="learn" element={<LendLearn />} />
          </Route>}
          <Route path="/admin/articles/*" element={<ArticlesAdmin />} />
          <Route path="/admin" element={<RequireAuth admin><AdminShell /></RequireAuth>}>
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
          </Route>
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
