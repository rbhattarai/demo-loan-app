# lending-webapp

A sample loan approvals application used as a test target for the Playwright E2E framework.

## Overview

Express/TypeScript app served over HTTPS with mutual TLS (mTLS). Manages loan approvers and processes loan approvals against the shared `loans.json` data store. Notifies the loan-webapp of status changes in real time via Webhook + SSE.

- **URL:** `https://localhost:3001`
- **Data store:** `data/loans.json` and `data/loan-approvers.json` at the repo root (shared with loan-webapp)

## Tech Stack

- **Runtime:** Node.js 22+
- **Framework:** Express.js 5.x
- **Language:** TypeScript
- **Template Engine:** EJS
- **Development:** ts-node, nodemon
- **Testing:** Vitest, Supertest
- **Lint/Format:** ESLint (flat config, typescript-eslint), Prettier

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

| Method | Path                 | Description                                              |
| ------ | -------------------- | -------------------------------------------------------- |
| `GET`  | `/`                  | Redirects to `/index`                                    |
| `GET`  | `/index`             | Dashboard — recent loans grid                            |
| `GET`  | `/lendor`            | Lendors page — approvers list                            |
| `POST` | `/lendor`            | Create a new loan approver                               |
| `POST` | `/lendor/:id/delete` | Delete a loan approver                                   |
| `GET`  | `/loan/:id`          | Loan detail page — assign approver, approve/reject       |
| `POST` | `/loan/:id`          | Handle `assign-approver`, `approve`, or `reject` actions |
| `GET`  | `/events`            | SSE stream — push `loan-updated` events to browsers      |
| `POST` | `/notify`            | Webhook receiver — triggers SSE broadcast                |

## Data Models

**Loans** — read from and written to `data/loans.json` (repo root):

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

**Loan Approvers** — stored in `data/loan-approvers.json` (repo root):

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

| `action` value    | Effect                                                   |
| ----------------- | -------------------------------------------------------- |
| `assign-approver` | Sets `approver` name; transitions status `New → Pending` |
| `approve`         | Sets status to `Approved`                                |
| `reject`          | Sets status to `Rejected`                                |

Each write fires a `POST /notify` to loan-webapp to trigger a real-time browser reload.

## Real-time Sync

The sync is bidirectional — both apps expose the same `GET /events` (SSE) and `POST /notify` (webhook) pair.

After any loan status change (assign approver, approve, reject), this app fires a `POST /notify` to the loan-webapp:

```
POST https://localhost:3000/notify   (local dev)
POST https://loan-webapp:3000/notify  (Docker)
```

The target URL is resolved from `LOAN_WEBAPP_URL` env var, defaulting to `https://localhost:3000`.

In the other direction, when loan-webapp creates or deletes a loan, it calls this app's `POST /notify`, which broadcasts a `loan-updated` SSE event so this app's dashboards reload.

## Certificates

This app reuses the server certificates from loan-webapp (resolved at `../loan-webapp/src/certs/`):

| File              | Purpose                               |
| ----------------- | ------------------------------------- |
| `server-key.pem`  | Server private key                    |
| `server-cert.pem` | Server certificate                    |
| `client-ca.pem`   | CA used to verify client certs (mTLS) |

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
│   ├── app.ts                  # Express app (routes, middleware) — no listen, no certs
│   └── server.ts               # Entry point — reads certs, starts the HTTPS listener
├── test/                       # Vitest unit tests (mirrors src/, fs/https/data-store mocked)
├── scripts/
│   └── copy-assets.js          # Copies views into dist/ during build
├── Dockerfile
├── eslint.config.js
├── .prettierrc.json
├── vitest.config.ts
├── package.json
└── tsconfig.json
```

## Running with Docker

Run alongside loan-webapp using Docker Compose from the repo root:

```bash
docker compose up --build
```

The repo's `data/` folder is bind-mounted at `/app/data` in both containers so they read and write the same JSON files as local dev.

## Testing

Unit tests (Vitest + Supertest) cover `src/data/approverStore.ts`, `src/events.ts`, and the routes
in `src/app.ts`. Filesystem and network calls (`fs`, `https`, the data-store modules) are mocked
via `vi.mock`, so tests don't touch the real `data/*.json` files or the network.

```bash
npm test           # run once (used in CI)
npm run test:watch # watch mode
```

E2E tests are handled by [se-harness](https://github.com/rbhattarai/se-harness), a Claude Code plugin whose Playwright MCP test agents drive both apps end to end.

## Linting & Formatting

```bash
npm run lint          # ESLint
npm run lint:fix      # ESLint --fix
npm run format        # Prettier --write
npm run format:check  # Prettier --check (used in CI)
```
