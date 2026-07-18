# loan-webapp

A sample loan management application used as a test target for the Playwright E2E framework.

## Overview

Express/TypeScript app served over HTTPS with mutual TLS (mTLS). Manages loan records stored in a shared flat JSON file (`data/loans.json` at the repo root). Notifies the lending-webapp of changes in real time via Webhook + SSE.

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
| `POST` | `/loan/:id/delete` | Delete a loan |
| `GET` | `/loan/api/loans` | JSON list of all loans |
| `GET` | `/events` | SSE stream — push `loan-updated` events to browsers |
| `POST` | `/notify` | Webhook receiver — triggers SSE broadcast |

## Data Model

Loans are stored in `data/loans.json` (repo root):

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

The sync is bidirectional — both apps expose the same `GET /events` (SSE) and `POST /notify` (webhook) pair.

After a loan is created or deleted, this app fires a `POST /notify` to the lending-webapp:

```
POST https://localhost:3001/notify   (local dev)
POST https://lending-webapp:3001/notify  (Docker)
```

The target URL is resolved from `LENDING_WEBAPP_URL` env var, defaulting to `https://localhost:3001`. The receiving app broadcasts a `loan-updated` SSE event which causes all connected browser tabs to reload.

In the other direction, when lending-webapp assigns an approver or approves/rejects a loan, it calls this app's `POST /notify`, and this app's dashboards reload the same way.

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
├── scripts/
│   └── copy-assets.js      # Copies views/certs into dist/ during build
├── Dockerfile
├── package.json
└── tsconfig.json
```

## Running with Docker

Run alongside lending-webapp using Docker Compose from the repo root:

```bash
docker compose up --build
```

The repo's `data/` folder is bind-mounted at `/app/data` in both containers so they read and write the same `loans.json` as local dev.

## Testing

E2E tests are handled by [se-harness](https://github.com/rbhattarai/se-harness), a Claude Code plugin whose Playwright MCP test agents drive both apps end to end.
