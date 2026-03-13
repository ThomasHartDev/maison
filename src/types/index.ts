/* ─── TYPES ──────────────────────────────────────────────────────────────── */

export type DressStatus = "draft" | "submitted" | "production" | "ontrack" | "delayed" | "shipped" | "received" | "cancelled";

export type TimelineType = "system" | "comment" | "image" | "whatsapp" | "email" | "alert" | "shipping";

export type TimelineCategory = "design" | "shipping";

export type MessageChannel = "whatsapp" | "email";

export type ShipmentMethod = "sea" | "air";

export type ShipmentStatus = "Awaiting Pickup" | "In Transit" | "Customs" | "Delayed" | "Delivered";

export type Role = "admin" | "logistics" | "marketing" | "design" | "warehouse";

export type TabId = "home" | "dresses" | "inbox" | "shipments";

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type Quantities = Record<Size, number>;

export interface StatusConfig {
  color: string;
  label: string;
  bg: string;
}

export interface TimelineEntry {
  id: string;
  date: string;
  time: string;
  type: TimelineType;
  source: string;
  content: string;
  user: string;
  imageUrl?: string | null;
  category: TimelineCategory;
}

export interface Milestone {
  label: string;
  done: boolean;
}

export interface Dress {
  id: string;
  poNumber: string;
  name: string;
  collectionId: string;
  manufacturerId: string;
  status: DressStatus;
  dueDate: string;
  orderDate: string;
  quantities: Quantities;
  imageUrl: string;
  milestones: Milestone[];
  timeline: TimelineEntry[];
  alerts: string[];
}

export interface Collection {
  id: string;
  name: string;
  shortName: string;
  color: string;
  slots: number;
}

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  seaWeeks: number;
  airDays: number;
}

export interface ShipmentUpdate {
  date: string;
  time: string;
  type: "tracking" | "email";
  content: string;
  from?: string;
}

export interface Shipment {
  id: string;
  dressIds: string[];
  carrier: string;
  trackingNo: string;
  eta: string;
  method: ShipmentMethod;
  mfrId: string;
  status: ShipmentStatus;
  lastUpdate: string;
  units: number;
  updates: ShipmentUpdate[];
}

export interface Message {
  id: string;
  from: string;
  channel: MessageChannel;
  content: string;
  date: string;
  time: string;
  read?: boolean;
  linkedDressIds: string[];
  needsReview: boolean;
  resolved: boolean;
  category: TimelineCategory;
}

export interface User {
  id: string;
  email: string;
  pass: string;
  role: Role;
  name: string;
}

export interface NewPOForm {
  name: string;
  collectionId: string;
  manufacturerId: string;
  dueDate: string;
  imageUrl: string;
  quantities: Quantities;
}

export interface NewShipmentForm {
  dressIds: string[];
  carrier: string;
  trackingNo: string;
  eta: string;
  method: ShipmentMethod;
  mfrId: string;
}

export interface ComposeForm {
  to: string;
  channel: MessageChannel;
  body: string;
  linkedDressIds: string[];
}
