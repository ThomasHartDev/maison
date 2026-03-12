# Maison

Fashion operations platform that uses AI to parse WhatsApp and email messages into purchase order mutations. Built for small fashion brands managing production across multiple manufacturers.

## What it does

- **Purchase Order Tracking** — track dresses through production stages (fabric sourcing, cutting, sewing, QC, dispatch)
- **Shipment Management** — monitor sea/air freight with delay cascade (delayed shipment auto-updates linked POs)
- **Unified Inbox** — WhatsApp and email from manufacturers, auto-linked to relevant POs
- **Role-Based Access** — admin, logistics, marketing, design, warehouse each see what they need
- **Collection Overview** — seasonal collections with progress rings and slot tracking

## Current State

MVP frontend with seed data. All state is client-side — no backend, database, or AI integration yet.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Login with any role — password is `pass`.

| Role | Email |
|---|---|
| Admin | admin@brand.com |
| Logistics | logistics@brand.com |
| Marketing | marketing@brand.com |
| Design | design@brand.com |
| Warehouse | warehouse@brand.com |

## Stack

- Next.js 16 (App Router)
- React (client-side SPA for now)
- TypeScript project (MVP component in JSX)

## License

Private
