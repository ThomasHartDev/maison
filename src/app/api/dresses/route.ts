import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { purchaseOrders, inventoryItems, manufacturers, collections } from "@/lib/schema";
import { eq } from "drizzle-orm";
import type { Dress, DressStatus, Quantities } from "@/types";

// Map real orderStatus values to our DressStatus type
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

// Extract simplified 6-size quantities from the JSON size breakdowns
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

// Build milestones from status
function buildMilestones(status: DressStatus) {
  const steps = ["Fabric Sourced", "Cutting", "Sewing", "QC Passed", "Dispatched"];
  const completedSteps = {
    draft: 0, submitted: 0, production: 1, ontrack: 2,
    delayed: 1, shipped: 4, received: 5, cancelled: 0,
  };
  const done = completedSteps[status] || 0;
  return steps.map((label, i) => ({ label, done: i < done }));
}

// Format PO number from order date or airtable ID
function formatPoNumber(orderDate: Date | null, index: number): string {
  if (orderDate) {
    const d = new Date(orderDate);
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = String(d.getFullYear()).slice(-2);
    return `PO-${year}${month}-${String(index + 1).padStart(3, "0")}`;
  }
  return `PO-${String(index + 1).padStart(3, "0")}`;
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: purchaseOrders.id,
        orderStatus: purchaseOrders.orderStatus,
        orderDate: purchaseOrders.orderDate,
        shipByDateAgreed: purchaseOrders.shipByDateAgreed,
        poNotes: purchaseOrders.poNotes,
        womensSizes: purchaseOrders.womensSizes,
        tags: purchaseOrders.tags,
        inventoryItemName: inventoryItems.styleProductionName,
        inventoryItemFinalName: inventoryItems.finalName,
        inventoryItemImage: inventoryItems.productImageUrl,
        manufacturerId: purchaseOrders.manufacturerId,
        manufacturerName: manufacturers.name,
        collectionId: purchaseOrders.collectionId,
        collectionName: collections.name,
      })
      .from(purchaseOrders)
      .leftJoin(inventoryItems, eq(purchaseOrders.inventoryItemId, inventoryItems.id))
      .leftJoin(manufacturers, eq(purchaseOrders.manufacturerId, manufacturers.id))
      .leftJoin(collections, eq(purchaseOrders.collectionId, collections.id));

    const dresses: Dress[] = rows.map((row, i) => {
      const status = mapStatus(row.orderStatus);
      const quantities = mapQuantities(row.womensSizes as Record<string, number> | null);

      return {
        id: row.id,
        poNumber: formatPoNumber(row.orderDate, i),
        name: row.inventoryItemFinalName || row.inventoryItemName || "Untitled Style",
        collectionId: row.collectionId || "unknown",
        manufacturerId: row.manufacturerId || "unknown",
        status,
        dueDate: row.shipByDateAgreed ? new Date(row.shipByDateAgreed).toISOString().split("T")[0] : "",
        orderDate: row.orderDate ? new Date(row.orderDate).toISOString().split("T")[0] : "",
        quantities,
        imageUrl: row.inventoryItemImage || "https://images.unsplash.com/photo-1558618047-f4042eb19143?w=400&q=75",
        milestones: buildMilestones(status),
        timeline: [{
          id: `tl-${row.id}`,
          date: row.orderDate ? new Date(row.orderDate).toISOString().split("T")[0] : "",
          time: "9:00 AM",
          type: "system" as const,
          source: "PO Created",
          content: `PO created for ${row.inventoryItemFinalName || row.inventoryItemName || "style"}`,
          user: "System",
          category: "design" as const,
        }],
        alerts: row.poNotes ? [row.poNotes] : [],
      };
    });

    return NextResponse.json(dresses);
  } catch (error) {
    console.error("Failed to fetch dresses:", error);
    return NextResponse.json({ error: "Failed to fetch dresses" }, { status: 500 });
  }
}
