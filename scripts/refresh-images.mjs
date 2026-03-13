/**
 * Pull fresh image URLs from Airtable and update the inventory_items table.
 * Run: node scripts/refresh-images.mjs
 */
import { neon } from "@neondatabase/serverless";

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appDNZECaH78fxEdE";
const INVENTORY_TABLE = "tbl60avYfBVZbgVvE";
const DATABASE_URL = process.env.DATABASE_URL;

if (!AIRTABLE_PAT) throw new Error("AIRTABLE_PAT is required");
if (!DATABASE_URL) throw new Error("DATABASE_URL is required");

const sql = neon(DATABASE_URL);

async function fetchAll(tableId) {
  let allRecords = [];
  let offset;
  do {
    const params = new URLSearchParams({ pageSize: "100" });
    if (offset) params.set("offset", offset);
    const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${tableId}?${params}`, {
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

async function main() {
  console.log("Fetching inventory items from Airtable...");
  const records = await fetchAll(INVENTORY_TABLE);
  console.log(`  Got ${records.length} records\n`);

  let updated = 0;
  let skipped = 0;

  for (const r of records) {
    const images = r.fields["Product Image"];
    if (!images || images.length === 0) { skipped++; continue; }
    const url = images[0].url || images[0].thumbnails?.large?.url;
    if (!url) { skipped++; continue; }

    await sql`
      UPDATE inventory_items
      SET "productImageUrl" = ${url}, "updatedAt" = NOW()
      WHERE "airtableId" = ${r.id}
    `;
    updated++;
  }

  console.log(`Updated: ${updated}`);
  console.log(`Skipped (no image): ${skipped}`);

  const check = await sql`
    SELECT "productImageUrl" FROM inventory_items
    WHERE "productImageUrl" IS NOT NULL LIMIT 1
  `;
  console.log(`\nSample URL: ${check[0]?.productImageUrl?.substring(0, 100)}...`);
}

main().catch(e => {
  console.error("Failed:", e.message);
  process.exit(1);
});
