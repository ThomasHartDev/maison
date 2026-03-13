/**
 * Airtable → Neon migration script
 *
 * Pulls all records from the JSK Supply Chain Airtable base
 * and inserts them into the Neon Postgres database.
 *
 * Resolves Airtable record IDs to our internal cuid-style IDs.
 */

import { neon } from "@neondatabase/serverless";
import { randomUUID } from "crypto";

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appDNZECaH78fxEdE";
const DATABASE_URL = process.env.DATABASE_URL;

if (!AIRTABLE_PAT) throw new Error("AIRTABLE_PAT env var is required");
if (!DATABASE_URL) throw new Error("DATABASE_URL env var is required");

const sql = neon(DATABASE_URL);

// Table IDs from the schema
const TABLES = {
  collections: "tblaVQGrpMNyYyB0b",
  manufacturers: "tblK5wZ0gIlxmrEgZ",
  countries: "tblG5vDFyMx8v6Unl",
  collectionCountries: "tbllZfsRTUcTMCeQw",
  logisticsTeams: "tblGmRaKNTKq1QE4g",
  inventoryItems: "tbl60avYfBVZbgVvE",
  purchaseOrders: "tblIIN5Drgyd4w7I6",
  invoices: "tblSNJh1b2qmh8CdV",
  invoiceLineItems: "tblNy0qAZ1rVhqYAB",
  logisticsInvoices: "tblxmvia7ZJGyVmht",
  skuMaster: "tbl6AztqRbCOJm0ds",
  receiving: "tblHI6FhMWmwgihvV",
};

// Map from Airtable record ID → our internal ID
const idMap = new Map();

function cuid() {
  return randomUUID().replace(/-/g, "").substring(0, 25);
}

function resolveId(airtableId) {
  if (!airtableId) return null;
  if (!idMap.has(airtableId)) {
    idMap.set(airtableId, cuid());
  }
  return idMap.get(airtableId);
}

function resolveFirst(arr) {
  if (!arr || arr.length === 0) return null;
  return resolveId(arr[0]);
}

function parseDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d.toISOString();
}

function parseFloat_(val) {
  if (val === null || val === undefined) return null;
  const n = parseFloat(val);
  return isNaN(n) ? null : n;
}

function parseInt_(val) {
  if (val === null || val === undefined) return null;
  const n = parseInt(val, 10);
  return isNaN(n) ? null : n;
}

function firstAttachmentUrl(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[0].url || arr[0].thumbnails?.large?.url || null;
}

// Fetch all records from a table, handling pagination
async function fetchAll(tableId) {
  let allRecords = [];
  let offset = undefined;

  do {
    const params = new URLSearchParams();
    if (offset) params.set("offset", offset);
    params.set("pageSize", "100");

    const url = `https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${AIRTABLE_PAT}` },
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Airtable API error ${res.status}: ${text}`);
    }

    const data = await res.json();
    allRecords = allRecords.concat(data.records);
    offset = data.offset;
  } while (offset);

  return allRecords;
}

// ─── Migration functions per table ──────────────────────────────────────────────

async function migrateCollections(records) {
  console.log(`  Inserting ${records.length} collections...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    await sql`INSERT INTO collections (id, "airtableId", name, "launchDate", notes, "imageUrl", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f.Name || "Untitled"}, ${parseDate(f["Launch Date"])}, ${f.Notes || null}, ${firstAttachmentUrl(f.Image)}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

async function migrateManufacturers(records) {
  console.log(`  Inserting ${records.length} manufacturers...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    await sql`INSERT INTO manufacturers (id, "airtableId", name, country, "termsDays", "proformaPercent", "downpaymentPercent", "manufacturingStart", "fabricOrderTime", notes, "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f.Name || "Unknown"}, ${f.Country || "Unknown"}, ${parseInt_(f["Terms (Days)"])}, ${parseFloat_(f["Proforma Payment (%)"])}, ${parseFloat_(f["Downpayment (%)"])}, ${parseInt_(f["Manufacturing Start"])}, ${parseInt_(f["Fabric Order Time"])}, ${f.Notes || null}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

async function migrateCountries(records) {
  console.log(`  Inserting ${records.length} countries...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    await sql`INSERT INTO countries (id, "airtableId", name, "fastBoatFastest", "fastBoatSlowest", "slowBoatFastest", "slowBoatSlowest", "airFastest", "airSlowest", "tariffPercent", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f.Name || "Unknown"}, ${parseInt_(f["Fast Boat - Fastest"])}, ${parseInt_(f["Fast Boat - Slowest"])}, ${parseInt_(f["Slow Boat - Fastest"])}, ${parseInt_(f["Slow Boat - Slowest"])}, ${parseInt_(f["Air - Fastest"])}, ${parseInt_(f["Air - Slowest"])}, ${parseFloat_(f["Tariff Fee (%)"])}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

async function migrateLogisticsTeams(records) {
  console.log(`  Inserting ${records.length} logistics teams...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    await sql`INSERT INTO logistics_teams (id, "airtableId", name, "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f.Name || "Unknown"}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;

    // Link countries
    const countryIds = f.Countries || [];
    for (const cid of countryIds) {
      const ltId = id;
      const ctId = resolveId(cid);
      try {
        await sql`INSERT INTO logistics_team_countries ("logisticsTeamId", "countryId")
          VALUES (${ltId}, ${ctId})
          ON CONFLICT DO NOTHING`;
      } catch { /* skip if FK doesn't exist */ }
    }
  }
}

async function migrateSkuMaster(records) {
  console.log(`  Inserting ${records.length} SKU master records...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    await sql`INSERT INTO sku_master (id, "airtableId", "skuPrefix", "productName", "manufacturerSku", color, cost, "collectionName", factory, "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f["SKU # Prefix"] || null}, ${f["PRODUCT NAME"] || null}, ${f["Manufacturer SKU #"] || null}, ${f.COLOR || null}, ${f.COST || null}, ${f.COLLECTION || null}, ${f.FACTORY || null}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

async function migrateCollectionCountries(records) {
  console.log(`  Inserting ${records.length} collection x countries...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    const collId = resolveFirst(f.Collections);
    const mfrId = resolveFirst(f.Manufacturer);
    const ctryId = resolveFirst(f.Country);

    if (!collId || !mfrId || !ctryId) continue;

    await sql`INSERT INTO collection_countries (id, "airtableId", "shipMethod", "collectionId", "manufacturerId", "countryId", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f["Ship Method"] || null}, ${collId}, ${mfrId}, ${ctryId}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

async function migrateInventoryItems(records) {
  console.log(`  Inserting ${records.length} inventory items...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    const collId = resolveFirst(f.Collection);
    const mfrId = resolveFirst(f.Manufacturer);
    const skuId = resolveFirst(f["SKU Master"]);
    const tags = f.Tags ? f.Tags.map(t => typeof t === "string" ? t : t.name || String(t)) : [];

    await sql`INSERT INTO inventory_items (id, "airtableId", "productImageUrl", "styleProductionName", "finalName", "productNotes", "manufacturerSku", "shopifyPrice", "fullJessaKaeSku", "warehouseReceipts", tags, "collectionId", "manufacturerId", "skuMasterId", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${firstAttachmentUrl(f["Product Image"])}, ${f["Style Production Name"] || null}, ${f["Final Name"] || null}, ${f["Product Notes"] || null}, ${f["Manufacturer SKU"] || null}, ${parseFloat_(f["Shopify Price"])}, ${f["Full JessaKae SKU"] || null}, ${f["Warehouse Inventory Receipts"] || null}, ${tags}, ${collId}, ${mfrId}, ${skuId}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

function buildSizeJson(f, prefix, keys) {
  const obj = {};
  let hasAny = false;
  for (const key of keys) {
    const val = parseInt_(f[`${prefix}${key}`]);
    const safeKey = key.toLowerCase().replace(/\s+/g, "");
    if (val !== null && val !== 0) hasAny = true;
    obj[safeKey] = val || 0;
  }
  return hasAny ? JSON.stringify(obj) : null;
}

const WOMENS_LETTER_SIZES = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "1X", "2X", "3X", "4X", "5X", "6X"];
const WOMENS_NUMERIC_SIZES = ["00", "0", "2", "4", "6", "8", "10", "12", "14", "16", "18", "20", "22", "24", "26", "28", "30", "32", "34"];
const GIRLS_SIZES = ["12m - 18M", "2T", "3T", "4-5Y", "6-7Y", "8Y", "9-10Y", "11-12Y", "13-14Y"];

async function migratePurchaseOrders(records) {
  console.log(`  Inserting ${records.length} purchase orders...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    const invId = resolveFirst(f["Inventory Item"]);
    const mfrId = resolveFirst(f.Manufacturer);
    const ccId = resolveFirst(f["Shipping Plans - Collection x Origin"]);
    const collId = resolveFirst(f["PO Related Collection"]);

    const womensSizes = buildSizeJson(f, "Women's - ", WOMENS_LETTER_SIZES);
    const womensNumeric = buildSizeJson(f, "Women's - ", WOMENS_NUMERIC_SIZES);
    const girlsSizes = buildSizeJson(f, "Girl's - ", GIRLS_SIZES);

    const tags = f.Tags ? f.Tags.map(t => typeof t === "string" ? t : t.name || String(t)) : [];

    await sql`INSERT INTO purchase_orders (id, "airtableId", "sendPo", "lateProduct", "orderStatus", "shipByDateAgreed", "poNotes", "orderDate", "separatePricing", "singleProductCost", "straightSizeCost", "plusSizeCost", "salePrice", "shootSampleStatus", "sendShootSamplesAgreed", tags, "womensSizes", "womensNumericSizes", "girlsSizes", "inventoryItemId", "manufacturerId", "collectionCountryId", "collectionId", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f["Send PO"] || null}, ${f["Late Product"] || null}, ${f["Order Status"] || null}, ${parseDate(f["Ship By Date (Manufacture Agreed)"])}, ${f["PO Notes (JSK View Only)"] || null}, ${parseDate(f["Order Date"])}, ${f["Separate Straight & Plus Pricing?"] || null}, ${parseFloat_(f["Single Product Cost"])}, ${parseFloat_(f["Straight Size Cost"])}, ${parseFloat_(f["Plus Size Cost"])}, ${parseFloat_(f["Sale Price"])}, ${f["Shoot Sample Status"] || null}, ${parseDate(f["Send Shoot Samples (Manufacturer Agreed)"])}, ${tags}, ${womensSizes}, ${womensNumeric}, ${girlsSizes}, ${invId}, ${mfrId}, ${ccId}, ${collId}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

async function migrateInvoices(records) {
  console.log(`  Inserting ${records.length} invoices...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    const mfrId = resolveFirst(f.Manufacturer);
    const ltId = resolveFirst(f["Logistics Team"]);

    await sql`INSERT INTO invoices (id, "airtableId", name, "invoiceDate", "paidForPickup", "shippingMethod", "shippingStatus", "invoiceNotes", "logisticsTrackingNo", "notifiedLogisticsDate", "actualDepartureDate", "expectedArrivalDate", "actualArrivalDate", "downpaymentDueDate", "tariffPaid", "manufacturerId", "logisticsTeamId", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f.Name || null}, ${parseDate(f["Invoice Date"])}, ${f["Paid Manufacturer for Pickup?"] || null}, ${f["Shipping Method"] || null}, ${f["Shipping Status"] || null}, ${f["Invoice Notes"] || null}, ${f["Logistics Tracking Number"] || null}, ${parseDate(f["Notified Logistics Team"])}, ${parseDate(f["Actual Departure Date"])}, ${parseDate(f["Original Expected Arrival Date"])}, ${parseDate(f["Actual Arrival Date"])}, ${parseDate(f["Downpayment Due Date"])}, ${parseFloat_(f["Tariff Paid"])}, ${mfrId}, ${ltId}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

async function migrateInvoiceLineItems(records) {
  console.log(`  Inserting ${records.length} invoice line items...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    const invId = resolveFirst(f.Invoice);
    const itemId = resolveFirst(f["Inventory Item"]);

    const womensSizes = buildSizeJson(f, "Women's - ", WOMENS_LETTER_SIZES);
    const womensNumeric = buildSizeJson(f, "Women's - ", WOMENS_NUMERIC_SIZES);
    const girlsSizes = buildSizeJson(f, "Girl's - ", GIRLS_SIZES);

    await sql`INSERT INTO invoice_line_items (id, "airtableId", "unitPrice", "actualQtyReceived", "receivingTeamNotes", "womensSizes", "womensNumericSizes", "girlsSizes", "invoiceId", "inventoryItemId", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${parseFloat_(f["Unit Price"])}, ${parseInt_(f["Actual Quantity Received"])}, ${f["Receiving Team Notes"] || null}, ${womensSizes}, ${womensNumeric}, ${girlsSizes}, ${invId}, ${itemId}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;

    // Junction: PO <-> Invoice Line Item
    const poIds = f["Related Purchase Order"] || [];
    for (const poAirtableId of poIds) {
      const poId = resolveId(poAirtableId);
      try {
        await sql`INSERT INTO purchase_order_invoice_lines ("purchaseOrderId", "invoiceLineItemId")
          VALUES (${poId}, ${id})
          ON CONFLICT DO NOTHING`;
      } catch { /* skip if FK doesn't exist */ }
    }
  }
}

async function migrateLogisticsInvoices(records) {
  console.log(`  Inserting ${records.length} logistics invoices...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    const invId = resolveFirst(f.Invoices);

    await sql`INSERT INTO logistics_invoices (id, "airtableId", "logisticsInvoiceNo", "amountDue", "chargeType", "invoiceId", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${f["Logistics Invoice Number"] || null}, ${parseFloat_(f["Amount Due"])}, ${f["Charge Type"] || null}, ${invId}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

async function migrateReceiving(records) {
  console.log(`  Inserting ${records.length} receiving records...`);
  for (const r of records) {
    const f = r.fields;
    const id = resolveId(r.id);
    const now = new Date().toISOString();

    const iliId = resolveFirst(f["Invoice - Inventory Line Items"]);

    const wReceived = buildSizeJson(f, "Women's - ", WOMENS_LETTER_SIZES.map(s => `${s} (Received)`));
    const wNumReceived = buildSizeJson(f, "Women's - ", WOMENS_NUMERIC_SIZES.map(s => `${s} (Received)`));
    const gReceived = buildSizeJson(f, "Girl's - ", GIRLS_SIZES.map(s => `${s} (Received)`));

    await sql`INSERT INTO receiving (id, "airtableId", "totalPackingListQty", status, "womensSizesReceived", "womensNumericReceived", "girlsSizesReceived", "invoiceLineItemId", "createdAt", "updatedAt")
      VALUES (${id}, ${r.id}, ${parseInt_(f["Total Packing List Quantity"])}, ${f.Status || null}, ${wReceived}, ${wNumReceived}, ${gReceived}, ${iliId}, ${now}, ${now})
      ON CONFLICT ("airtableId") DO NOTHING`;
  }
}

// ─── Main ───────────────────────────────────────────────────────────────────────

async function main() {
  console.log("Starting Airtable → Postgres migration\n");

  // Phase 1: Fetch all records (builds the ID map)
  console.log("Phase 1: Fetching all records from Airtable...\n");

  const data = {};
  for (const [name, tableId] of Object.entries(TABLES)) {
    process.stdout.write(`  Fetching ${name}...`);
    data[name] = await fetchAll(tableId);
    console.log(` ${data[name].length} records`);

    // Pre-populate ID map
    for (const r of data[name]) {
      resolveId(r.id);
    }
  }

  console.log(`\n  Total ID mappings: ${idMap.size}\n`);

  // Phase 2: Insert records (order matters for foreign keys)
  console.log("Phase 2: Inserting into Postgres...\n");

  await migrateCollections(data.collections);
  await migrateManufacturers(data.manufacturers);
  await migrateCountries(data.countries);
  await migrateLogisticsTeams(data.logisticsTeams);
  await migrateSkuMaster(data.skuMaster);
  await migrateCollectionCountries(data.collectionCountries);
  await migrateInventoryItems(data.inventoryItems);
  await migratePurchaseOrders(data.purchaseOrders);
  await migrateInvoices(data.invoices);
  await migrateInvoiceLineItems(data.invoiceLineItems);
  await migrateLogisticsInvoices(data.logisticsInvoices);
  await migrateReceiving(data.receiving);

  // Verify
  console.log("\nPhase 3: Verification\n");
  for (const tableName of ["collections", "manufacturers", "countries", "logistics_teams", "sku_master", "collection_countries", "inventory_items", "purchase_orders", "invoices", "invoice_line_items", "logistics_invoices", "receiving"]) {
    const result = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`;
    console.log(`  ${tableName}: ${result[0].count} rows`);
  }

  console.log("\nMigration complete!");
}

main().catch(e => {
  console.error("\nMigration failed:", e.message);
  console.error(e.stack);
  process.exit(1);
});
