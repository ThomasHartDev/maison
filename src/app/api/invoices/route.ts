import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, manufacturers, logisticsTeams } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const data = await db
      .select({
        id: invoices.id,
        name: invoices.name,
        invoiceDate: invoices.invoiceDate,
        paidForPickup: invoices.paidForPickup,
        shippingMethod: invoices.shippingMethod,
        shippingStatus: invoices.shippingStatus,
        invoiceNotes: invoices.invoiceNotes,
        logisticsTrackingNo: invoices.logisticsTrackingNo,
        actualDepartureDate: invoices.actualDepartureDate,
        expectedArrivalDate: invoices.expectedArrivalDate,
        actualArrivalDate: invoices.actualArrivalDate,
        tariffPaid: invoices.tariffPaid,
        manufacturerName: manufacturers.name,
        logisticsTeamName: logisticsTeams.name,
      })
      .from(invoices)
      .leftJoin(manufacturers, eq(invoices.manufacturerId, manufacturers.id))
      .leftJoin(logisticsTeams, eq(invoices.logisticsTeamId, logisticsTeams.id));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}
