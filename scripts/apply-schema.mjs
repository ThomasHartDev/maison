import { neon } from "@neondatabase/serverless";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) throw new Error("DATABASE_URL env var is required");
const sql = neon(DATABASE_URL);

const statements = [
  `CREATE SCHEMA IF NOT EXISTS "public"`,

  `CREATE TABLE IF NOT EXISTS "collections" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "name" TEXT NOT NULL,
    "launchDate" TIMESTAMP(3),
    "notes" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "collections_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "manufacturers" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "termsDays" INTEGER,
    "proformaPercent" DOUBLE PRECISION,
    "downpaymentPercent" DOUBLE PRECISION,
    "manufacturingStart" INTEGER,
    "fabricOrderTime" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "manufacturers_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "countries" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "name" TEXT NOT NULL,
    "fastBoatFastest" INTEGER,
    "fastBoatSlowest" INTEGER,
    "slowBoatFastest" INTEGER,
    "slowBoatSlowest" INTEGER,
    "airFastest" INTEGER,
    "airSlowest" INTEGER,
    "tariffPercent" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "countries_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "collection_countries" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "shipMethod" TEXT,
    "collectionId" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "collection_countries_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "logistics_teams" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "logistics_teams_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "logistics_team_countries" (
    "logisticsTeamId" TEXT NOT NULL,
    "countryId" TEXT NOT NULL,
    CONSTRAINT "logistics_team_countries_pkey" PRIMARY KEY ("logisticsTeamId","countryId")
  )`,

  `CREATE TABLE IF NOT EXISTS "sku_master" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "skuPrefix" TEXT,
    "productName" TEXT,
    "manufacturerSku" TEXT,
    "color" TEXT,
    "cost" TEXT,
    "collectionName" TEXT,
    "factory" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "sku_master_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "inventory_items" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "productImageUrl" TEXT,
    "styleProductionName" TEXT,
    "finalName" TEXT,
    "productNotes" TEXT,
    "manufacturerSku" TEXT,
    "shopifyPrice" DOUBLE PRECISION,
    "fullJessaKaeSku" TEXT,
    "warehouseReceipts" TEXT,
    "tags" TEXT[],
    "collectionId" TEXT,
    "manufacturerId" TEXT,
    "skuMasterId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "inventory_items_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "purchase_orders" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "sendPo" TEXT,
    "lateProduct" TEXT,
    "orderStatus" TEXT,
    "shipByDateAgreed" TIMESTAMP(3),
    "poNotes" TEXT,
    "orderDate" TIMESTAMP(3),
    "separatePricing" TEXT,
    "singleProductCost" DOUBLE PRECISION,
    "straightSizeCost" DOUBLE PRECISION,
    "plusSizeCost" DOUBLE PRECISION,
    "salePrice" DOUBLE PRECISION,
    "shootSampleStatus" TEXT,
    "sendShootSamplesAgreed" TIMESTAMP(3),
    "tags" TEXT[],
    "womensSizes" JSONB,
    "womensNumericSizes" JSONB,
    "girlsSizes" JSONB,
    "inventoryItemId" TEXT,
    "manufacturerId" TEXT,
    "collectionCountryId" TEXT,
    "collectionId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "purchase_orders_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "invoices" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "name" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "paidForPickup" TEXT,
    "shippingMethod" TEXT,
    "shippingStatus" TEXT,
    "invoiceNotes" TEXT,
    "logisticsTrackingNo" TEXT,
    "notifiedLogisticsDate" TIMESTAMP(3),
    "actualDepartureDate" TIMESTAMP(3),
    "expectedArrivalDate" TIMESTAMP(3),
    "actualArrivalDate" TIMESTAMP(3),
    "downpaymentDueDate" TIMESTAMP(3),
    "tariffPaid" DOUBLE PRECISION,
    "manufacturerId" TEXT,
    "logisticsTeamId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "invoice_line_items" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "unitPrice" DOUBLE PRECISION,
    "actualQtyReceived" INTEGER,
    "receivingTeamNotes" TEXT,
    "womensSizes" JSONB,
    "womensNumericSizes" JSONB,
    "girlsSizes" JSONB,
    "invoiceId" TEXT,
    "inventoryItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "invoice_line_items_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "purchase_order_invoice_lines" (
    "purchaseOrderId" TEXT NOT NULL,
    "invoiceLineItemId" TEXT NOT NULL,
    CONSTRAINT "purchase_order_invoice_lines_pkey" PRIMARY KEY ("purchaseOrderId","invoiceLineItemId")
  )`,

  `CREATE TABLE IF NOT EXISTS "logistics_invoices" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "logisticsInvoiceNo" TEXT,
    "amountDue" DOUBLE PRECISION,
    "chargeType" TEXT,
    "invoiceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "logistics_invoices_pkey" PRIMARY KEY ("id")
  )`,

  `CREATE TABLE IF NOT EXISTS "receiving" (
    "id" TEXT NOT NULL,
    "airtableId" TEXT,
    "totalPackingListQty" INTEGER,
    "status" TEXT,
    "womensSizesReceived" JSONB,
    "womensNumericReceived" JSONB,
    "girlsSizesReceived" JSONB,
    "invoiceLineItemId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "receiving_pkey" PRIMARY KEY ("id")
  )`,

  // Unique indexes
  `CREATE UNIQUE INDEX IF NOT EXISTS "collections_airtableId_key" ON "collections"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "manufacturers_airtableId_key" ON "manufacturers"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "countries_airtableId_key" ON "countries"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "collection_countries_airtableId_key" ON "collection_countries"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "logistics_teams_airtableId_key" ON "logistics_teams"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "sku_master_airtableId_key" ON "sku_master"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "inventory_items_airtableId_key" ON "inventory_items"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "purchase_orders_airtableId_key" ON "purchase_orders"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "invoices_airtableId_key" ON "invoices"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "invoice_line_items_airtableId_key" ON "invoice_line_items"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "logistics_invoices_airtableId_key" ON "logistics_invoices"("airtableId")`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "receiving_airtableId_key" ON "receiving"("airtableId")`,

  // Foreign keys
  `ALTER TABLE "collection_countries" ADD CONSTRAINT "collection_countries_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "collection_countries" ADD CONSTRAINT "collection_countries_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "collection_countries" ADD CONSTRAINT "collection_countries_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "logistics_team_countries" ADD CONSTRAINT "logistics_team_countries_logisticsTeamId_fkey" FOREIGN KEY ("logisticsTeamId") REFERENCES "logistics_teams"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "logistics_team_countries" ADD CONSTRAINT "logistics_team_countries_countryId_fkey" FOREIGN KEY ("countryId") REFERENCES "countries"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "inventory_items" ADD CONSTRAINT "inventory_items_skuMasterId_fkey" FOREIGN KEY ("skuMasterId") REFERENCES "sku_master"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_collectionCountryId_fkey" FOREIGN KEY ("collectionCountryId") REFERENCES "collection_countries"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "collections"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "invoices" ADD CONSTRAINT "invoices_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "manufacturers"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "invoices" ADD CONSTRAINT "invoices_logisticsTeamId_fkey" FOREIGN KEY ("logisticsTeamId") REFERENCES "logistics_teams"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "invoice_line_items" ADD CONSTRAINT "invoice_line_items_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "inventory_items"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "purchase_order_invoice_lines" ADD CONSTRAINT "purchase_order_invoice_lines_purchaseOrderId_fkey" FOREIGN KEY ("purchaseOrderId") REFERENCES "purchase_orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "purchase_order_invoice_lines" ADD CONSTRAINT "purchase_order_invoice_lines_invoiceLineItemId_fkey" FOREIGN KEY ("invoiceLineItemId") REFERENCES "invoice_line_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE`,
  `ALTER TABLE "logistics_invoices" ADD CONSTRAINT "logistics_invoices_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
  `ALTER TABLE "receiving" ADD CONSTRAINT "receiving_invoiceLineItemId_fkey" FOREIGN KEY ("invoiceLineItemId") REFERENCES "invoice_line_items"("id") ON DELETE SET NULL ON UPDATE CASCADE`,
];

async function main() {
  console.log("Applying schema to Neon...");
  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const label = stmt.trim().substring(0, 60).replace(/\n/g, " ");
    try {
      await sql.query(stmt);
      console.log(`  [${i + 1}/${statements.length}] OK: ${label}...`);
    } catch (e) {
      if (e.message?.includes("already exists")) {
        console.log(`  [${i + 1}/${statements.length}] SKIP (exists): ${label}...`);
      } else {
        console.error(`  [${i + 1}/${statements.length}] FAIL: ${label}...`);
        console.error(`    ${e.message}`);
      }
    }
  }
  console.log("\nDone! Schema applied.");

  // Verify tables
  const tables = await sql`SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename`;
  console.log("\nTables created:");
  tables.forEach((t) => console.log(`  - ${t.tablename}`));
}

main().catch(console.error);
