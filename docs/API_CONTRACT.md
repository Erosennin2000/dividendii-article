# Vendii API contract

Generated from `src/api/contract.js`. Do not edit by hand; run `npm run docs:api`.

**69 operations.** To connect your back end set `VITE_API_MODE=live` and `VITE_API_BASE_URL` (see `.env.example`).

## Conventions

- JSON everywhere. Money is a number in naira, never a string. Dates are ISO 8601.
- Success: `{ "data": ..., "sync": ... }`. `data` is the thing created or changed. `sync` lists every other record the call changed, by slice name (for example the new cash balance after an order). The app merges `sync` by id.
- Failure: 4xx or 5xx with `{ "error": { "code", "message", "fields" } }`. `fields` on a 422 maps input names to messages.
- Every write carries an `Idempotency-Key` header. Replaying a key must not repeat the action.
- Auth is Bearer JWT. A 401 triggers one silent `POST /auth/refresh`, then sign-out.
- Staff operations also check the staff role's permission (`permission` below).

## Public (no sign-in)

| Operation | Method and path | What it does |
|---|---|---|
| `auth.signup` | `POST /auth/signup` | Create a customer account (step 1 of onboarding). BVN and NIN checks run behind it. |
| `auth.login` | `POST /auth/login` | Check email/phone and password, send a one-time code. Staff pass staff:true. |
| `auth.verify` | `POST /auth/verify` | Exchange the one-time code for tokens. Staff responses include role. |
| `auth.refresh` | `POST /auth/refresh` | Swap a refresh token for a new access token. |

### `auth.signup`

`POST /auth/signup`

Create a customer account (step 1 of onboarding). BVN and NIN checks run behind it.

**Request**

```json
{
  "name": "Damilola Ojo",
  "email": "damilola@example.com",
  "phone": "08030000221",
  "password": "••••••••",
  "bvn": "22212345678",
  "nin": "12345678901"
}
```

**Response**

```json
{
  "challengeId": "ch_9d1",
  "channel": "sms"
}
```

### `auth.login`

`POST /auth/login`

Check email/phone and password, send a one-time code. Staff pass staff:true.

**Request**

```json
{
  "identifier": "damilola@example.com",
  "password": "••••••••",
  "staff": false
}
```

**Response**

```json
{
  "challengeId": "ch_9d1",
  "channel": "sms",
  "maskedTo": "0803 ••• 0221"
}
```

### `auth.verify`

`POST /auth/verify`

Exchange the one-time code for tokens. Staff responses include role.

**Request**

```json
{
  "challengeId": "ch_9d1",
  "code": "123456"
}
```

**Response**

```json
{
  "accessToken": "eyJ…",
  "refreshToken": "rt_…",
  "expiresIn": 900,
  "admin": false,
  "role": null,
  "user": {
    "id": "u-1",
    "name": "Damilola Ojo",
    "email": "damilola@example.com"
  }
}
```

### `auth.refresh`

`POST /auth/refresh`

Swap a refresh token for a new access token.

**Request**

```json
{
  "refreshToken": "rt_…"
}
```

**Response**

```json
{
  "accessToken": "eyJ…",
  "expiresIn": 900
}
```

## Customer app

| Operation | Method and path | What it does |
|---|---|---|
| `auth.logout` | `POST /auth/logout` | Revoke the refresh token. |
| `session.bootstrap` | `GET /me/bootstrap` | Everything the customer apps need on load, in one call. Each key is a slice of app state; shapes are in the sections below. |
| `market.stocks` | `GET /market/stocks` | All listed securities with today's price. Poll every 15 s while the market is open, or use the WebSocket in VITE_API_WS_URL. |
| `market.stock` | `GET /market/stocks/:ticker` | One security. |
| `market.history` | `GET /market/stocks/:ticker/history` | Price series for the chart. range is one of 1D 1W 1M 3M 6M 1Y 5Y. |
| `market.indices` | `GET /market/indices` | Headline indices. |
| `market.news` | `GET /market/news` | Corporate actions, board meetings, results and market news. Filter by ticker. |
| `orders.place` | `POST /orders` | Place a buy or sell order. The server re-checks cash or units, the price band and trading halts, then reserves cash. |
| `orders.cancel` | `POST /orders/:id/cancel` | Cancel the open part of an order. |
| `funding.deposit` | `POST /funding/deposits` | Customers fund by bank transfer to their virtual account; the payment provider's webhook credits cash. This endpoint records an intent or a confirmed transfer. |
| `funding.withdraw` | `POST /funding/withdrawals` | Withdraw to the customer's verified bank account. Above the approval limit the status is "Pending approval" and treasury must approve. |
| `funding.sweep` | `PUT /funding/sweep` | Turn on or off sweeping idle cash into the money market fund. |
| `recurring.add` | `POST /recurring` | Create a recurring buy plan. |
| `recurring.remove` | `DELETE /recurring/:id` | Remove a recurring plan. |
| `bonds.subscribe` | `POST /bonds/subscriptions` | Subscribe to the open FGN Savings Bond window. |
| `funds.subscribe` | `POST /funds/:fundId/subscriptions` | Buy units in a mutual fund at the next NAV. The server returns the units allotted. |
| `funds.redeem` | `POST /funds/:fundId/redemptions` | Sell units back to the fund. Proceeds settle after the fund's redemption cycle. |
| `offers.apply` | `POST /offers/:offerId/applications` | Apply for units in an open public offer. The amount is held from cash until allotment. |
| `offers.cancel` | `DELETE /offers/applications/:id` | Withdraw an application before the offer closes. The held amount returns to cash. |
| `claims.start` | `POST /claims` | Sign the power of attorney and submit recovery claims found by the dividend check. |
| `claims.upload` | `POST /claims/:id/documents` | Attach a document (for example an old share certificate) to a claim. Upload the file first with files.upload. |
| `mandates.submit` | `POST /mandates` | Submit an e-dividend mandate to a registrar. |
| `loans.create` | `POST /loans` | Apply for a share-backed loan. The server re-prices the collateral and checks concentration limits. |
| `loans.repay` | `POST /loans/:id/repayments` | Repay part or all of a loan from cash or by bank transfer. |
| `loans.pledge` | `POST /loans/:id/collateral` | Pledge more shares to a loan. |
| `profile.update` | `PATCH /me` | Update profile fields (name changes need a document, so go through requests.create). |
| `security.update` | `PATCH /me/security` | Change security preferences (biometric, timeout, screenshots). |
| `watchlist.toggle` | `PUT /me/watchlist/:ticker` | Add or remove a security from the watchlist. |
| `notifications.read` | `POST /notifications/read` | Mark all notifications read. |
| `requests.create` | `POST /requests` | Raise a service request (statement, bank change, share transfer, estate claim, insurance quote…). Types are in the Service hub. |
| `complaints.create` | `POST /complaints` | Log a complaint. Acknowledge within 1 working day. |
| `interest.create` | `POST /interest` | Register interest in a product that is coming soon (trusts, kids accounts). |
| `files.upload` | `POST /files` | Request an upload URL for a document (KYC, claim certificate, loan agreement). PUT the file to uploadUrl, then pass fileId to the operation that needs it. |
| `kyc.submit` | `POST /me/kyc` | Submit onboarding details and the selfie. |

### `auth.logout`

`POST /auth/logout`

Revoke the refresh token.

**Request**

```json
{}
```

**Response**

```json
{
  "ok": true
}
```

### `session.bootstrap`

`GET /me/bootstrap`

Everything the customer apps need on load, in one call. Each key is a slice of app state; shapes are in the sections below.

**Response**

```json
{
  "user": "{ id, name, firstName, email, phone, bvnLast, chn, tier, kyc, bank:{name,last4,accountName}, beneficiary, virtualAccount:{bank,number}, security, risk }",
  "holdings": "[{ ticker, units, avgCost }]",
  "bonds": "[…]",
  "cash": {
    "settled": 115000,
    "unsettled": 48500,
    "unsettledDate": "2026-10-14",
    "sweep": false
  },
  "orders": "[Order]",
  "paidDividends": "[…]",
  "claims": "[Claim]",
  "mandates": "[…]",
  "loans": "[Loan]",
  "funds": "[Fund]",
  "fundHoldings": "[{ fundId, units, avgCost }]",
  "offers": "[Offer]",
  "offerApps": "[OfferApplication]",
  "serviceRequests": "[ServiceRequest]",
  "transactions": "[Transaction]",
  "notifications": "[…]",
  "news": "[NewsItem]",
  "watchlist": "['SEPLAT']",
  "settings": "{ commission, secFee, ngxFee, cscsFee, stampDuty, vat, flags:{…}, haltedTickers:[…] } (public fee schedule and feature flags only)"
}
```

### `market.stocks`

`GET /market/stocks`

All listed securities with today's price. Poll every 15 s while the market is open, or use the WebSocket in VITE_API_WS_URL.

**Response**

```json
[
  {
    "ticker": "ZENITHBANK",
    "name": "Zenith Bank Plc",
    "sector": "Banking",
    "price": 48.5,
    "prev": 47.8,
    "bid": 48.4,
    "ask": 48.55,
    "volume": 1240000,
    "deals": 1240,
    "avgValue": 1900000000,
    "pe": 4.8,
    "yld": 9.3,
    "mcap": "₦1.52tn",
    "low52": 31.2,
    "high52": 50.1,
    "liquidity": "High",
    "etf": false,
    "bank": true,
    "about": "…",
    "nextDiv": {
      "type": "Interim 2026",
      "amount": 1.25,
      "qual": "2026-10-20",
      "pay": "2026-11-07"
    },
    "pastDivs": []
  }
]
```

### `market.stock`

`GET /market/stocks/:ticker`

One security.

**Response**

```json
Stock
```

### `market.history`

`GET /market/stocks/:ticker/history`

Price series for the chart. range is one of 1D 1W 1M 3M 6M 1Y 5Y.

**Response**

```json
{
  "values": [
    48.2,
    48.4,
    48.5
  ],
  "labels": [
    "10:00",
    "10:30",
    "11:00"
  ]
}
```

### `market.indices`

`GET /market/indices`

Headline indices.

**Response**

```json
{
  "asi": 165412.08,
  "asiChg": 0.6,
  "banking": 1842.11,
  "bankingChg": 1.1,
  "mcap": "₦104.2tn"
}
```

### `market.news`

`GET /market/news`

Corporate actions, board meetings, results and market news. Filter by ticker.

**Response**

```json
[
  {
    "id": "nw-1",
    "ticker": "ZENITHBANK",
    "cat": "Corporate action",
    "title": "…",
    "date": "2026-10-09",
    "body": "…",
    "by": "NGX filing"
  }
]
```

### `orders.place`

`POST /orders`

Place a buy or sell order. The server re-checks cash or units, the price band and trading halts, then reserves cash.

**Request**

```json
{
  "clientId": "c-8F2K1A",
  "side": "Buy",
  "ticker": "ZENITHBANK",
  "units": 2000,
  "type": "Limit",
  "limit": 48.5,
  "validity": "Day",
  "pin": "1234"
}
```

**Response**

```json
{
  "data": {
    "id": "VND-26-004830",
    "clientId": "c-8F2K1A",
    "ts": "2026-10-11T10:42:00Z",
    "side": "Buy",
    "ticker": "ZENITHBANK",
    "units": 2000,
    "filled": 0,
    "type": "Limit",
    "limit": 48.5,
    "status": "Received",
    "validity": "Day",
    "owner": "u-1",
    "timeline": [
      [
        "Received",
        "2026-10-11T10:42:00Z"
      ]
    ]
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `orders.cancel`

`POST /orders/:id/cancel`

Cancel the open part of an order.

**Request**

```json
{}
```

**Response**

```json
{
  "data": {
    "id": "VND-26-004830",
    "clientId": "c-8F2K1A",
    "ts": "2026-10-11T10:42:00Z",
    "side": "Buy",
    "ticker": "ZENITHBANK",
    "units": 2000,
    "filled": 0,
    "type": "Limit",
    "limit": 48.5,
    "status": "Cancelled",
    "validity": "Day",
    "owner": "u-1",
    "timeline": [
      [
        "Received",
        "2026-10-11T10:42:00Z"
      ]
    ]
  }
}
```

### `funding.deposit`

`POST /funding/deposits`

Customers fund by bank transfer to their virtual account; the payment provider's webhook credits cash. This endpoint records an intent or a confirmed transfer.

**Request**

```json
{
  "amount": 500000,
  "method": "transfer"
}
```

**Response**

```json
{
  "data": {
    "id": "TX-90420",
    "status": "Completed"
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `funding.withdraw`

`POST /funding/withdrawals`

Withdraw to the customer's verified bank account. Above the approval limit the status is "Pending approval" and treasury must approve.

**Request**

```json
{
  "amount": 100000,
  "pin": "1234"
}
```

**Response**

```json
{
  "data": {
    "id": "TX-90421",
    "status": "Completed"
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `funding.sweep`

`PUT /funding/sweep`

Turn on or off sweeping idle cash into the money market fund.

**Request**

```json
{
  "on": true
}
```

**Response**

```json
{
  "data": {
    "sweep": true
  }
}
```

### `recurring.add`

`POST /recurring`

Create a recurring buy plan.

**Request**

```json
{
  "ticker": "STANBICETF30",
  "amount": 50000,
  "day": 28
}
```

**Response**

```json
{
  "data": {
    "id": "rp-1"
  }
}
```

### `recurring.remove`

`DELETE /recurring/:id`

Remove a recurring plan.

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `bonds.subscribe`

`POST /bonds/subscriptions`

Subscribe to the open FGN Savings Bond window.

**Request**

```json
{
  "tenor": 3,
  "units": 50,
  "amount": 50000,
  "pin": "1234"
}
```

**Response**

```json
{
  "data": {
    "id": "b-2"
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `funds.subscribe`

`POST /funds/:fundId/subscriptions`

Buy units in a mutual fund at the next NAV. The server returns the units allotted.

**Request**

```json
{
  "fundId": "mmf",
  "amount": 100000,
  "pin": "1234"
}
```

**Response**

```json
{
  "data": {
    "fundId": "mmf",
    "units": 844.4,
    "nav": 118.42,
    "status": "Completed"
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    },
    "fundHoldings": [
      {
        "fundId": "mmf",
        "units": 2948.8,
        "avgCost": 113.4
      }
    ]
  }
}
```

### `funds.redeem`

`POST /funds/:fundId/redemptions`

Sell units back to the fund. Proceeds settle after the fund's redemption cycle.

**Request**

```json
{
  "fundId": "mmf",
  "units": 100,
  "pin": "1234"
}
```

**Response**

```json
{
  "data": {
    "proceeds": 11842,
    "settles": "2026-10-12"
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `offers.apply`

`POST /offers/:offerId/applications`

Apply for units in an open public offer. The amount is held from cash until allotment.

**Request**

```json
{
  "offerId": "off-1",
  "units": 1000,
  "pin": "1234"
}
```

**Response**

```json
{
  "data": {
    "id": "APP-3402",
    "offerId": "off-1",
    "units": 1000,
    "amount": 480000,
    "status": "Submitted"
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `offers.cancel`

`DELETE /offers/applications/:id`

Withdraw an application before the offer closes. The held amount returns to cash.

**Response**

```json
{
  "data": {
    "status": "Cancelled"
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `claims.start`

`POST /claims`

Sign the power of attorney and submit recovery claims found by the dividend check.

**Request**

```json
{
  "claims": [
    {
      "company": "Nestle Nigeria",
      "registrar": "Meristem Registrars",
      "years": "2014 to 2019",
      "amount": 41200
    }
  ]
}
```

**Response**

```json
{
  "data": [
    {
      "id": "CLM-0420",
      "status": "Submitted"
    }
  ]
}
```

### `claims.upload`

`POST /claims/:id/documents`

Attach a document (for example an old share certificate) to a claim. Upload the file first with files.upload.

**Request**

```json
{
  "fileId": "f_81c"
}
```

**Response**

```json
{
  "data": {
    "status": "With registrar"
  }
}
```

### `mandates.submit`

`POST /mandates`

Submit an e-dividend mandate to a registrar.

**Request**

```json
{
  "registrar": "Meristem Registrars"
}
```

**Response**

```json
{
  "data": {
    "status": "Submitted"
  }
}
```

### `loans.create`

`POST /loans`

Apply for a share-backed loan. The server re-prices the collateral and checks concentration limits.

**Request**

```json
{
  "amount": 900000,
  "tenor": 6,
  "plan": "Monthly",
  "purpose": "Personal",
  "collateral": [
    {
      "ticker": "MTNN",
      "units": 3500
    }
  ]
}
```

**Response**

```json
{
  "data": {
    "id": "VBL-2026-00320",
    "status": "Pending approval"
  }
}
```

### `loans.repay`

`POST /loans/:id/repayments`

Repay part or all of a loan from cash or by bank transfer.

**Request**

```json
{
  "amount": 100000,
  "fromCash": true
}
```

**Response**

```json
{
  "data": {
    "outstanding": 657311
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `loans.pledge`

`POST /loans/:id/collateral`

Pledge more shares to a loan.

**Request**

```json
{
  "ticker": "GTCO",
  "units": 1000
}
```

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `profile.update`

`PATCH /me`

Update profile fields (name changes need a document, so go through requests.create).

**Request**

```json
{
  "risk": "Balanced"
}
```

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `security.update`

`PATCH /me/security`

Change security preferences (biometric, timeout, screenshots).

**Request**

```json
{
  "biometric": true
}
```

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `watchlist.toggle`

`PUT /me/watchlist/:ticker`

Add or remove a security from the watchlist.

**Request**

```json
{
  "on": true
}
```

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `notifications.read`

`POST /notifications/read`

Mark all notifications read.

**Request**

```json
{}
```

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `requests.create`

`POST /requests`

Raise a service request (statement, bank change, share transfer, estate claim, insurance quote…). Types are in the Service hub.

**Request**

```json
{
  "type": "bank",
  "fields": {
    "bank": "Access Bank",
    "acct": "0123456789"
  },
  "pin": "1234"
}
```

**Response**

```json
{
  "data": {
    "id": "SR-1060",
    "status": "Submitted",
    "due": "2026-10-13"
  }
}
```

### `complaints.create`

`POST /complaints`

Log a complaint. Acknowledge within 1 working day.

**Request**

```json
{
  "subject": "Order filled at a worse price",
  "detail": "…"
}
```

**Response**

```json
{
  "data": {
    "id": "CMP-120",
    "status": "Open"
  }
}
```

### `interest.create`

`POST /interest`

Register interest in a product that is coming soon (trusts, kids accounts).

**Request**

```json
{
  "kind": "trusts"
}
```

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `files.upload`

`POST /files`

Request an upload URL for a document (KYC, claim certificate, loan agreement). PUT the file to uploadUrl, then pass fileId to the operation that needs it.

**Request**

```json
{
  "name": "certificate.pdf",
  "type": "application/pdf",
  "size": 240000
}
```

**Response**

```json
{
  "fileId": "f_81c",
  "uploadUrl": "https://…signed-url…"
}
```

### `kyc.submit`

`POST /me/kyc`

Submit onboarding details and the selfie.

**Request**

```json
{
  "bvn": "22212345678",
  "nin": "12345678901",
  "selfieFileId": "f_77a"
}
```

**Response**

```json
{
  "data": {
    "kyc": "Pending review"
  }
}
```

## Staff console

| Operation | Method and path | What it does |
|---|---|---|
| `admin.bootstrap` | `GET /admin/bootstrap` | Everything the staff console needs on load, limited to what the staff role may see. |
| `orders.advance` | `POST /admin/orders/:id/advance` | Order desk moves an order one step: Received → Sent to broker → On exchange → Filled → Settled. On Settled the server books cash and holdings. |
| `kyc.decide` | `POST /admin/users/:id/kyc` | Approve or reject a customer in the KYC queue. |
| `users.status` | `POST /admin/users/:id/status` | Suspend or reactivate a customer. Suspended customers cannot place orders or withdraw. |
| `users.note` | `POST /admin/users/:id/notes` | Add an internal note to a customer record. |
| `claims.advance` | `POST /admin/claims/:id/advance` | Move a recovery claim to its next stage. |
| `flags.resolve` | `POST /admin/compliance/flags/:id` | Resolve or escalate an AML flag. |
| `complaints.status` | `POST /admin/complaints/:id` | Update a complaint's status. |
| `requests.update` | `POST /admin/requests/:id` | Change a service request's status or assignee, optionally with a note. |
| `requests.note` | `POST /admin/requests/:id/notes` | Add an internal note to a service request. |
| `loans.approve` | `POST /admin/loans/:id/approve` | Approve a loan. The server places the CSCS lien and pays out to the customer's bank before returning. |
| `loans.decline` | `POST /admin/loans/:id/decline` | Decline a loan application. |
| `loans.liquidate` | `POST /admin/loans/:id/liquidate` | Sell collateral to restore loan health after an uncured margin call. |
| `advance.rate` | `PUT /admin/advance-rates/:ticker` | Change how much can be borrowed against a security (0 to 1). |
| `offers.upsert` | `PUT /admin/offers/:id` | Create or edit a public offer. |
| `offers.status` | `POST /admin/offers/:id/status` | Open or close an offer. |
| `offers.allot` | `POST /admin/offers/:id/allot` | Run allotment at a ratio between 0 and 1 (1 means everyone gets what they applied for). Refunds for unallotted units are credited to cash. |
| `funds.upsert` | `PUT /admin/funds/:id` | Create or edit a mutual fund listing (fees, minimums, status). |
| `funds.nav` | `POST /admin/funds/:id/nav` | Publish the day's unit price (NAV). |
| `news.publish` | `POST /admin/news` | Publish a news item or corporate action. Appears on the stock page and, if flagged, as a customer alert. |
| `news.remove` | `DELETE /admin/news/:id` | Remove a news item. |
| `halts.toggle` | `PUT /admin/halts/:ticker` | Halt or resume trading in one security on the platform (for example when the exchange suspends it). |
| `treasury.decide` | `POST /admin/treasury/:id/decision` | Approve or reject a pending payment. Approval needs a second person from the one who requested it (maker-checker). |
| `settings.update` | `PATCH /admin/settings` | Change fee rates, loan thresholds and limits. |
| `flags.set` | `PUT /admin/flags/:key` | Pause or resume a product (trading, lending, recovery, offers, funds, insurance…). |
| `staff.upsert` | `PUT /admin/staff/:id` | Invite a staff member or change their role. |
| `staff.status` | `POST /admin/staff/:id/status` | Activate or deactivate a staff account (also revokes their sessions). |
| `integrations.update` | `PUT /admin/integrations/:id` | Save an integration's mode and endpoint. Secrets are stored server-side only; the browser never sees them. |
| `integrations.ping` | `POST /admin/integrations/:id/ping` | Server-side health check of one integration. |
| `reports.run` | `GET /admin/reports/:key` | Run a report (orders, customers, claims, loans, ledger, revenue). Returns rows for the on-screen table; CSV is built in the browser. |
| `audit.list` | `GET /admin/audit` | Audit log, newest first. Page with cursor. |

### `admin.bootstrap`

`GET /admin/bootstrap`

Everything the staff console needs on load, limited to what the staff role may see.

**Response**

```json
{
  "adminUsers": "[…]",
  "orders": "[Order (all customers)]",
  "claims": "[Claim]",
  "loans": "[Loan]",
  "amlFlags": "[…]",
  "complaints": "[…]",
  "serviceRequests": "[ServiceRequest]",
  "transactions": "[Transaction]",
  "offers": "[Offer]",
  "offerApps": "[OfferApplication]",
  "funds": "[Fund]",
  "staff": "[Staff]",
  "integrations": "[Integration]",
  "settings": "{ full settings }",
  "audit": "[…]",
  "news": "[NewsItem]"
}
```

### `orders.advance`

`POST /admin/orders/:id/advance` · needs permission **orders**

Order desk moves an order one step: Received → Sent to broker → On exchange → Filled → Settled. On Settled the server books cash and holdings.

**Request**

```json
{}
```

**Response**

```json
{
  "data": {
    "id": "VND-26-004830",
    "clientId": "c-8F2K1A",
    "ts": "2026-10-11T10:42:00Z",
    "side": "Buy",
    "ticker": "ZENITHBANK",
    "units": 2000,
    "filled": 0,
    "type": "Limit",
    "limit": 48.5,
    "status": "Sent to broker",
    "validity": "Day",
    "owner": "u-1",
    "timeline": [
      [
        "Received",
        "2026-10-11T10:42:00Z"
      ]
    ]
  },
  "sync": {
    "cash": {
      "settled": 115000,
      "unsettled": 48500,
      "unsettledDate": "2026-10-14",
      "sweep": false
    }
  }
}
```

### `kyc.decide`

`POST /admin/users/:id/kyc` · needs permission **users**

Approve or reject a customer in the KYC queue.

**Request**

```json
{
  "status": "Verified"
}
```

**Response**

```json
{
  "data": {
    "kyc": "Verified",
    "chn": "pending"
  }
}
```

### `users.status`

`POST /admin/users/:id/status` · needs permission **users**

Suspend or reactivate a customer. Suspended customers cannot place orders or withdraw.

**Request**

```json
{
  "status": "Suspended",
  "reason": "Awaiting source of funds"
}
```

**Response**

```json
{
  "data": {
    "status": "Suspended"
  }
}
```

### `users.note`

`POST /admin/users/:id/notes` · needs permission **users**

Add an internal note to a customer record.

**Request**

```json
{
  "text": "Called customer, confirmed new number."
}
```

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `claims.advance`

`POST /admin/claims/:id/advance` · needs permission **claims**

Move a recovery claim to its next stage.

**Request**

```json
{}
```

**Response**

```json
{
  "data": {
    "status": "Identity check"
  }
}
```

### `flags.resolve`

`POST /admin/compliance/flags/:id` · needs permission **compliance**

Resolve or escalate an AML flag.

**Request**

```json
{
  "status": "Resolved"
}
```

**Response**

```json
{
  "data": {
    "status": "Resolved"
  }
}
```

### `complaints.status`

`POST /admin/complaints/:id` · needs permission **compliance**

Update a complaint's status.

**Request**

```json
{
  "status": "Investigating"
}
```

**Response**

```json
{
  "data": {
    "status": "Investigating"
  }
}
```

### `requests.update`

`POST /admin/requests/:id` · needs permission **requests**

Change a service request's status or assignee, optionally with a note.

**Request**

```json
{
  "status": "Completed",
  "note": "Statement emailed."
}
```

**Response**

```json
{
  "data": {
    "status": "Completed"
  }
}
```

### `requests.note`

`POST /admin/requests/:id/notes` · needs permission **requests**

Add an internal note to a service request.

**Request**

```json
{
  "text": "Waiting on certificate."
}
```

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `loans.approve`

`POST /admin/loans/:id/approve` · needs permission **lending**

Approve a loan. The server places the CSCS lien and pays out to the customer's bank before returning.

**Request**

```json
{}
```

**Response**

```json
{
  "data": {
    "status": "Active"
  }
}
```

### `loans.decline`

`POST /admin/loans/:id/decline` · needs permission **lending**

Decline a loan application.

**Request**

```json
{
  "reason": "Concentration limit"
}
```

**Response**

```json
{
  "data": {
    "status": "Declined"
  }
}
```

### `loans.liquidate`

`POST /admin/loans/:id/liquidate` · needs permission **lending**

Sell collateral to restore loan health after an uncured margin call.

**Request**

```json
{
  "ticker": "GTCO",
  "units": 4000
}
```

**Response**

```json
{
  "data": {
    "proceeds": 160000,
    "outstanding": 597311
  }
}
```

### `advance.rate`

`PUT /admin/advance-rates/:ticker` · needs permission **lending**

Change how much can be borrowed against a security (0 to 1).

**Request**

```json
{
  "rate": 0.45
}
```

**Response**

```json
{
  "data": {
    "ticker": "NAHCO",
    "rate": 0.45
  }
}
```

### `offers.upsert`

`PUT /admin/offers/:id` · needs permission **products**

Create or edit a public offer.

**Request**

```json
{
  "name": "Orikun Refining Plc, Initial Public Offer",
  "kind": "IPO",
  "unitPrice": 480,
  "minUnits": 20,
  "multiple": 10,
  "opens": "2026-10-05",
  "closes": "2026-10-30"
}
```

**Response**

```json
{
  "data": "Offer"
}
```

### `offers.status`

`POST /admin/offers/:id/status` · needs permission **products**

Open or close an offer.

**Request**

```json
{
  "status": "Closed"
}
```

**Response**

```json
{
  "data": {
    "status": "Closed"
  }
}
```

### `offers.allot`

`POST /admin/offers/:id/allot` · needs permission **products**

Run allotment at a ratio between 0 and 1 (1 means everyone gets what they applied for). Refunds for unallotted units are credited to cash.

**Request**

```json
{
  "ratio": 0.8
}
```

**Response**

```json
{
  "data": {
    "applications": 312,
    "allottedUnits": 120000000,
    "refunded": 4200000
  },
  "sync": {
    "offerApps": "[…]"
  }
}
```

### `funds.upsert`

`PUT /admin/funds/:id` · needs permission **products**

Create or edit a mutual fund listing (fees, minimums, status).

**Request**

```json
{
  "name": "Naira Money Market Fund",
  "minInitial": 5000,
  "status": "Open"
}
```

**Response**

```json
{
  "data": "Fund"
}
```

### `funds.nav`

`POST /admin/funds/:id/nav` · needs permission **products**

Publish the day's unit price (NAV).

**Request**

```json
{
  "nav": 118.9
}
```

**Response**

```json
{
  "data": {
    "nav": 118.9
  }
}
```

### `news.publish`

`POST /admin/news` · needs permission **content**

Publish a news item or corporate action. Appears on the stock page and, if flagged, as a customer alert.

**Request**

```json
{
  "ticker": "ZENITHBANK",
  "cat": "Corporate action",
  "title": "…",
  "body": "…"
}
```

**Response**

```json
{
  "data": {
    "id": "nw-90"
  }
}
```

### `news.remove`

`DELETE /admin/news/:id` · needs permission **content**

Remove a news item.

**Response**

```json
{
  "data": {
    "ok": true
  }
}
```

### `halts.toggle`

`PUT /admin/halts/:ticker` · needs permission **content**

Halt or resume trading in one security on the platform (for example when the exchange suspends it).

**Request**

```json
{
  "halted": true
}
```

**Response**

```json
{
  "data": {
    "halted": true
  }
}
```

### `treasury.decide`

`POST /admin/treasury/:id/decision` · needs permission **treasury**

Approve or reject a pending payment. Approval needs a second person from the one who requested it (maker-checker).

**Request**

```json
{
  "decision": "Approve"
}
```

**Response**

```json
{
  "data": {
    "status": "Completed"
  }
}
```

### `settings.update`

`PATCH /admin/settings` · needs permission **settings**

Change fee rates, loan thresholds and limits.

**Request**

```json
{
  "commission": 0.0135
}
```

**Response**

```json
{
  "data": "Settings"
}
```

### `flags.set`

`PUT /admin/flags/:key` · needs permission **settings**

Pause or resume a product (trading, lending, recovery, offers, funds, insurance…).

**Request**

```json
{
  "value": false
}
```

**Response**

```json
{
  "data": {
    "key": "trading",
    "value": false
  }
}
```

### `staff.upsert`

`PUT /admin/staff/:id` · needs permission **staff**

Invite a staff member or change their role.

**Request**

```json
{
  "name": "Dayo Coker",
  "email": "dayo@vendii.ng",
  "role": "Credit"
}
```

**Response**

```json
{
  "data": "Staff"
}
```

### `staff.status`

`POST /admin/staff/:id/status` · needs permission **staff**

Activate or deactivate a staff account (also revokes their sessions).

**Request**

```json
{
  "status": "Deactivated"
}
```

**Response**

```json
{
  "data": {
    "status": "Deactivated"
  }
}
```

### `integrations.update`

`PUT /admin/integrations/:id` · needs permission **integrations**

Save an integration's mode and endpoint. Secrets are stored server-side only; the browser never sees them.

**Request**

```json
{
  "mode": "live",
  "baseUrl": "https://broker.example.com"
}
```

**Response**

```json
{
  "data": "Integration"
}
```

### `integrations.ping`

`POST /admin/integrations/:id/ping` · needs permission **integrations**

Server-side health check of one integration.

**Request**

```json
{}
```

**Response**

```json
{
  "data": {
    "ok": true,
    "latencyMs": 142,
    "checked": "2026-10-11T10:00:00Z"
  }
}
```

### `reports.run`

`GET /admin/reports/:key` · needs permission **reports**

Run a report (orders, customers, claims, loans, ledger, revenue). Returns rows for the on-screen table; CSV is built in the browser.

**Response**

```json
{
  "columns": [
    "Date",
    "Order",
    "Customer"
  ],
  "rows": [
    [
      "2026-10-11",
      "VND-26-004830",
      "Damilola Ojo"
    ]
  ]
}
```

### `audit.list`

`GET /admin/audit` · needs permission **audit**

Audit log, newest first. Page with cursor.

**Response**

```json
[
  {
    "ts": "2026-10-11T10:43:00Z",
    "actor": "Order desk (A. Bello)",
    "action": "Sent order to broker",
    "detail": "VND-26-004812"
  }
]
```

