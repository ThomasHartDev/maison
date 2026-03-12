"use client";

import type { Dress, Shipment, ShipmentStatus } from "@/types";
import { MFRS, GOLD, RED, GREEN, BLUE, AMBER } from "@/constants";
import { daysUntil, fmtDate, sum } from "@/lib/helpers";
import { Overlay } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Lbl } from "@/components/ui/label";

interface ShipmentDetailProps {
  ship: Shipment;
  onClose: () => void;
  dresses: Dress[];
  onStatusChange: (shipId: string, status: ShipmentStatus) => void;
}

export const ShipmentDetail = ({ ship, onClose, dresses, onStatusChange }: ShipmentDetailProps) => {
  const mfr = MFRS.find(m => m.id === ship.mfrId);
  const linked = dresses.filter(d => ship.dressIds.includes(d.id));
  const eta = ship.eta ? daysUntil(ship.eta) : null;
  const updates = ship.updates || [];

  return (
    <Overlay onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
        <div>
          <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, fontWeight: 700 }}>{ship.id}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600, marginTop: 2 }}>{ship.carrier}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{mfr?.name} \u00b7 {ship.method === "air" ? "\u2708 Air Freight" : "\ud83d\udea2 Sea Freight"}</div>
        </div>
        <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 22 }}>{"\u00d7"}</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 16 }}>
        <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px" }}><div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Tracking</div><div style={{ fontSize: 13, fontWeight: 700, marginTop: 2, wordBreak: "break-all" }}>{ship.trackingNo || "\u2014"}</div></div>
        <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px" }}><div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>ETA</div><div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{ship.eta ? fmtDate(ship.eta) : "\u2014"}</div></div>
        <div style={{ background: "var(--surface2)", borderRadius: 10, padding: "10px 14px" }}><div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Units</div><div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{ship.units}u</div></div>
      </div>

      {eta !== null && <div style={{ fontSize: 14, fontWeight: 700, color: eta < 0 ? RED : eta < 7 ? AMBER : GREEN, marginBottom: 16, textAlign: "center", background: eta < 0 ? "var(--red-bg)" : eta < 7 ? "var(--amber-bg)" : "var(--green-bg)", borderRadius: 10, padding: "10px 14px" }}>{eta < 0 ? `${Math.abs(eta)} days overdue` : `${eta} days until arrival`}</div>}

      {linked.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Lbl>Dresses in this Shipment</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {linked.map(d => (
              <div key={d.id} style={{ display: "flex", gap: 10, alignItems: "center", background: "var(--surface2)", borderRadius: 10, padding: "8px 12px" }}>
                {d.imageUrl && <img src={d.imageUrl} alt="" style={{ width: 36, height: 44, objectFit: "cover", borderRadius: 6 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{d.name}</div>
                  <div style={{ fontSize: 10, color: "var(--text3)" }}>{d.poNumber} \u00b7 {sum(d.quantities)}u</div>
                </div>
                <Badge status={d.status} small />
              </div>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Lbl>Status</Lbl>
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
          {(["Awaiting Pickup", "In Transit", "Customs", "Delayed", "Delivered"] as ShipmentStatus[]).map(st => (
            <Chip key={st} active={ship.status === st} onClick={() => onStatusChange(ship.id, st)} color={st === "Delayed" ? RED : st === "Delivered" ? GREEN : undefined}>{st}</Chip>
          ))}
        </div>
      </div>

      <div>
        <Lbl>Tracking & Email Updates ({updates.length})</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 4, marginTop: 6 }}>
          {[...updates].reverse().map((u, i) => (
            <div key={i} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: u.type === "email" ? BLUE + "14" : GREEN + "14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{u.type === "email" ? "\ud83d\udce7" : "\ud83d\udccd"}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, lineHeight: 1.4 }}>{u.content}</div>
                <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{fmtDate(u.date)} {u.time}{u.from ? ` \u00b7 ${u.from}` : ""}</div>
              </div>
            </div>
          ))}
          {updates.length === 0 && <div style={{ color: "var(--text3)", fontSize: 12, padding: 16, textAlign: "center" }}>No updates yet</div>}
        </div>
      </div>
    </Overlay>
  );
};
