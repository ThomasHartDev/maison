"use client";

import { useState } from "react";
import type { Dress, Invoice, Manufacturer } from "@/types";
import { GOLD, RED, GREEN, BLUE, AMBER } from "@/constants";
import { daysUntil, fmtDate } from "@/lib/helpers";
import { Card } from "@/components/ui/card";
import { Lbl } from "@/components/ui/label";
import { Chip } from "@/components/ui/chip";
import { InvoiceDetail } from "./shipment-detail";

interface ShipmentsViewProps {
  invoices: Invoice[];
  manufacturers: Manufacturer[];
  dresses: Dress[];
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

function methodIcon(method: string | null): string {
  if (!method) return "\ud83d\udce6";
  const m = method.toLowerCase();
  if (m.includes("air")) return "\u2708";
  if (m.includes("boat") || m.includes("sea")) return "\ud83d\udea2";
  return "\ud83d\udce6";
}

export const ShipmentsView = ({ invoices, manufacturers, dresses }: ShipmentsViewProps) => {
  const [sel, setSel] = useState<Invoice | null>(null);
  const [filter, setFilter] = useState<"all" | "active" | "delivered">("all");

  const filtered = invoices.filter(inv => {
    if (filter === "all") return true;
    if (filter === "delivered") return inv.shippingStatus?.toLowerCase().includes("deliver");
    return !inv.shippingStatus?.toLowerCase().includes("deliver");
  });

  return (
    <div className="fade-up">
      {sel && <InvoiceDetail invoice={sel} onClose={() => setSel(null)} manufacturers={manufacturers} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>Invoices & Shipments</div>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>{invoices.length} total</div>
      </div>

      <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 8, marginBottom: 16, WebkitOverflowScrolling: "touch" }}>
        <Chip active={filter === "all"} onClick={() => setFilter("all")}>All ({invoices.length})</Chip>
        <Chip active={filter === "active"} onClick={() => setFilter("active")} color={BLUE}>Active ({invoices.filter(i => !i.shippingStatus?.toLowerCase().includes("deliver")).length})</Chip>
        <Chip active={filter === "delivered"} onClick={() => setFilter("delivered")} color={GREEN}>Delivered ({invoices.filter(i => i.shippingStatus?.toLowerCase().includes("deliver")).length})</Chip>
      </div>

      {manufacturers.length > 0 && (
        <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
          <Lbl>Manufacturers</Lbl>
          {manufacturers.map(m => (
            <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name} <span style={{ color: "var(--text3)", fontWeight: 400 }}>({m.country})</span></span>
              <div style={{ display: "flex", gap: 6 }}>
                {m.fabricOrderTime && <span style={{ fontSize: 10, color: BLUE, background: "var(--blue-bg)", borderRadius: 20, padding: "2px 9px" }}>Fabric: {m.fabricOrderTime}d</span>}
                {m.manufacturingStart && <span style={{ fontSize: 10, color: "var(--text2)", background: "var(--surface2)", borderRadius: 20, padding: "2px 9px" }}>Mfg Start: {m.manufacturingStart}d</span>}
              </div>
            </div>
          ))}
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {filtered.map(inv => {
          const sc = statusColor(inv.shippingStatus);
          const eta = inv.expectedArrivalDate ? daysUntil(inv.expectedArrivalDate) : null;
          return (
            <Card key={inv.id} onClick={() => setSel(inv)} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: GOLD, letterSpacing: 1, fontWeight: 700 }}>{inv.name || inv.airtableId || "Invoice"}</div>
                  <div style={{ fontWeight: 700, fontSize: 15, marginTop: 2 }}>{inv.manufacturerName || "Unknown"}</div>
                  <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>
                    {methodIcon(inv.shippingMethod)} {inv.shippingMethod || "N/A"}
                    {inv.logisticsTeamName && <> {"\u00b7"} {inv.logisticsTeamName}</>}
                  </div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {inv.shippingStatus && (
                    <span style={{ fontSize: 10, background: sc + "14", color: sc, borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>{inv.shippingStatus}</span>
                  )}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 6 }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Tracking</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1, wordBreak: "break-all" }}>{inv.logisticsTrackingNo || "\u2014"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>ETA</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{inv.expectedArrivalDate ? fmtDate(inv.expectedArrivalDate) : "\u2014"}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Invoice Date</div>
                  <div style={{ fontSize: 12, fontWeight: 600, marginTop: 1 }}>{inv.invoiceDate ? fmtDate(inv.invoiceDate) : "\u2014"}</div>
                </div>
              </div>
              {eta !== null && <div style={{ fontSize: 12, color: eta < 0 ? RED : eta < 7 ? AMBER : GREEN, fontWeight: 700 }}>{eta < 0 ? `${Math.abs(eta)}d overdue` : `${eta}d until arrival`}</div>}
              <div style={{ fontSize: 10, color: GOLD, marginTop: 6, fontWeight: 600 }}>Tap for details {"\u2192"}</div>
            </Card>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 13 }}>No invoices match filter</div>}
      </div>
    </div>
  );
};
