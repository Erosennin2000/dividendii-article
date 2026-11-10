# Vendii: website, trading app, lending app and admin console

One React codebase with four surfaces that link to each other:

| Surface | Route | What it is |
|---|---|---|
| Website | `/` | Marketing site: dividend checker, Invest, Borrow, Pricing, Safety, Learn, waitlist |
| Sign in / sign up | `/signin`, `/signup` | Demo auth and the five-step onboarding wizard |
| Trading app | `/app` | Home, markets, equities and trade ticket, mutual funds, public offers (IPOs, rights, bonds), fixed income, dividends and recovery, insurance quotes, family and trusts (coming soon), services, funding, settings, help |
| Lending app | `/lend` | Eligibility, loan builder, review and sign, loan dashboard with warning and margin call states, documents |
| Admin console | `/admin` | Role-gated: overview, order desk, customers (360 view), recovery claims, service requests, news and halts, treasury approvals and ledger, offers and funds (allotment, NAV), loan book, compliance, reports (CSV), staff and roles, integrations, fees and flags, audit log |

## Run it

```
npm install
npm run dev
```

Open http://localhost:5173. `npm run build` produces a static bundle in `dist/`.

## Demo sign-in

- Customer: any email, any password of 4+ characters, any 6-digit code.
- Staff: `/signin?staff=1`, same rules. Or use the "Staff console" link in the trading app sidebar.
- Transaction PIN in the apps: any 4 digits. CSCS and bank codes: any 6 digits.

## How the pieces connect

- Website dividend check → "Recover it with your BVN" → sign-up → trading app, Dividends tab.
- Trading app sidebar → "Borrow against shares" → lending app. Lending sidebar → back to trading.
- Orders placed in the trading app appear on the admin Order desk. Moving them to Settled updates the customer's cash and holdings.
- Loan applications signed in the lending app appear under Admin → Loan book → Applications. Approving places the lien and pays out.
- Admin → Fees, rates and flags → Market shock pushes every price down. Above about 54% the loan enters the warning zone, above 59% the margin call state, which changes the lending dashboard, the trading home banner and the admin margin call queue. Feature flags pause products everywhere at once.
- Every action writes to the audit log.

## Where things are

```
src/
  data/mock.js          sample securities, user, holdings, orders, claims, loans, settings
  store/store.jsx       reducer, actions, selectors (portfolio, loanMetrics, eligibleCollateral)
  utils.js              naira formatting, fees, amortisation
  components/           ui.jsx (pills, stats, health bar, order steps, modal), DividendChecker, FeeCalc
  layouts/              SiteLayout, Shell (sidebar + top bar), AppShell, LendShell, AdminShell
  pages/site            Home, Check, Invest, Borrow, Pricing, Safety, Learn, Waitlist
  pages/auth            SignIn, SignUp
  pages/app             Dashboard, Markets, Stock, Orders, FixedIncome, Dividends, Funding, Settings, Support, Notifications
  pages/lend            Dashboard, Start, Build, Review, Documents, Learn
  pages/admin           Overview, OrderDesk, Users, Claims, Lending, Compliance, Settings, Audit
  styles.css            design tokens and all styling (Space Grotesk, Vendii ink/blue/gold)
test/                   server-side render of every route and a reducer walkthrough
```

State persists in `localStorage` under `vendii-demo-v3`. Reset it from Admin → Fees, rates and flags → Reset demo data.

## What is sample or placeholder

All prices, balances, dates, counts and rates are sample data. Text in [brackets] (legal entity, SEC registration number, address, support hours, commission and loan rates) needs real values. Fee rates in `data/mock.js` SETTINGS are editable at runtime in the admin console.

## Wiring to a backend

Replace `store/store.jsx` dispatches with API calls (Supabase or Firebase both fit). The reducer cases are the API surface: PLACE_ORDER, ADVANCE_ORDER, DEPOSIT, WITHDRAW, SUBSCRIBE_BOND, START_CLAIMS, ADVANCE_CLAIM, SUBMIT_MANDATE, CREATE_LOAN, APPROVE_LOAN, REPAY, PLEDGE_MORE, LIQUIDATE, KYC, RESOLVE_FLAG, COMPLAINT, SETTINGS, FLAG, ADVANCE_RATE. Selectors in the same file become server-side calculations.


## Plugging in your API

The app runs on sample data until you point it at a back end. Nothing in the screens needs to change.

1. `cp .env.example .env`
2. Set `VITE_API_MODE=live` and `VITE_API_BASE_URL=https://your-api/v1`.
3. Make each endpoint in `docs/API_CONTRACT.md` return the response shown there. If your paths differ, edit them once in `src/api/contract.js`, then run `npm run docs:api` to refresh the document.
4. To go live one module at a time, keep `VITE_API_MODE=mock` and list modules in `VITE_API_LIVE_OPS` (for example `auth,market`).

Rules the back end follows: JSON; money as numbers in naira; writes return `{ data, sync }` where `sync` carries every other record the call changed; Bearer JWT with `/auth/refresh`; an `Idempotency-Key` header on writes; errors as `{ error: { code, message, fields } }`. In live mode the browser stores display preferences only, never money data.

The staff console has an **Integrations** page that lists every outside system the platform needs (identity checks, broker, CSCS, payments, fund managers, registrars, insurers, messaging) with a Test connection button.

## What is sample data

All companies, funds, offers, insurers, prices and people are invented. Names in `[square brackets]` are placeholders for the real provider. Replace them through your API.
