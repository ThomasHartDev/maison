import { pgTable, text, integer, doublePrecision, timestamp, jsonb, primaryKey } from "drizzle-orm/pg-core";

// ─── Users ──────────────────────────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("logistics"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Audit Log ──────────────────────────────────────────────────────────────────

export const auditLog = pgTable("audit_log", {
  id: text("id").primaryKey(),
  purchaseOrderId: text("purchaseOrderId").notNull(),
  userId: text("userId"),
  userName: text("userName").notNull(),
  action: text("action").notNull(),
  field: text("field"),
  oldValue: text("oldValue"),
  newValue: text("newValue"),
  source: text("source").notNull().default("manual"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Collections ────────────────────────────────────────────────────────────────

export const collections = pgTable("collections", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  name: text("name").notNull(),
  launchDate: timestamp("launchDate", { precision: 3 }),
  notes: text("notes"),
  imageUrl: text("imageUrl"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Manufacturers ──────────────────────────────────────────────────────────────

export const manufacturers = pgTable("manufacturers", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  name: text("name").notNull(),
  country: text("country").notNull(),
  termsDays: integer("termsDays"),
  proformaPercent: doublePrecision("proformaPercent"),
  downpaymentPercent: doublePrecision("downpaymentPercent"),
  manufacturingStart: integer("manufacturingStart"),
  fabricOrderTime: integer("fabricOrderTime"),
  notes: text("notes"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Countries ──────────────────────────────────────────────────────────────────

export const countries = pgTable("countries", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  name: text("name").notNull(),
  fastBoatFastest: integer("fastBoatFastest"),
  fastBoatSlowest: integer("fastBoatSlowest"),
  slowBoatFastest: integer("slowBoatFastest"),
  slowBoatSlowest: integer("slowBoatSlowest"),
  airFastest: integer("airFastest"),
  airSlowest: integer("airSlowest"),
  tariffPercent: doublePrecision("tariffPercent"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Collection x Countries ─────────────────────────────────────────────────────

export const collectionCountries = pgTable("collection_countries", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  shipMethod: text("shipMethod"),
  collectionId: text("collectionId").notNull(),
  manufacturerId: text("manufacturerId").notNull(),
  countryId: text("countryId").notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Logistics Teams ────────────────────────────────────────────────────────────

export const logisticsTeams = pgTable("logistics_teams", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  name: text("name").notNull(),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

export const logisticsTeamCountries = pgTable("logistics_team_countries", {
  logisticsTeamId: text("logisticsTeamId").notNull(),
  countryId: text("countryId").notNull(),
}, (t) => [primaryKey({ columns: [t.logisticsTeamId, t.countryId] })]);

// ─── SKU Master ─────────────────────────────────────────────────────────────────

export const skuMaster = pgTable("sku_master", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  skuPrefix: text("skuPrefix"),
  productName: text("productName"),
  manufacturerSku: text("manufacturerSku"),
  color: text("color"),
  cost: text("cost"),
  collectionName: text("collectionName"),
  factory: text("factory"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Inventory Items ────────────────────────────────────────────────────────────

export const inventoryItems = pgTable("inventory_items", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  productImageUrl: text("productImageUrl"),
  styleProductionName: text("styleProductionName"),
  finalName: text("finalName"),
  productNotes: text("productNotes"),
  manufacturerSku: text("manufacturerSku"),
  shopifyPrice: doublePrecision("shopifyPrice"),
  fullJessaKaeSku: text("fullJessaKaeSku"),
  warehouseReceipts: text("warehouseReceipts"),
  tags: text("tags").array(),
  collectionId: text("collectionId"),
  manufacturerId: text("manufacturerId"),
  skuMasterId: text("skuMasterId"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Purchase Orders ────────────────────────────────────────────────────────────

export const purchaseOrders = pgTable("purchase_orders", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  sendPo: text("sendPo"),
  lateProduct: text("lateProduct"),
  orderStatus: text("orderStatus"),
  shipByDateAgreed: timestamp("shipByDateAgreed", { precision: 3 }),
  poNotes: text("poNotes"),
  orderDate: timestamp("orderDate", { precision: 3 }),
  separatePricing: text("separatePricing"),
  singleProductCost: doublePrecision("singleProductCost"),
  straightSizeCost: doublePrecision("straightSizeCost"),
  plusSizeCost: doublePrecision("plusSizeCost"),
  salePrice: doublePrecision("salePrice"),
  shootSampleStatus: text("shootSampleStatus"),
  sendShootSamplesAgreed: timestamp("sendShootSamplesAgreed", { precision: 3 }),
  tags: text("tags").array(),
  womensSizes: jsonb("womensSizes"),
  womensNumericSizes: jsonb("womensNumericSizes"),
  girlsSizes: jsonb("girlsSizes"),
  inventoryItemId: text("inventoryItemId"),
  manufacturerId: text("manufacturerId"),
  collectionCountryId: text("collectionCountryId"),
  collectionId: text("collectionId"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Invoices ───────────────────────────────────────────────────────────────────

export const invoices = pgTable("invoices", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  name: text("name"),
  invoiceDate: timestamp("invoiceDate", { precision: 3 }),
  paidForPickup: text("paidForPickup"),
  shippingMethod: text("shippingMethod"),
  shippingStatus: text("shippingStatus"),
  invoiceNotes: text("invoiceNotes"),
  logisticsTrackingNo: text("logisticsTrackingNo"),
  notifiedLogisticsDate: timestamp("notifiedLogisticsDate", { precision: 3 }),
  actualDepartureDate: timestamp("actualDepartureDate", { precision: 3 }),
  expectedArrivalDate: timestamp("expectedArrivalDate", { precision: 3 }),
  actualArrivalDate: timestamp("actualArrivalDate", { precision: 3 }),
  downpaymentDueDate: timestamp("downpaymentDueDate", { precision: 3 }),
  tariffPaid: doublePrecision("tariffPaid"),
  manufacturerId: text("manufacturerId"),
  logisticsTeamId: text("logisticsTeamId"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Invoice Line Items ─────────────────────────────────────────────────────────

export const invoiceLineItems = pgTable("invoice_line_items", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  unitPrice: doublePrecision("unitPrice"),
  actualQtyReceived: integer("actualQtyReceived"),
  receivingTeamNotes: text("receivingTeamNotes"),
  womensSizes: jsonb("womensSizes"),
  womensNumericSizes: jsonb("womensNumericSizes"),
  girlsSizes: jsonb("girlsSizes"),
  invoiceId: text("invoiceId"),
  inventoryItemId: text("inventoryItemId"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── PO <-> Invoice Line Item junction ──────────────────────────────────────────

export const purchaseOrderInvoiceLines = pgTable("purchase_order_invoice_lines", {
  purchaseOrderId: text("purchaseOrderId").notNull(),
  invoiceLineItemId: text("invoiceLineItemId").notNull(),
}, (t) => [primaryKey({ columns: [t.purchaseOrderId, t.invoiceLineItemId] })]);

// ─── Logistics Invoices ─────────────────────────────────────────────────────────

export const logisticsInvoices = pgTable("logistics_invoices", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  logisticsInvoiceNo: text("logisticsInvoiceNo"),
  amountDue: doublePrecision("amountDue"),
  chargeType: text("chargeType"),
  invoiceId: text("invoiceId"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});

// ─── Receiving ──────────────────────────────────────────────────────────────────

export const receiving = pgTable("receiving", {
  id: text("id").primaryKey(),
  airtableId: text("airtableId").unique(),
  totalPackingListQty: integer("totalPackingListQty"),
  status: text("status"),
  womensSizesReceived: jsonb("womensSizesReceived"),
  womensNumericReceived: jsonb("womensNumericReceived"),
  girlsSizesReceived: jsonb("girlsSizesReceived"),
  invoiceLineItemId: text("invoiceLineItemId"),
  createdAt: timestamp("createdAt", { precision: 3 }).notNull().defaultNow(),
  updatedAt: timestamp("updatedAt", { precision: 3 }).notNull().defaultNow(),
});
