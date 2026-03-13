import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { auditLog } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { desc } from "drizzle-orm";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const entries = await db
      .select()
      .from(auditLog)
      .where(eq(auditLog.purchaseOrderId, id))
      .orderBy(desc(auditLog.createdAt));

    return NextResponse.json(entries);
  } catch (error) {
    console.error("Failed to fetch timeline:", error);
    return NextResponse.json({ error: "Failed to fetch timeline" }, { status: 500 });
  }
}
