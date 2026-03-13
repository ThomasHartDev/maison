import type { Dress, DressStatus, Message, Quantities, Shipment } from "@/types";
import { uid, qM } from "@/lib/helpers";

const IMGS = [
  "1558618047-f4042eb19143", "1515886153-7f5c45b725b3", "1496747611-3c77fbe12163",
  "1502716534-e75a37f3bcdf", "1518577915-9d1a8a3d8e29", "1524504388-b8b4e1c1ecb0",
  "1549062572-544a64df2316", "1551803091-2d30ba8e8e64", "1562572159-5c4b5ecb55a3",
  "1544966503-39e4e70eb3ae", "1583846783-07850e1f0a87", "1596783894-78d8b5d39c88",
];

function mkDress(
  po: string, name: string, col: string, mfr: string, status: DressStatus,
  due: string, ordered: string, qty: Quantities, imgI: number, alerts: string[] = [],
): Dress {
  return {
    id: uid(), poNumber: po, name, collectionId: col, manufacturerId: mfr, status, dueDate: due,
    orderDate: ordered, quantities: qty,
    imageUrl: `https://images.unsplash.com/photo-${IMGS[imgI]}?w=400&q=75`,
    milestones: [
      { label: "Fabric Sourced", done: ["production", "ontrack", "shipped", "received"].includes(status) },
      { label: "Cutting", done: ["ontrack", "shipped", "received"].includes(status) },
      { label: "Sewing", done: ["shipped", "received"].includes(status) },
      { label: "QC Passed", done: ["shipped", "received"].includes(status) },
      { label: "Dispatched", done: status === "received" },
    ],
    timeline: [{
      id: uid(), date: ordered, time: "9:00 AM", type: "system",
      source: "PO Created", content: `PO ${po} submitted`, user: "Sofia Marte", category: "design",
    }],
    alerts,
  };
}

export const SEED_DRESSES: Dress[] = [
  mkDress("PO-001", "Florentine Wrap",  "col-1", "mfr-1", "ontrack",    "2025-03-18", "2025-01-10", qM(20, 50, 80, 60, 30, 10), 0),
  mkDress("PO-002", "C\u00f4te d'Azur Midi", "col-1", "mfr-2", "production", "2025-03-25", "2025-01-12", qM(15, 40, 70, 55, 25, 8), 1),
  mkDress("PO-003", "Riviera Maxi",     "col-1", "mfr-3", "delayed",    "2025-03-15", "2025-01-05", qM(10, 35, 60, 50, 20, 5), 2, ["Fabric supplier delayed \u2014 ETA pushed 2 weeks"]),
  mkDress("PO-004", "Capri Shift",      "col-1", "mfr-1", "ontrack",    "2025-04-01", "2025-01-15", qM(18, 45, 75, 58, 28, 9), 3),
  mkDress("PO-005", "Amalfi Slip",      "col-1", "mfr-2", "production", "2025-04-05", "2025-01-18", qM(12, 38, 65, 52, 22, 7), 4),
  mkDress("PO-006", "Portofino Pleat",  "col-1", "mfr-3", "submitted",  "2025-04-10", "2025-01-20", qM(14, 42, 68, 54, 24, 8), 5),
  mkDress("PO-007", "Sorrento Tiered",  "col-1", "mfr-1", "production", "2025-04-12", "2025-01-22", qM(16, 44, 72, 56, 26, 8), 6),
  mkDress("PO-008", "Santorini Ruffle", "col-1", "mfr-2", "draft",      "2025-04-15", "2025-01-25", qM(0, 0, 0, 0, 0, 0), 7),
  mkDress("PO-009", "Mykonos Linen",    "col-1", "mfr-3", "draft",      "2025-04-20", "2025-01-28", qM(0, 0, 0, 0, 0, 0), 8),
  mkDress("PO-010", "Aegean Halter",    "col-1", "mfr-1", "draft",      "2025-04-25", "2025-02-01", qM(0, 0, 0, 0, 0, 0), 9),
  mkDress("PO-011", "Naxos Broderie",   "col-2", "mfr-2", "submitted",  "2025-05-15", "2025-02-10", qM(20, 48, 78, 60, 28, 10), 10),
  mkDress("PO-012", "Paros Cutout",     "col-2", "mfr-3", "submitted",  "2025-05-20", "2025-02-12", qM(18, 44, 72, 55, 25, 9), 11),
];

export const SEED_SHIPMENTS: Shipment[] = [
  {
    id: "SHP-001", dressIds: [], carrier: "DHL Express", trackingNo: "DHL928374",
    eta: "2025-03-20", method: "air", mfrId: "mfr-1", status: "In Transit",
    lastUpdate: "Departed Mumbai hub \u2014 in transit to JFK", units: 0,
    updates: [
      { date: "2025-02-20", time: "8:00 AM", type: "tracking", content: "Shipment picked up from Trims facility, Mumbai" },
      { date: "2025-02-22", time: "2:15 PM", type: "tracking", content: "Cleared customs, Mumbai airport" },
      { date: "2025-02-23", time: "6:40 AM", type: "tracking", content: "Departed Mumbai hub \u2014 in transit to JFK" },
      { date: "2025-02-22", time: "10:00 AM", type: "email", content: "DHL confirmation: Your shipment DHL928374 is in transit. ETA March 20.", from: "DHL Express" },
    ],
  },
  {
    id: "SHP-002", dressIds: [], carrier: "Maersk", trackingNo: "MSK4471029",
    eta: "2025-04-10", method: "sea", mfrId: "mfr-2", status: "Awaiting Pickup",
    lastUpdate: "Container loaded at Shanghai port", units: 0,
    updates: [
      { date: "2025-02-18", time: "3:00 PM", type: "tracking", content: "Container loaded at Shanghai port" },
      { date: "2025-02-19", time: "9:30 AM", type: "email", content: "Maersk booking confirmed for container MSK4471029. Vessel departure scheduled Feb 25.", from: "Maersk Line" },
    ],
  },
];

export const SEED_MSGS: Message[] = [
  { id: uid(), from: "Trims", channel: "whatsapp", content: "Hi! Fabric for PO-001 Florentine Wrap passed QC \u2014 moving to cutting tomorrow.", date: "2025-02-24", time: "9:14 AM", linkedDressIds: [], needsReview: false, resolved: true, category: "design" },
  { id: uid(), from: "Bidier", channel: "whatsapp", content: "Unfortunately fabric supplier for PO-003 Riviera Maxi has delayed shipment by 2 weeks.", date: "2025-02-23", time: "3:42 PM", linkedDressIds: [], needsReview: false, resolved: true, category: "design" },
  { id: uid(), from: "DHL Express", channel: "email", content: "Tracking update: Shipment DHL928374 has departed Mumbai hub and is in transit to JFK. ETA March 20.", date: "2025-02-23", time: "6:45 AM", linkedDressIds: [], needsReview: false, resolved: true, category: "shipping" },
  { id: uid(), from: "Tomorrow Fashion", channel: "email", content: "Production progress report: PO-002 and PO-005 both on schedule. Sample photos attached.", date: "2025-02-22", time: "11:30 AM", linkedDressIds: [], needsReview: false, resolved: true, category: "design" },
  { id: uid(), from: "Maersk Line", channel: "email", content: "Booking confirmed for container MSK4471029. Vessel departure Feb 25 from Shanghai.", date: "2025-02-19", time: "9:30 AM", linkedDressIds: [], needsReview: false, resolved: true, category: "shipping" },
  { id: uid(), from: "Bidier", channel: "whatsapp", content: "We have finished the first batch, checking quality now. Some minor stitching issues.", date: "2025-02-21", time: "4:10 PM", linkedDressIds: [], needsReview: true, resolved: false, category: "design" },
];
