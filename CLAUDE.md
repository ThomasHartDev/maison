# Maison — Fashion Operations Platform

## Vision
WhatsApp-driven purchase order management for fashion brands. Parses incoming WhatsApp and email messages using Claude API to dynamically mutate purchase order state — turning unstructured communications into real data changes.

## Current State
MVP frontend with seed data. All state is client-side. No backend, no database, no Claude integration yet.

## Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript (frontend currently in JSX — will migrate)
- **Package Manager**: npm

## Architecture
The original UI lives in `src/components/maison-app.jsx` — a single client component containing the entire MVP dashboard. This is the reference implementation that all future work builds on.

### Key Concepts
- **Purchase Orders (Dresses)**: The core entity — each PO tracks a dress through production stages
- **Collections**: Seasonal groupings of dresses (Spring, Summer, Autumn, Holiday)
- **Manufacturers**: Factories that produce the dresses (Trims, Tomorrow Fashion, Bidier)
- **Shipments**: Track physical movement of goods from manufacturer to warehouse
- **Inbox**: WhatsApp and email messages from manufacturers, linked to POs
- **Delay Cascade**: When a shipment is delayed, all linked dresses auto-update to delayed status
- **Roles**: admin, logistics, marketing, design, warehouse — each sees different tabs

## Commands
```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run lint         # ESLint
```

## Multi-Tenant Vision
Built for one store initially, designed to scale into a platform where any fashion merchant can manage their purchase orders through WhatsApp-driven automation.
