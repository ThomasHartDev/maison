import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collections } from "@/lib/schema";

export async function GET() {
  try {
    const data = await db.select().from(collections);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch collections:", error);
    return NextResponse.json({ error: "Failed to fetch collections" }, { status: 500 });
  }
}
