# lending-webapp

A sample loan approvals application used as a test target for the Playwright E2E framework.

## Overview

Express/TypeScript app served over HTTPS with mutual TLS (mTLS). Manages loan approvers and processes loan approvals against the shared `loans.json` data store. Notifies the loan-webapp of status changes in real time via Webhook + SSE.

- **URL:** `https://localhost:3001`
- **Data store:** `../data/loans.json` and `../data/loan-approvers.json` (shared with loan-webapp)

## Tech Stack

- **Runtime:** Node.js
- **Framework:** Express.js 5.x
- **Language:** TypeScript
- **Template Engine:** EJS
- **Development:** ts-node, nodemon

## Installation

```bash
npm install
```

## Running

```bash
# Development (hot reload)
npm run dev

# Production
npm run build && npm start
```

## Routes

| Method | Path | Description |
|---|---|---|
| `GET` | `/` | Redirects to `/index` |
| `GET` | `/index` | Dashboard — recent loans grid |
| `GET` | `/lendor` | Lendors page — approvers list |
| `POST` | `/lendor` | Create a new loan approver |
| `GET` | `/loan/:id` | Loan detail page — assign approver, approve/reject |
| `POST` | `/loan/:id` | Handle `assign-approver`, `approve`, or `reject` actions |
| `GET` | `/events` | SSE stream — push `loan-updated` events to browsers |
| `POST` | `/notify` | Webhook receiver — triggers SSE broadcast |

## Data Models

**Loans** — read from and written to `apps/data/loans.json`:

```json
[
  {
    "id": "LOAN-20260417-AB12",
    "applicantName": "Jane Smith",
    "amount": 25000,
    "status": "Pending",
    "approver": "John Doe",
    "createdAt": "2026-04-17T10:00:00.000Z"
  }
]
```

Status transitions triggered by this app: `New` → `Pending` (assign approver), `Pending` → `Approved` / `Rejected`.

**Loan Approvers** — stored in `apps/data/loan-approvers.json`:

```json
[
  {
    "id": "APR-20260417-XY99",
    "name": "John Doe",
    "createdAt": "2026-04-17T09:00:00.000Z"
  }
]
```

## Loan Detail Actions (`POST /loan/:id`)

The loan detail page submits a form with an `action` field:

| `action` value | Effect |
|---|---|
| `assign-approver` | Sets `approver` name; transitions status `New → Pending` |
| `approve` | Sets status to `Approved` |
| `reject` | Sets status to `Rejected` |

Each write fires a `POST /notify` to loan-webapp to trigger a real-time browser reload.

## Real-time Sync

After any loan status change, the app fires a `POST /notify` to the loan-webapp:

```
POST https://localhost:3000/notify   (local dev)
POST https://loan-webapp:3000/notify  (Docker)
```

The target URL is resolved from `LOAN_WEBAPP_URL` env var, defaulting to `https://localhost:3000`.

## Certificates

This app reuses the server certificates from loan-webapp (resolved at `../loan-webapp/src/certs/`):

| File | Purpose |
|---|---|
| `server-key.pem` | Server private key |
| `server-cert.pem` | Server certificate |
| `client-ca.pem` | CA used to verify client certs (mTLS) |

`rejectUnauthorized: false` — client cert is requested but not enforced during development.

## Project Structure

```
lending-webapp/
├── src/
│   ├── data/
│   │   └── approverStore.ts    # Read/write loans.json and loan-approvers.json, ID generator
│   ├── routes/
│   │   ├── index.ts            # Dashboard route
│   │   ├── lendor.ts           # Approver CRUD
│   │   └── loan.ts             # Loan detail — assign, approve, reject
│   ├── views/
│   │   ├── index.ejs           # Dashboard template
│   │   ├── lendor.ejs          # Lendors / approvers template
│   │   └── loan.ejs            # Loan detail template
│   ├── events.ts               # SSE (addClient, broadcast) + webhook (notifyApp)
│   └── server.ts               # App entry point
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Running with Docker

Run alongside loan-webapp using Docker Compose from the `apps/` directory:

```bash
cd apps
docker compose up --build
```

The `shared_data` volume mounts `apps/data/` into both containers so they read and write the same JSON files.

## Testing

Run E2E tests from the framework root:

```bash
npx playwright test e2e-loan-approval.spec.ts
```

