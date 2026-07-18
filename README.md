# demo-loan-app

Monorepo containing two cooperating demo web apps for a loan product: borrowers request loans in **loan-webapp**, and lenders approve or reject them in **lending-webapp**. Both are Express 5 / TypeScript / EJS apps served over HTTPS with mutual TLS, sharing a flat-file JSON data store and syncing in real time via webhooks + Server-Sent Events (SSE).

## Apps

| App | URL | Purpose |
|---|---|---|
| [loan-webapp](loan-webapp/) | `https://localhost:3000` | Create and view loan requests |
| [lending-webapp](lending-webapp/) | `https://localhost:3001` | Manage approvers; assign, approve, or reject loans |

See each app's README ([loan-webapp](loan-webapp/README.md), [lending-webapp](lending-webapp/README.md)) for routes, data models, and internals.

## Architecture

```
┌──────────────┐   POST /notify (webhook)   ┌──────────────────┐
│  loan-webapp  │ ─────────────────────────► │  lending-webapp  │
│    :3000      │ ◄───────────────────────── │      :3001       │
└──────┬───────┘                             └────────┬─────────┘
       │  SSE /events                                 │  SSE /events
       ▼                                              ▼
   browsers                                       browsers
       ▲                                              ▲
       └────────────── data/loans.json ───────────────┘
                 (shared flat-file store)
```

- **Shared data store** — [data/loans.json](data/loans.json) (loan records, written by both apps) and [data/loan-approvers.json](data/loan-approvers.json) (owned by lending-webapp).
- **Real-time sync** — after either app writes a loan change, it calls the other app's `POST /notify`; the receiver broadcasts a `loan-updated` SSE event and connected browser tabs reload.
- **Loan lifecycle** — `New` → `Pending` (approver assigned) → `Approved` / `Rejected`.
- **mTLS** — both apps serve HTTPS with client-cert verification requested but not enforced (`rejectUnauthorized: false`) for easy browser access during development. Certificates live in [loan-webapp/src/certs/](loan-webapp/src/certs/) and are reused by lending-webapp.

## Contracts

Cross-app agreements are documented in [contracts/](contracts/) and declared in [workspace.yaml](workspace.yaml):

| Contract | Provider | Consumer | Covers |
|---|---|---|---|
| [loan-record](contracts/loan-record.md) | loan-webapp | lending-webapp | Loan record shape and status transitions in `data/loans.json` |
| [notify-webhook](contracts/notify-webhook.md) | lending-webapp | loan-webapp | `POST /notify` webhook and `loan-updated` SSE protocol |

## Getting Started

### Prerequisites

- Node.js (with npm)
- Docker + Docker Compose (optional, for containerized runs)

### Run locally

Install and start each app in its own terminal:

```bash
# Terminal 1
cd loan-webapp
npm install
npm run dev        # https://localhost:3000

# Terminal 2
cd lending-webapp
npm install
npm run dev        # https://localhost:3001
```

Both apps use self-signed certificates, so accept the browser security warning on first visit.

### Run with Docker

From the repo root:

```bash
docker compose up --build
```

The repo's `data/` folder is bind-mounted into both containers, so Docker and local dev share the same store. In Docker, the apps reach each other via service names (`LOAN_WEBAPP_URL`, `LENDING_WEBAPP_URL` env vars in [docker-compose.yml](docker-compose.yml)).

### Demo flow

1. Open `https://localhost:3000/loan` and create a loan → status `New`.
2. Open `https://localhost:3001/lendor` and create an approver.
3. Open the loan from the lending dashboard, assign the approver → status `Pending`.
4. Approve or reject → status `Approved` / `Rejected`. The loan-webapp dashboard updates automatically via SSE.

## Testing

E2E tests are handled by [se-harness](https://github.com/rbhattarai/se-harness) — a Claude Code plugin that bootstraps software engineering projects with AI agents, skills, MCP servers, rules, and instructions. Its Playwright MCP test agents drive both apps end to end.

## Repository Structure

```
demo-loan-app/
├── loan-webapp/         # Borrower-facing app (port 3000)
├── lending-webapp/      # Lender-facing app (port 3001)
├── data/                # Shared JSON data store
│   ├── loans.json
│   └── loan-approvers.json
├── contracts/           # Cross-app contract docs
│   ├── loan-record.md
│   └── notify-webhook.md
├── docker-compose.yml   # Runs both apps; bind-mounts data/ into both containers
└── workspace.yaml       # Multi-unit workspace manifest (units + contracts)
```