const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appDNZECaH78fxEdE";
const PO_TABLE_ID = "tblIIN5Drgyd4w7I6";

const WOMENS_LETTER_KEYS: Record<string, string> = {
  xxs: "Women's - XXS", xs: "Women's - XS", s: "Women's - S", m: "Women's - M",
  l: "Women's - L", xl: "Women's - XL", xxl: "Women's - XXL",
  "1x": "Women's - 1X", "2x": "Women's - 2X", "3x": "Women's - 3X",
  "4x": "Women's - 4X", "5x": "Women's - 5X", "6x": "Women's - 6X",
};

const WOMENS_NUMERIC_KEYS: Record<string, string> = {
  "00": "Women's - 00", "0": "Women's - 0", "2": "Women's - 2", "4": "Women's - 4",
  "6": "Women's - 6", "8": "Women's - 8", "10": "Women's - 10", "12": "Women's - 12",
  "14": "Women's - 14", "16": "Women's - 16", "18": "Women's - 18", "20": "Women's - 20",
  "22": "Women's - 22", "24": "Women's - 24", "26": "Women's - 26", "28": "Women's - 28",
  "30": "Women's - 30", "32": "Women's - 32", "34": "Women's - 34",
};

const GIRLS_KEYS: Record<string, string> = {
  "12m-18m": "Girl's - 12m - 18M", "2t": "Girl's - 2T", "3t": "Girl's - 3T",
  "4-5y": "Girl's - 4-5Y", "6-7y": "Girl's - 6-7Y", "8y": "Girl's - 8Y",
  "9-10y": "Girl's - 9-10Y", "11-12y": "Girl's - 11-12Y", "13-14y": "Girl's - 13-14Y",
};

/** DB column → Airtable field name */
const FIELD_MAP: Record<string, string> = {
  orderStatus: "Order Status",
  shipByDateAgreed: "Ship By Date (Manufacture Agreed)",
  poNotes: "PO Notes (JSK View Only)",
  sendPo: "Send PO",
  lateProduct: "Late Product",
  singleProductCost: "Single Product Cost",
  straightSizeCost: "Straight Size Cost",
  plusSizeCost: "Plus Size Cost",
  salePrice: "Sale Price",
  shootSampleStatus: "Shoot Sample Status",
  sendShootSamplesAgreed: "Send Shoot Samples (Manufacturer Agreed)",
  tags: "Tags",
};

function expandSizes(jsonSizes: Record<string, number>, keyMap: Record<string, string>): Record<string, number> {
  const fields: Record<string, number> = {};
  for (const [dbKey, airtableField] of Object.entries(keyMap)) {
    if (dbKey in jsonSizes) {
      fields[airtableField] = jsonSizes[dbKey];
    }
  }
  return fields;
}

function mapFieldsToAirtable(updates: Record<string, unknown>): Record<string, unknown> {
  const fields: Record<string, unknown> = {};

  for (const [dbCol, value] of Object.entries(updates)) {
    if (dbCol === "womensSizes" && value && typeof value === "object") {
      Object.assign(fields, expandSizes(value as Record<string, number>, WOMENS_LETTER_KEYS));
      continue;
    }
    if (dbCol === "womensNumericSizes" && value && typeof value === "object") {
      Object.assign(fields, expandSizes(value as Record<string, number>, WOMENS_NUMERIC_KEYS));
      continue;
    }
    if (dbCol === "girlsSizes" && value && typeof value === "object") {
      Object.assign(fields, expandSizes(value as Record<string, number>, GIRLS_KEYS));
      continue;
    }
    if (dbCol === "shipByDateAgreed" && value) {
      fields[FIELD_MAP[dbCol]] = new Date(value as string).toISOString().split("T")[0];
      continue;
    }

    const airtableField = FIELD_MAP[dbCol];
    if (airtableField) {
      fields[airtableField] = value;
    }
  }

  return fields;
}

export async function syncToAirtable(airtableRecordId: string, updates: Record<string, unknown>): Promise<void> {
  if (!AIRTABLE_PAT) return;

  const fields = mapFieldsToAirtable(updates);
  if (Object.keys(fields).length === 0) return;

  const url = `https://api.airtable.com/v0/${BASE_ID}/${PO_TABLE_ID}/${airtableRecordId}`;

  const res = await fetch(url, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${AIRTABLE_PAT}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`Airtable sync failed for ${airtableRecordId}: ${res.status} ${text}`);
  }
}
