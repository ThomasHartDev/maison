import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, inventoryItems, manufacturers, collections, collectionCountries, invoiceLineItems, purchaseOrderInvoiceLines, invoices } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { logAudit, stringifyValue } from "@/lib/audit";
import { syncToAirtable } from "@/lib/airtable";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const [po] = await db
      .select({
        id: purchaseOrders.id,
        airtableId: purchaseOrders.airtableId,
        orderStatus: purchaseOrders.orderStatus,
        orderDate: purchaseOrders.orderDate,
        shipByDateAgreed: purchaseOrders.shipByDateAgreed,
        poNotes: purchaseOrders.poNotes,
        sendPo: purchaseOrders.sendPo,
        lateProduct: purchaseOrders.lateProduct,
        separatePricing: purchaseOrders.separatePricing,
        singleProductCost: purchaseOrders.singleProductCost,
        straightSizeCost: purchaseOrders.straightSizeCost,
        plusSizeCost: purchaseOrders.plusSizeCost,
        salePrice: purchaseOrders.salePrice,
        shootSampleStatus: purchaseOrders.shootSampleStatus,
        sendShootSamplesAgreed: purchaseOrders.sendShootSamplesAgreed,
        tags: purchaseOrders.tags,
        womensSizes: purchaseOrders.womensSizes,
        womensNumericSizes: purchaseOrders.womensNumericSizes,
        girlsSizes: purchaseOrders.girlsSizes,
        inventoryItemName: inventoryItems.styleProductionName,
        inventoryItemFinalName: inventoryItems.finalName,
        inventoryItemSku: inventoryItems.fullJessaKaeSku,
        inventoryItemImage: inventoryItems.productImageUrl,
        inventoryItemNotes: inventoryItems.productNotes,
        manufacturerName: manufacturers.name,
        manufacturerCountry: manufacturers.country,
        collectionName: collections.name,
        collectionLaunchDate: collections.launchDate,
        shipMethod: collectionCountries.shipMethod,
      })
      .from(purchaseOrders)
      .leftJoin(inventoryItems, eq(purchaseOrders.inventoryItemId, inventoryItems.id))
      .leftJoin(manufacturers, eq(purchaseOrders.manufacturerId, manufacturers.id))
      .leftJoin(collections, eq(purchaseOrders.collectionId, collections.id))
      .leftJoin(collectionCountries, eq(purchaseOrders.collectionCountryId, collectionCountries.id))
      .where(eq(purchaseOrders.id, id));

    if (!po) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    // Fetch related invoice line items
    const lineItems = await db
      .select({
        invoiceLineItemId: invoiceLineItems.id,
        unitPrice: invoiceLineItems.unitPrice,
        womensSizes: invoiceLineItems.womensSizes,
        womensNumericSizes: invoiceLineItems.womensNumericSizes,
        girlsSizes: invoiceLineItems.girlsSizes,
        invoiceName: invoices.name,
        invoiceDate: invoices.invoiceDate,
        shippingStatus: invoices.shippingStatus,
        shippingMethod: invoices.shippingMethod,
        actualDepartureDate: invoices.actualDepartureDate,
        actualArrivalDate: invoices.actualArrivalDate,
      })
      .from(purchaseOrderInvoiceLines)
      .innerJoin(invoiceLineItems, eq(purchaseOrderInvoiceLines.invoiceLineItemId, invoiceLineItems.id))
      .leftJoin(invoices, eq(invoiceLineItems.invoiceId, invoices.id))
      .where(eq(purchaseOrderInvoiceLines.purchaseOrderId, id));

    return NextResponse.json({ ...po, lineItems });
  } catch (error) {
    console.error("Failed to fetch purchase order:", error);
    return NextResponse.json({ error: "Failed to fetch purchase order" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const source = (body._source as string) || "manual";
    delete body._source;

    const allowedFields = [
      "orderStatus", "shipByDateAgreed", "poNotes", "sendPo",
      "lateProduct", "singleProductCost", "straightSizeCost",
      "plusSizeCost", "salePrice", "womensSizes", "womensNumericSizes",
      "girlsSizes", "tags",
    ] as const;

    const timestampFields = new Set(["shipByDateAgreed", "sendShootSamplesAgreed"]);

    // Fetch current values before updating (for audit diff + airtable sync)
    const [current] = await db
      .select({
        id: purchaseOrders.id,
        airtableId: purchaseOrders.airtableId,
        orderStatus: purchaseOrders.orderStatus,
        shipByDateAgreed: purchaseOrders.shipByDateAgreed,
        poNotes: purchaseOrders.poNotes,
        sendPo: purchaseOrders.sendPo,
        lateProduct: purchaseOrders.lateProduct,
        singleProductCost: purchaseOrders.singleProductCost,
        straightSizeCost: purchaseOrders.straightSizeCost,
        plusSizeCost: purchaseOrders.plusSizeCost,
        salePrice: purchaseOrders.salePrice,
        womensSizes: purchaseOrders.womensSizes,
        womensNumericSizes: purchaseOrders.womensNumericSizes,
        girlsSizes: purchaseOrders.girlsSizes,
        tags: purchaseOrders.tags,
      })
      .from(purchaseOrders)
      .where(eq(purchaseOrders.id, id));

    if (!current) {
      return NextResponse.json({ error: "Purchase order not found" }, { status: 404 });
    }

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = timestampFields.has(field) && typeof body[field] === "string"
          ? new Date(body[field])
          : body[field];
      }
    }

    const [updated] = await db
      .update(purchaseOrders)
      .set(updates)
      .where(eq(purchaseOrders.id, id))
      .returning({ id: purchaseOrders.id });

    // Write audit log entries for each changed field
    const user = await getSession();
    const userName = user?.name ?? "System";
    const userId = user?.id ?? null;

    for (const field of allowedFields) {
      if (field in body) {
        const oldVal = stringifyValue((current as Record<string, unknown>)[field]);
        const newVal = stringifyValue(body[field]);
        if (oldVal !== newVal) {
          logAudit({
            purchaseOrderId: id,
            userId,
            userName,
            action: `update_${field}`,
            field,
            oldValue: oldVal,
            newValue: newVal,
            source: source as "manual" | "chat" | "system",
          }).catch(err => console.error("Audit log failed:", err));
        }
      }
    }

    // Fire-and-forget Airtable sync
    if (current.airtableId) {
      syncToAirtable(current.airtableId, body).catch(err =>
        console.error("Airtable sync failed:", err)
      );
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update purchase order:", error);
    return NextResponse.json({ error: "Failed to update purchase order" }, { status: 500 });
  }
}
