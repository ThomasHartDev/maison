import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections } from "@/lib/schema";

function fmtDate(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0];
}

export async function GET() {
  try {
    const rows = await db.select().from(collections);
    const data = rows.map(row => ({
      id: row.id,
      name: row.name,
      launchDate: fmtDate(row.launchDate),
      notes: row.notes,
      imageUrl: row.imageUrl,
    }));
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
