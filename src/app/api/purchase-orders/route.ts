import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { purchaseOrders, inventoryItems, manufacturers, collections } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const pos = await db
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
        tags: purchaseOrders.tags,
        womensSizes: purchaseOrders.womensSizes,
        womensNumericSizes: purchaseOrders.womensNumericSizes,
        girlsSizes: purchaseOrders.girlsSizes,
        // Joined fields
        inventoryItemName: inventoryItems.styleProductionName,
        inventoryItemFinalName: inventoryItems.finalName,
        inventoryItemSku: inventoryItems.fullJessaKaeSku,
        inventoryItemImage: inventoryItems.productImageUrl,
        manufacturerName: manufacturers.name,
        manufacturerCountry: manufacturers.country,
        collectionName: collections.name,
      })
      .from(purchaseOrders)
      .leftJoin(inventoryItems, eq(purchaseOrders.inventoryItemId, inventoryItems.id))
      .leftJoin(manufacturers, eq(purchaseOrders.manufacturerId, manufacturers.id))
      .leftJoin(collections, eq(purchaseOrders.collectionId, collections.id));

    return NextResponse.json(pos);
  } catch (error) {
    console.error("Failed to fetch purchase orders:", error);
    return NextResponse.json({ error: "Failed to fetch purchase orders" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const id = randomUUID();
    const now = new Date();

    const [created] = await db
      .insert(purchaseOrders)
      .values({
        id,
        orderStatus: body.orderStatus || "Draft",
        orderDate: now,
        shipByDateAgreed: body.shipByDateAgreed ? new Date(body.shipByDateAgreed) : null,
        womensSizes: body.womensSizes || null,
        collectionId: body.collectionId || null,
        manufacturerId: body.manufacturerId || null,
        inventoryItemId: body.inventoryItemId || null,
        poNotes: body.poNotes || null,
        createdAt: now,
        updatedAt: now,
      })
      .returning({ id: purchaseOrders.id });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to create purchase order:", error);
    return NextResponse.json({ error: "Failed to create purchase order" }, { status: 500 });
  }
}
