/* ─── TYPES ──────────────────────────────────────────────────────────────── */

export type DressStatus = "draft" | "submitted" | "production" | "ontrack" | "delayed" | "shipped" | "received" | "cancelled";

export type TimelineType = "system" | "comment" | "image" | "whatsapp" | "email" | "alert" | "shipping";

export type TimelineCategory = "design" | "shipping";

export type MessageChannel = "whatsapp" | "email";


export type Role = "admin" | "logistics" | "marketing" | "design" | "warehouse";

export type TabId = "home" | "dresses" | "inbox" | "shipments" | "chat";

export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export type Quantities = Record<Size, number>;

export type SizeBreakdown = Record<string, number>;

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
  airtableId: string | null;
  poNumber: string;
  name: string;
  status: DressStatus;

  // Real PO fields
  orderStatus: string | null;
  orderDate: string | null;
  dueDate: string | null;
  sendPo: string | null;
  lateProduct: string | null;
  poNotes: string | null;
  separatePricing: string | null;
  shootSampleStatus: string | null;
  sendShootSamplesAgreed: string | null;
  tags: string[] | null;

  // Pricing
  singleProductCost: number | null;
  straightSizeCost: number | null;
  plusSizeCost: number | null;
  salePrice: number | null;

  // Full size breakdowns from database (JSONB)
  womensSizes: SizeBreakdown | null;
  womensNumericSizes: SizeBreakdown | null;
  girlsSizes: SizeBreakdown | null;

  // Simplified 6-size breakdown for chat/display compatibility
  quantities: Quantities;

  // Inventory item details
  inventoryItemId: string | null;
  inventoryItemSku: string | null;
  imageUrl: string | null;
  productNotes: string | null;

  // Relations
  collectionId: string | null;
  collectionName: string | null;
  manufacturerId: string | null;
  manufacturerName: string | null;
  manufacturerCountry: string | null;
  shipMethod: string | null;

  // Derived display fields
  milestones: Milestone[];
  alerts: string[];
}

export interface Collection {
  id: string;
  name: string;
  launchDate: string | null;
  notes: string | null;
  imageUrl: string | null;
}

export interface Manufacturer {
  id: string;
  name: string;
  country: string;
  termsDays: number | null;
  proformaPercent: number | null;
  downpaymentPercent: number | null;
  manufacturingStart: number | null;
  fabricOrderTime: number | null;
  notes: string | null;
}

export interface Invoice {
  id: string;
  airtableId: string | null;
  name: string | null;
  invoiceDate: string | null;
  paidForPickup: string | null;
  shippingMethod: string | null;
  shippingStatus: string | null;
  invoiceNotes: string | null;
  logisticsTrackingNo: string | null;
  notifiedLogisticsDate: string | null;
  actualDepartureDate: string | null;
  expectedArrivalDate: string | null;
  actualArrivalDate: string | null;
  downpaymentDueDate: string | null;
  tariffPaid: number | null;
  manufacturerId: string | null;
  manufacturerName: string | null;
  logisticsTeamId: string | null;
  logisticsTeamName: string | null;
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

export interface ComposeForm {
  to: string;
  channel: MessageChannel;
  body: string;
  linkedDressIds: string[];
}
