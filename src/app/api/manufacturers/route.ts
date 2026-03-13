import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { manufacturers } from "@/lib/schema";

export async function GET() {
  try {
    const data = await db.select().from(manufacturers);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch manufacturers:", error);
    return NextResponse.json({ error: "Failed to fetch manufacturers" }, { status: 500 });
  }
}
