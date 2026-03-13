import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { manufacturers } from "@/lib/schema";

export async function GET() {
  try {
    const rows = await db.select().from(manufacturers);
    const data = rows.map(row => ({
      id: row.id,
      name: row.name,
      country: row.country,
      termsDays: row.termsDays,
      proformaPercent: row.proformaPercent,
      downpaymentPercent: row.downpaymentPercent,
      manufacturingStart: row.manufacturingStart,
      fabricOrderTime: row.fabricOrderTime,
      notes: row.notes,
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch manufacturers:", error);
    return NextResponse.json({ error: "Failed to fetch manufacturers" }, { status: 500 });
  }
}
