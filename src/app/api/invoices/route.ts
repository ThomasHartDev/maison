import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { invoices, manufacturers, logisticsTeams } from "@/lib/schema";
import { eq } from "drizzle-orm";

function fmtDate(d: Date | null): string | null {
  if (!d) return null;
  return new Date(d).toISOString().split("T")[0];
}

export async function GET() {
  try {
    const rows = await db
      .select({
        id: invoices.id,
        airtableId: invoices.airtableId,
        name: invoices.name,
        invoiceDate: invoices.invoiceDate,
        paidForPickup: invoices.paidForPickup,
        shippingMethod: invoices.shippingMethod,
        shippingStatus: invoices.shippingStatus,
        invoiceNotes: invoices.invoiceNotes,
        logisticsTrackingNo: invoices.logisticsTrackingNo,
        notifiedLogisticsDate: invoices.notifiedLogisticsDate,
        actualDepartureDate: invoices.actualDepartureDate,
        expectedArrivalDate: invoices.expectedArrivalDate,
        actualArrivalDate: invoices.actualArrivalDate,
        downpaymentDueDate: invoices.downpaymentDueDate,
        tariffPaid: invoices.tariffPaid,
        manufacturerId: invoices.manufacturerId,
        manufacturerName: manufacturers.name,
        logisticsTeamId: invoices.logisticsTeamId,
        logisticsTeamName: logisticsTeams.name,
      })
      .from(invoices)
      .leftJoin(manufacturers, eq(invoices.manufacturerId, manufacturers.id))
      .leftJoin(logisticsTeams, eq(invoices.logisticsTeamId, logisticsTeams.id));

    const data = rows.map(row => ({
      id: row.id,
      airtableId: row.airtableId,
      name: row.name,
      invoiceDate: fmtDate(row.invoiceDate),
      paidForPickup: row.paidForPickup,
      shippingMethod: row.shippingMethod,
      shippingStatus: row.shippingStatus,
      invoiceNotes: row.invoiceNotes,
      logisticsTrackingNo: row.logisticsTrackingNo,
      notifiedLogisticsDate: fmtDate(row.notifiedLogisticsDate),
      actualDepartureDate: fmtDate(row.actualDepartureDate),
      expectedArrivalDate: fmtDate(row.expectedArrivalDate),
      actualArrivalDate: fmtDate(row.actualArrivalDate),
      downpaymentDueDate: fmtDate(row.downpaymentDueDate),
      tariffPaid: row.tariffPaid,
      manufacturerId: row.manufacturerId,
      manufacturerName: row.manufacturerName,
      logisticsTeamId: row.logisticsTeamId,
      logisticsTeamName: row.logisticsTeamName,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Failed to fetch invoices:", error);
    return NextResponse.json({ error: "Failed to fetch invoices" }, { status: 500 });
  }
}
