"use client";

import type { Invoice, Manufacturer } from "@/types";
import { GOLD, RED, GREEN, BLUE, AMBER } from "@/constants";
import { daysUntil, fmtDate } from "@/lib/helpers";
import { Overlay } from "@/components/ui/overlay";
import { Lbl } from "@/components/ui/label";

interface InvoiceDetailProps {
  invoice: Invoice;
  onClose: () => void;
  manufacturers: Manufacturer[];
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
      <span style={{ color: "var(--text3)" }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%", wordBreak: "break-all" }}>{value}</span>
    </div>
  );
}

function statusColor(status: string | null): string {
  if (!status) return BLUE;
  const s = status.toLowerCase();
  if (s.includes("deliver")) return GREEN;
  if (s.includes("transit") || s.includes("shipped")) return BLUE;
  if (s.includes("ready")) return AMBER;
  if (s.includes("delay")) return RED;
  return BLUE;
}

export const InvoiceDetail = ({ invoice, onClose, manufacturers }: InvoiceDetailProps) => {
  const mfr = manufacturers.find(m => m.id === invoice.manufacturerId);
  const eta = invoice.expectedArrivalDate ? daysUntil(invoice.expectedArrivalDate) : null;
  const sc = statusColor(invoice.shippingStatus);

  const fmtCost = (v: number | null) => v !== null && v !== undefined ? `$${v.toFixed(2)}` : null;

  return (
    <Overlay onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, fontWeight: 700 }}>{invoice.name || "Invoice"}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, marginTop: 2 }}>{invoice.manufacturerName || "Unknown"}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
            {invoice.shippingMethod || "N/A"}
            {invoice.logisticsTeamName && <> {"\u00b7"} {invoice.logisticsTeamName}</>}
          </div>
        </div>
        <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 22 }}>{"\u00d7"}</button>
      </div>

      {invoice.shippingStatus && (
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <span style={{ fontSize: 13, background: sc + "14", color: sc, borderRadius: 20, padding: "4px 16px", fontWeight: 700 }}>{invoice.shippingStatus}</span>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Tracking</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, wordBreak: "break-all" }}>{invoice.logisticsTrackingNo || "\u2014"}</div>
        </div>
        <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px" }}>
          <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>ETA</div>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{invoice.expectedArrivalDate ? fmtDate(invoice.expectedArrivalDate) : "\u2014"}</div>
        </div>
      </div>

      {eta !== null && (
        <div style={{ fontSize: 14, fontWeight: 700, color: eta < 0 ? RED : eta < 7 ? AMBER : GREEN, marginBottom: 16, textAlign: "center", background: eta < 0 ? "var(--red-bg)" : eta < 7 ? "var(--amber-bg)" : "var(--green-bg)", borderRadius: 10, padding: "10px 14px" }}>
          {eta < 0 ? `${Math.abs(eta)} days overdue` : `${eta} days until arrival`}
        </div>
      )}

      <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <Lbl>Shipping Details</Lbl>
        <InfoRow label="Invoice Date" value={invoice.invoiceDate ? fmtDate(invoice.invoiceDate) : null} />
        <InfoRow label="Shipping Method" value={invoice.shippingMethod} />
        <InfoRow label="Paid for Pickup" value={invoice.paidForPickup} />
        <InfoRow label="Notified Logistics" value={invoice.notifiedLogisticsDate ? fmtDate(invoice.notifiedLogisticsDate) : null} />
        <InfoRow label="Actual Departure" value={invoice.actualDepartureDate ? fmtDate(invoice.actualDepartureDate) : null} />
        <InfoRow label="Expected Arrival" value={invoice.expectedArrivalDate ? fmtDate(invoice.expectedArrivalDate) : null} />
        <InfoRow label="Actual Arrival" value={invoice.actualArrivalDate ? fmtDate(invoice.actualArrivalDate) : null} />
      </div>

      <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
        <Lbl>Financial</Lbl>
        <InfoRow label="Tariff Paid" value={fmtCost(invoice.tariffPaid)} />
        <InfoRow label="Downpayment Due" value={invoice.downpaymentDueDate ? fmtDate(invoice.downpaymentDueDate) : null} />
      </div>

      {mfr && (
        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
          <Lbl>Manufacturer</Lbl>
          <InfoRow label="Name" value={mfr.name} />
          <InfoRow label="Country" value={mfr.country} />
          {mfr.termsDays && <InfoRow label="Payment Terms" value={`${mfr.termsDays} days`} />}
          {mfr.proformaPercent && <InfoRow label="Proforma" value={`${mfr.proformaPercent}%`} />}
          {mfr.downpaymentPercent && <InfoRow label="Downpayment" value={`${mfr.downpaymentPercent}%`} />}
        </div>
      )}

      {invoice.invoiceNotes && (
        <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px" }}>
          <Lbl>Notes</Lbl>
          <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text2)", marginTop: 6 }}>{invoice.invoiceNotes}</div>
        </div>
      )}
    </Overlay>
  );
};
