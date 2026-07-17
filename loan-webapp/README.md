# loan-webapp

A sample loan management application used as a test target for the Playwright E2E framework.

## Overview

Express/TypeScript app served over HTTPS with mutual TLS (mTLS). Manages loan records stored in a shared flat JSON file (`apps/data/loans.json`). Notifies the lending-webapp of changes in real time via Webhook + SSE.

- **URL:** `https://localhost:3000`
- **Data store:** `../data/loans.json` (shared with lending-webapp)

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
| `GET` | `/loan` | Loans management page — full loans grid |
| `POST` | `/loan` | Create a new loan |
| `GET` | `/loan/api/loans` | JSON list of all loans |
| `GET` | `/events` | SSE stream — push `loan-updated` events to browsers |
| `POST` | `/notify` | Webhook receiver — triggers SSE broadcast |

## Data Model

Loans are stored in `apps/data/loans.json`:

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

Loan ID format: `LOAN-YYYYMMDD-XXXX` (date + 4-char random alphanumeric).

Status values: `New` → `Pending` → `Approved` / `Rejected`

## Real-time Sync

After a new loan is created, the app fires a `POST /notify` to the lending-webapp:

```
POST https://localhost:3001/notify   (local dev)
POST https://lending-webapp:3001/notify  (Docker)
```

The target URL is resolved from `LENDING_WEBAPP_URL` env var, defaulting to `https://localhost:3001`. The receiving app broadcasts a `loan-updated` SSE event which causes all connected browser tabs to reload.

## Certificates

Server certificates live in `src/certs/`:

| File | Purpose |
|---|---|
| `server-key.pem` | Server private key |
| `server-cert.pem` | Server certificate |
| `client-ca.pem` | CA used to verify client certs (mTLS) |

`rejectUnauthorized: false` — client cert is requested but not enforced, allowing browser access without a cert during development.

## Project Structure

```
loan-webapp/
├── src/
│   ├── certs/              # Server TLS certificates
│   ├── data/
│   │   └── loanStore.ts    # Read/write loans.json, ID generator
│   ├── routes/
│   │   ├── index.ts        # Dashboard route
│   │   └── loan.ts         # Loan CRUD + API
│   ├── views/
│   │   ├── index.ejs       # Dashboard template
│   │   └── loan.ejs        # Loans management template
│   ├── events.ts           # SSE (addClient, broadcast) + webhook (notifyApp)
│   └── server.ts           # App entry point
├── package.json
└── tsconfig.json
```

## Running with Docker

Run alongside lending-webapp using Docker Compose from the `apps/` directory:

```bash
cd apps
docker compose up --build
```

The `shared_data` volume mounts `apps/data/` into both containers so they read and write the same `loans.json`.

## Testing

Run E2E tests from the framework root:

```bash
npx playwright test e2e-loan-approval.spec.ts
```
