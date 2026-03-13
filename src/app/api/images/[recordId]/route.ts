import { NextResponse } from "next/server";

const AIRTABLE_PAT = process.env.AIRTABLE_PAT;
const BASE_ID = process.env.AIRTABLE_BASE_ID || "appDNZECaH78fxEdE";
const INVENTORY_TABLE = "tbl60avYfBVZbgVvE";

/** Proxy for Airtable product images — fetches fresh URL on demand */
export async function GET(_req: Request, { params }: { params: Promise<{ recordId: string }> }) {
  if (!AIRTABLE_PAT) {
    return NextResponse.json({ error: "Airtable not configured" }, { status: 503 });
  }

  const { recordId } = await params;

  try {
    const res = await fetch(
      `https://api.airtable.com/v0/${BASE_ID}/${INVENTORY_TABLE}/${recordId}`,
      { headers: { Authorization: `Bearer ${AIRTABLE_PAT}` } },
    );

    if (!res.ok) {
      return NextResponse.json({ error: "Record not found" }, { status: 404 });
    }

    const data = await res.json();
    const images = data.fields?.["Product Image"];
    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No image" }, { status: 404 });
    }

    const imageUrl = images[0].url || images[0].thumbnails?.large?.url;
    if (!imageUrl) {
      return NextResponse.json({ error: "No image URL" }, { status: 404 });
    }

    // Fetch the actual image and proxy it
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      return NextResponse.json({ error: "Image fetch failed" }, { status: 502 });
    }

    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const buffer = await imgRes.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600, s-maxage=7200",
      },
    });
  } catch (error) {
    console.error("Image proxy error:", error);
    return NextResponse.json({ error: "Failed to fetch image" }, { status: 500 });
  }
}
