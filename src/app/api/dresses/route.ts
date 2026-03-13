import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, inventoryItems, manufacturers, collections, collectionCountries } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { Dress, DressStatus, Quantities } from "@/types";

function mapStatus(orderStatus: string | null): DressStatus {
  if (!orderStatus) return "draft";
  const s = orderStatus.toLowerCase();
  if (s.includes("delivered")) return "received";
  if (s.includes("shipped") || s.includes("in transit")) return "shipped";
  if (s.includes("complete")) return "production";
  if (s.includes("open")) return "ontrack";
  if (s.includes("cancel")) return "cancelled";
  if (s.includes("delay")) return "delayed";
  return "production";
}

function mapQuantities(womensSizes: Record<string, number> | null): Quantities {
  if (!womensSizes) return { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 };
  return {
    XS: (womensSizes.xxs || 0) + (womensSizes.xs || 0),
    S: womensSizes.s || 0,
    M: womensSizes.m || 0,
    L: womensSizes.l || 0,
    XL: womensSizes.xl || 0,
    XXL: (womensSizes.xxl || 0) + (womensSizes["1x"] || 0) + (womensSizes["2x"] || 0) +
         (womensSizes["3x"] || 0) + (womensSizes["4x"] || 0) + (womensSizes["5x"] || 0) +
         (womensSizes["6x"] || 0),
  };
}

function buildMilestones(status: DressStatus) {
  const steps = ["Fabric Sourced", "Cutting", "Sewing", "QC Passed", "Dispatched"];
  const completedSteps: Record<DressStatus, number> = {
    draft: 0, submitted: 0, production: 1, ontrack: 2,
    delayed: 1, shipped: 4, received: 5, cancelled: 0,
  };
  const done = completedSteps[status] || 0;
  return steps.map((label, i) => ({ label, done: i < done }));
}

function fmtDate(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0];
}

export async function GET() {
  try {
    const rows = await db
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
        inventoryItemId: purchaseOrders.inventoryItemId,
        inventoryItemName: inventoryItems.styleProductionName,
        inventoryItemFinalName: inventoryItems.finalName,
        inventoryItemSku: inventoryItems.fullJessaKaeSku,
        inventoryItemImage: inventoryItems.productImageUrl,
        productNotes: inventoryItems.productNotes,
        manufacturerId: purchaseOrders.manufacturerId,
        manufacturerName: manufacturers.name,
        manufacturerCountry: manufacturers.country,
        collectionId: purchaseOrders.collectionId,
        collectionName: collections.name,
        collectionCountryId: purchaseOrders.collectionCountryId,
        shipMethod: collectionCountries.shipMethod,
      })
      .from(purchaseOrders)
      .leftJoin(inventoryItems, eq(purchaseOrders.inventoryItemId, inventoryItems.id))
      .leftJoin(manufacturers, eq(purchaseOrders.manufacturerId, manufacturers.id))
      .leftJoin(collections, eq(purchaseOrders.collectionId, collections.id))
      .leftJoin(collectionCountries, eq(purchaseOrders.collectionCountryId, collectionCountries.id));

    const dresses: Dress[] = rows.map((row, i) => {
      const status = mapStatus(row.orderStatus);
      const ws = row.womensSizes as Record<string, number> | null;
      const quantities = mapQuantities(ws);

      return {
        id: row.id,
        airtableId: row.airtableId,
        poNumber: row.airtableId || `PO-${String(i + 1).padStart(3, "0")}`,
        name: row.inventoryItemFinalName || row.inventoryItemName || "Untitled Style",
        status,
        orderStatus: row.orderStatus,
        orderDate: fmtDate(row.orderDate),
        dueDate: fmtDate(row.shipByDateAgreed),
        sendPo: row.sendPo,
        lateProduct: row.lateProduct,
        poNotes: row.poNotes,
        separatePricing: row.separatePricing,
        shootSampleStatus: row.shootSampleStatus,
        sendShootSamplesAgreed: fmtDate(row.sendShootSamplesAgreed),
        tags: row.tags,
        singleProductCost: row.singleProductCost,
        straightSizeCost: row.straightSizeCost,
        plusSizeCost: row.plusSizeCost,
        salePrice: row.salePrice,
        womensSizes: ws,
        womensNumericSizes: row.womensNumericSizes as Record<string, number> | null,
        girlsSizes: row.girlsSizes as Record<string, number> | null,
        quantities,
        inventoryItemId: row.inventoryItemId,
        inventoryItemSku: row.inventoryItemSku,
        imageUrl: row.inventoryItemImage || null,
        productNotes: row.productNotes,
        collectionId: row.collectionId,
        collectionName: row.collectionName,
        manufacturerId: row.manufacturerId,
        manufacturerName: row.manufacturerName,
        manufacturerCountry: row.manufacturerCountry,
        shipMethod: row.shipMethod,
        milestones: buildMilestones(status),
        alerts: row.poNotes ? [row.poNotes] : [],
      };
    });

    return NextResponse.json(dresses);
  } catch (error) {
    console.error("Failed to fetch dresses:", error);
    return NextResponse.json({ error: "Failed to fetch dresses" }, { status: 500 });
  }
}
