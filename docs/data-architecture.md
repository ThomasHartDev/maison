# Maison — Data Architecture

Full code trace of the MVP frontend (`src/components/maison-app.jsx`) mapping every data entity, UI data flow, required API endpoint, and the database schema needed to back it all.

## Scale Assumptions

- ~10,000 merchants (tenants) at full scale
- ~10 users per merchant on average (~100,000 total users)
- Small teams — most write operations are low-throughput (a few POs per day, a handful of messages per hour)
- Read-heavy workload — dashboards, lists, and detail views loaded far more often than data is mutated
- Multi-tenant from the start — every query scoped to a `tenant_id`

---

## 1. Data Entities (from code trace)

### Core Entities

| Entity | Current Source | Description |
|---|---|---|
| **Tenant** | _Not in MVP_ | The merchant/brand. Every other entity belongs to a tenant. |
| **User** | `USERS` constant | Team members. Roles: admin, logistics, marketing, design, warehouse. |
| **Collection** | `COLLECTIONS` constant | Seasonal groupings (Spring Bloom 2025, etc.). Has a max slot count. |
| **Manufacturer** | `MFRS` constant | Factories that produce garments. Has transit time metadata. |
| **Dress (Purchase Order)** | `SEED_DRESSES` / `useState` | The core entity — a garment being produced, with per-size quantities, production milestones, and a full activity timeline. |
| **Shipment** | `SEED_SHIPMENTS` / `useState` | Tracks physical movement of goods. Links to multiple dresses. Has its own update timeline. |
| **Message** | `SEED_MSGS` / `useState` | Incoming WhatsApp/email from manufacturers. Can be auto-linked or manually triaged to dresses. |

### Embedded/Child Entities

| Entity | Parent | Description |
|---|---|---|
| **TimelineEntry** | Dress | Activity log — comments, status changes, milestone toggles, linked messages, shipping events. |
| **Milestone** | Dress | 5 fixed production stages: Fabric Sourced → Cutting → Sewing → QC Passed → Dispatched. |
| **ShipmentUpdate** | Shipment | Tracking/email updates timeline for a shipment. |
| **DressQuantities** | Dress | Per-size unit counts: XS, S, M, L, XL, XXL. |

---

## 2. Entity Relationships

```
Tenant
 ├── 1:N → User
 ├── 1:N → Collection
 ├── 1:N → Manufacturer
 ├── 1:N → Dress
 │            ├── N:1 → Collection (collectionId)
 │            ├── N:1 → Manufacturer (manufacturerId)
 │            ├── 1:N → TimelineEntry (embedded log)
 │            └── 1:5 → Milestone (fixed production stages)
 ├── 1:N → Shipment
 │            ├── N:1 → Manufacturer (mfrId)
 │            ├── N:M → Dress (dressIds — junction table)
 │            └── 1:N → ShipmentUpdate (embedded log)
 └── 1:N → Message
              └── N:M → Dress (linkedDressIds — junction table)
```

Key details:
- **Dress ↔ Shipment** is many-to-many: a shipment contains multiple dresses, and a dress could appear in multiple shipments
- **Message ↔ Dress** is many-to-many: a message can reference multiple dresses, and a dress can be referenced by multiple messages
- **Timeline entries are denormalized copies** — when a message is linked to a dress, the message content is copied into the dress timeline (not referenced)

---

## 3. API Endpoints

Every endpoint below maps to a specific UI data flow traced from the MVP code. Grouped by entity.

### Auth

| Method | Endpoint | Request Body | Response | UI Source |
|---|---|---|---|---|
| `POST` | `/api/v1/auth/login` | `{ email, password }` | `{ user: { id, name, email, role }, token }` | `LoginScreen` — validates credentials against `USERS` constant |
| `POST` | `/api/v1/auth/logout` | — | `{ success }` | Header "Sign Out" button — `setUser(null)` |
| `GET` | `/api/v1/auth/me` | — | `{ user: { id, name, email, role } }` | App mount — restore session |

### Dresses (Purchase Orders)

| Method | Endpoint | Request Body / Params | Response | UI Source |
|---|---|---|---|---|
| `GET` | `/api/v1/dresses` | Query: `?collectionId=&status=` | `{ data: Dress[] }` | `DressesView` — filtered list with all fields for cards |
| `GET` | `/api/v1/dresses/:id` | — | `{ data: Dress }` (with timeline, milestones, quantities) | `DressDetail` overlay — full dress data |
| `POST` | `/api/v1/dresses` | `{ name, collectionId, manufacturerId, dueDate, imageUrl, quantities }` | `{ data: Dress }` | `NewPOModal` → `handleCreate` — creates PO with status "submitted" |
| `PATCH` | `/api/v1/dresses/:id/status` | `{ status }` | `{ data: Dress }` | `DressDetail.setStatus` — status change chips |
| `PATCH` | `/api/v1/dresses/:id/milestones/:index` | `{ done }` | `{ data: Dress }` | `DressDetail.toggleMs` — milestone toggle |
| `POST` | `/api/v1/dresses/:id/timeline` | `{ content, type, imageUrl? }` | `{ data: TimelineEntry }` | `DressDetail.addEntry` — comment/image upload |

### Dresses — Dashboard Aggregates

| Method | Endpoint | Response | UI Source |
|---|---|---|---|
| `GET` | `/api/v1/dashboard/stats` | `{ activePOs, delayed, needsReview, shipmentsCount }` | `HomeView` — top 4 metric cards |
| `GET` | `/api/v1/dashboard/collections` | `{ data: [{ collection, onTrack, delayed, empty, total }] }` | `HomeView` — collection cards with progress rings |
| `GET` | `/api/v1/dashboard/urgent` | `{ data: Dress[] }` (due within 21 days, not received/cancelled) | `HomeView` — "Due Within 21 Days" section |

### Collections

| Method | Endpoint | Response | UI Source |
|---|---|---|---|
| `GET` | `/api/v1/collections` | `{ data: Collection[] }` | Filter chips in `DressesView`, `HomeView` collection cards, `NewPOModal` dropdown |

### Manufacturers

| Method | Endpoint | Response | UI Source |
|---|---|---|---|
| `GET` | `/api/v1/manufacturers` | `{ data: Manufacturer[] }` | `NewPOModal` dropdown, `ShipmentsView` transit times card, dress card labels |

### Shipments

| Method | Endpoint | Request Body / Params | Response | UI Source |
|---|---|---|---|---|
| `GET` | `/api/v1/shipments` | — | `{ data: Shipment[] }` (with linked dresses summary) | `ShipmentsView` — list of shipment cards |
| `GET` | `/api/v1/shipments/:id` | — | `{ data: Shipment }` (with full updates and linked dresses) | `ShipmentDetail` overlay |
| `POST` | `/api/v1/shipments` | `{ dressIds, carrier, trackingNo, eta, method, mfrId }` | `{ data: Shipment }` | `ShipmentsView.addShip` — new shipment form |
| `PATCH` | `/api/v1/shipments/:id/status` | `{ status }` | `{ data: Shipment, cascadedDresses?: Dress[] }` | `ShipmentDetail` status chips — **triggers delay/delivery cascade server-side** |

**Cascade logic (server-side):**
- If `status = "Delayed"`: for every linked dress → set `status = "delayed"`, add alert string, add timeline entry
- If `status = "Delivered"`: for every linked dress → set `status = "received"`, add timeline entry

### Messages (Inbox)

| Method | Endpoint | Request Body / Params | Response | UI Source |
|---|---|---|---|---|
| `GET` | `/api/v1/messages` | Query: `?category=design|shipping&needsReview=true` | `{ data: Message[] }` | `InboxView` — filtered message list + triage queue |
| `GET` | `/api/v1/messages/:id` | — | `{ data: Message }` (with linked dress details) | `InboxView` — message detail view |
| `POST` | `/api/v1/messages` | `{ to, channel, body, linkedDressIds }` | `{ data: Message }` | `InboxView.send` — compose and send (also injects timeline entries into linked dresses) |
| `PATCH` | `/api/v1/messages/:id/read` | — | `{ success }` | `InboxView.markRead` — mark as read on click |
| `POST` | `/api/v1/messages/:id/link` | `{ dressId }` | `{ data: Message }` | `InboxView.linkAndApprove` — manual triage linking (also injects timeline entry into the dress) |

### Messages — Incoming (Webhook / Background)

| Method | Endpoint | Request Body | Response | Notes |
|---|---|---|---|---|
| `POST` | `/api/v1/webhooks/whatsapp` | WhatsApp webhook payload | `{ success }` | Receives incoming WhatsApp messages. Claude API parses content, auto-links to dresses via name/PO matching. Creates Message record. |
| `POST` | `/api/v1/webhooks/email` | Email webhook payload (or polled) | `{ success }` | Receives incoming emails from carriers/manufacturers. Same auto-link logic. |

### AI Integration

| Method | Endpoint | Request Body | Response | Notes |
|---|---|---|---|---|
| `POST` | `/api/v1/ai/parse-message` | `{ content, from, channel }` | `{ linkedDressIds, suggestedStatus?, suggestedAlerts?, category }` | Claude API call — takes raw message text, returns structured PO mutations. Called by webhook handlers. |

---

## 4. Data Required Per Endpoint (Input/Output Shapes)

### Dress Input (POST `/api/v1/dresses`)
```
{
  name: string              // "Florentine Wrap"
  collectionId: string      // "col-1" → FK
  manufacturerId: string    // "mfr-1" → FK
  dueDate: string           // "2025-03-18" ISO date
  imageUrl?: string         // optional design image URL
  quantities: {
    XS: number, S: number, M: number,
    L: number, XL: number, XXL: number
  }
}
```

### Dress Output (GET `/api/v1/dresses/:id`)
```
{
  id: string
  poNumber: string           // auto-generated "PO-001"
  name: string
  collectionId: string
  collection: { id, name, shortName, color }   // joined
  manufacturerId: string
  manufacturer: { id, name, country }           // joined
  status: "draft" | "submitted" | "production" | "ontrack" | "delayed" | "shipped" | "received" | "cancelled"
  dueDate: string
  orderDate: string
  quantities: { XS, S, M, L, XL, XXL }
  totalUnits: number         // computed
  daysUntilDue: number       // computed
  imageUrl?: string
  milestones: [{ label: string, done: boolean }]
  timeline: [{
    id: string, date: string, time: string,
    type: "system" | "comment" | "image" | "whatsapp" | "email" | "alert" | "shipping",
    source: string, content: string, user: string,
    imageUrl?: string, category: "design" | "shipping"
  }]
  alerts: string[]
}
```

### Shipment Input (POST `/api/v1/shipments`)
```
{
  dressIds: string[]         // linked dress IDs
  carrier: string            // "DHL Express"
  trackingNo: string         // "DHL928374"
  eta: string                // ISO date
  method: "sea" | "air"
  mfrId: string              // FK to manufacturer
}
```

### Shipment Output (GET `/api/v1/shipments/:id`)
```
{
  id: string                 // "SHP-001"
  dressIds: string[]
  dresses: [{ id, poNumber, name, imageUrl, status, totalUnits }]  // joined
  carrier: string
  trackingNo: string
  eta: string
  daysUntilEta: number       // computed
  method: "sea" | "air"
  mfrId: string
  manufacturer: { id, name, country }  // joined
  status: "Awaiting Pickup" | "In Transit" | "Customs" | "Delayed" | "Delivered"
  units: number              // sum of linked dresses' quantities
  lastUpdate: string
  updates: [{
    date: string, time: string,
    type: "tracking" | "email",
    content: string, from?: string
  }]
}
```

### Message Input (POST `/api/v1/messages`)
```
{
  to: string                 // recipient
  channel: "whatsapp" | "email"
  body: string
  linkedDressIds: string[]
}
```

### Message Output (GET `/api/v1/messages/:id`)
```
{
  id: string
  from: string
  channel: "whatsapp" | "email"
  content: string
  date: string
  time: string
  read: boolean
  linkedDressIds: string[]
  linkedDresses: [{ id, poNumber, name }]  // joined
  needsReview: boolean
  resolved: boolean
  category: "design" | "shipping"
}
```

---

## 5. Database Selection

### Recommendation: PostgreSQL (via Neon)

**Why Postgres:**

| Factor | Assessment |
|---|---|
| **Data model** | Highly relational — dresses reference collections and manufacturers, shipments and messages reference dresses via junction tables. This is textbook relational data. |
| **Scale** | ~10k tenants, ~100k users, maybe a few million dresses and messages total. Postgres handles this trivially without sharding. |
| **Multi-tenancy** | Row-level tenant isolation via `tenant_id` on every table. Simple, proven, efficient. No need for schema-per-tenant at this scale. |
| **Queries** | Dashboard aggregates (counts, grouping by status/collection), filtered lists, joined detail views. All things Postgres excels at. |
| **JSONB for flexibility** | Timeline entries and quantities can use JSONB columns — avoids over-normalization while keeping queryability. |
| **Operational simplicity** | Neon provides serverless Postgres with autoscaling, branching for dev/staging, and connection pooling built in. No ops overhead. |

**Why NOT other databases:**

| Option | Why Not |
|---|---|
| **MongoDB** | The data is clearly relational (FK references, junction tables, join-heavy reads). Mongo would force denormalization and lose referential integrity. |
| **DynamoDB** | Same issue — the access patterns involve multi-entity joins and filtered aggregations that DynamoDB handles poorly without complex GSI designs. |
| **SQLite** | No multi-tenant server deployment story. Good for local-first but not a multi-tenant SaaS. |
| **Redis** | Complementary for caching/sessions, not a primary store for this data. |

### Infrastructure

- **Neon** for managed serverless Postgres (already set up in the toolchain)
- **Prisma** as the ORM — type-safe queries, migration management, schema-as-code
- **Connection pooling** via Neon's built-in pooler (no PgBouncer needed at this scale)

---

## 6. Database Schema

### Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ─── Multi-tenancy ──────────────────────────────────────────

model Tenant {
  id        String   @id @default(cuid())
  name      String                          // "Maison Atelier"
  slug      String   @unique                // URL-safe identifier
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  users         User[]
  collections   Collection[]
  manufacturers Manufacturer[]
  dresses       Dress[]
  shipments     Shipment[]
  messages      Message[]

  @@map("tenants")
}

// ─── Auth & Users ───────────────────────────────────────────

enum Role {
  admin
  logistics
  marketing
  design
  warehouse
}

model User {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  email     String
  name      String
  role      Role
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, email])
  @@index([tenantId])
  @@map("users")
}

// ─── Reference Data ─────────────────────────────────────────

model Collection {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  name      String                          // "Spring Bloom 2025"
  shortName String                          // "Spring"
  color     String                          // "#27855a"
  slots     Int                             // max capacity (12 in MVP)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  dresses Dress[]

  @@index([tenantId])
  @@map("collections")
}

model Manufacturer {
  id        String   @id @default(cuid())
  tenantId  String
  tenant    Tenant   @relation(fields: [tenantId], references: [id])
  name      String                          // "Trims"
  country   String                          // "India"
  seaWeeks  Int                             // weeks for sea freight
  airDays   Int                             // days for air freight
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  dresses   Dress[]
  shipments Shipment[]

  @@index([tenantId])
  @@map("manufacturers")
}

// ─── Core: Dress (Purchase Order) ───────────────────────────

enum DressStatus {
  draft
  submitted
  production
  ontrack
  delayed
  shipped
  received
  cancelled
}

model Dress {
  id             String      @id @default(cuid())
  tenantId       String
  tenant         Tenant      @relation(fields: [tenantId], references: [id])
  poNumber       String                     // "PO-001" — auto-generated per tenant
  name           String                     // "Florentine Wrap"
  collectionId   String
  collection     Collection  @relation(fields: [collectionId], references: [id])
  manufacturerId String
  manufacturer   Manufacturer @relation(fields: [manufacturerId], references: [id])
  status         DressStatus @default(draft)
  dueDate        DateTime
  orderDate      DateTime    @default(now())
  imageUrl       String?
  quantities     Json                       // { XS: 20, S: 50, M: 80, L: 60, XL: 30, XXL: 10 }
  alerts         String[]    @default([])   // free-text alert strings

  milestones     Milestone[]
  timelineEntries TimelineEntry[]
  shipments      ShipmentDress[]
  messages       MessageDress[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, poNumber])
  @@index([tenantId])
  @@index([tenantId, collectionId])
  @@index([tenantId, status])
  @@map("dresses")
}

// ─── Milestones (fixed production stages per dress) ─────────

model Milestone {
  id       String  @id @default(cuid())
  dressId  String
  dress    Dress   @relation(fields: [dressId], references: [id], onDelete: Cascade)
  label    String                            // "Fabric Sourced", "Cutting", etc.
  done     Boolean @default(false)
  sortOrder Int                              // 0-4 for display ordering

  @@index([dressId])
  @@map("milestones")
}

// ─── Timeline (activity log per dress) ──────────────────────

enum TimelineType {
  system
  comment
  image
  whatsapp
  email
  alert
  shipping
}

enum TimelineCategory {
  design
  shipping
}

model TimelineEntry {
  id       String           @id @default(cuid())
  dressId  String
  dress    Dress            @relation(fields: [dressId], references: [id], onDelete: Cascade)
  date     DateTime
  type     TimelineType
  source   String                            // "PO Created", "WhatsApp from Trims", etc.
  content  String
  user     String                            // display name of who created it
  imageUrl String?
  category TimelineCategory @default(design)

  createdAt DateTime @default(now())

  @@index([dressId])
  @@index([dressId, category])
  @@map("timeline_entries")
}

// ─── Shipments ──────────────────────────────────────────────

enum ShipmentStatus {
  awaiting_pickup
  in_transit
  customs
  delayed
  delivered
}

enum ShipmentMethod {
  sea
  air
}

model Shipment {
  id             String         @id @default(cuid())
  tenantId       String
  tenant         Tenant         @relation(fields: [tenantId], references: [id])
  shipmentNumber String                      // "SHP-001" — auto-generated per tenant
  carrier        String                      // "DHL Express", "Maersk"
  trackingNo     String?
  eta            DateTime?
  method         ShipmentMethod
  mfrId          String
  manufacturer   Manufacturer   @relation(fields: [mfrId], references: [id])
  status         ShipmentStatus @default(awaiting_pickup)
  lastUpdate     String?

  dresses  ShipmentDress[]
  updates  ShipmentUpdate[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, shipmentNumber])
  @@index([tenantId])
  @@map("shipments")
}

// Junction: Shipment ↔ Dress (many-to-many)
model ShipmentDress {
  shipmentId String
  shipment   Shipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  dressId    String
  dress      Dress    @relation(fields: [dressId], references: [id], onDelete: Cascade)

  @@id([shipmentId, dressId])
  @@map("shipment_dresses")
}

model ShipmentUpdate {
  id         String   @id @default(cuid())
  shipmentId String
  shipment   Shipment @relation(fields: [shipmentId], references: [id], onDelete: Cascade)
  date       DateTime
  type       String                          // "tracking" | "email"
  content    String
  from       String?                         // sender for email-type updates

  createdAt DateTime @default(now())

  @@index([shipmentId])
  @@map("shipment_updates")
}

// ─── Messages (Inbox) ───────────────────────────────────────

enum MessageChannel {
  whatsapp
  email
}

enum MessageCategory {
  design
  shipping
}

model Message {
  id             String          @id @default(cuid())
  tenantId       String
  tenant         Tenant          @relation(fields: [tenantId], references: [id])
  from           String                      // sender name
  channel        MessageChannel
  content        String
  date           DateTime
  read           Boolean         @default(false)
  needsReview    Boolean         @default(false)
  resolved       Boolean         @default(false)
  category       MessageCategory @default(design)

  dresses MessageDress[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([tenantId])
  @@index([tenantId, needsReview, resolved])
  @@index([tenantId, category])
  @@map("messages")
}

// Junction: Message ↔ Dress (many-to-many)
model MessageDress {
  messageId String
  message   Message @relation(fields: [messageId], references: [id], onDelete: Cascade)
  dressId   String
  dress     Dress   @relation(fields: [dressId], references: [id], onDelete: Cascade)

  @@id([messageId, dressId])
  @@map("message_dresses")
}
```

### Index Strategy

All tables are indexed on `tenantId` since every query is tenant-scoped. Additional composite indexes:

| Table | Index | Purpose |
|---|---|---|
| `dresses` | `(tenantId, collectionId)` | Filter dresses by collection on the dresses view |
| `dresses` | `(tenantId, status)` | Filter dresses by status, count delayed/active for dashboard |
| `dresses` | `(tenantId, poNumber)` unique | PO number lookup for auto-linking messages |
| `timeline_entries` | `(dressId)` | Load timeline for dress detail |
| `timeline_entries` | `(dressId, category)` | Filter timeline by design/shipping |
| `messages` | `(tenantId, needsReview, resolved)` | Triage queue query |
| `messages` | `(tenantId, category)` | Inbox filtering by design/shipping |
| `milestones` | `(dressId)` | Load milestones for dress detail |
| `shipment_updates` | `(shipmentId)` | Load updates for shipment detail |

### Why JSONB for Quantities

The `quantities` field on `Dress` uses Postgres JSONB instead of 6 separate columns because:
1. Sizes might vary by tenant (not everyone uses XS-XXL)
2. It's only read as a whole object, never queried by individual size
3. Prisma handles JSON fields cleanly with type safety via Zod validation at the API layer

---

## 7. Role-Based Access Matrix

Server-side enforcement (the MVP only does UI-level tab hiding):

| Resource | admin | logistics | marketing | design | warehouse |
|---|---|---|---|---|---|
| Dashboard (read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dresses (read) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Dresses (create PO) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Dresses (change status) | ✅ | ✅ | ❌ | ✅ | ✅ |
| Dresses (toggle milestones) | ✅ | ✅ | ❌ | ✅ | ✅ |
| Dresses (add timeline entry) | ✅ | ✅ | ✅ | ✅ | ✅ |
| Inbox (read) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Inbox (compose) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Inbox (triage/link) | ✅ | ❌ | ❌ | ✅ | ❌ |
| Shipments (read) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Shipments (create) | ✅ | ✅ | ❌ | ❌ | ✅ |
| Shipments (change status) | ✅ | ✅ | ❌ | ❌ | ✅ |

---

## 8. Key Server-Side Business Logic

These operations currently happen in client-side state management. They need to move server-side:

### Delay Cascade
When `PATCH /api/v1/shipments/:id/status` receives `{ status: "Delayed" }`:
1. Update shipment status
2. For each linked dress (via `shipment_dresses` junction):
   - Set dress `status = "delayed"`
   - Append alert string: `"Shipment {id} ({carrier}) marked as delayed"`
   - Insert timeline entry with `type = "shipping"`, `category = "shipping"`
3. Return updated shipment + affected dresses
4. **Run in a transaction** — all-or-nothing

### Delivery Cascade
When status is `"Delivered"`:
1. Update shipment status
2. For each linked dress:
   - Set dress `status = "received"`
   - Insert timeline entry
3. Transaction-wrapped

### Message Auto-Linking
When a new message arrives (via webhook or compose):
1. Run `matchDress(content, tenantDresses)` — substring match on dress name or PO number
2. If matches found:
   - Create `message_dresses` junction records
   - Insert timeline entries into each matched dress
   - Set `needsReview = false`, `resolved = true`
3. If no matches:
   - Set `needsReview = true`, `resolved = false`
   - Message appears in triage queue

### AI Message Parsing (future)
When Claude API is integrated:
1. Incoming message hits webhook
2. Call Claude to parse: extract PO references, suggested status changes, alerts
3. Auto-link and optionally auto-mutate PO state (with review queue for low-confidence parses)

---

## 9. Migration Path (MVP → Backend)

| Phase | What Changes |
|---|---|
| **Phase 1** (current) | All data in client-side React state. Seed data. No persistence. |
| **Phase 2** | Stand up Postgres via Neon. Create Prisma schema. Seed database. Replace hardcoded constants with API calls. Login hits real auth. |
| **Phase 3** | CRUD endpoints for dresses, shipments, messages. Move cascade logic server-side. Real-time via polling or SSE. |
| **Phase 4** | WhatsApp Business API webhook integration. Claude API for message parsing. Auto-linking and AI-suggested mutations. |
| **Phase 5** | Multi-tenant onboarding flow. Tenant isolation enforced. Invite system for team members. |
