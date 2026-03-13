"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import type { Dress, Collection, Manufacturer, User, DressStatus } from "@/types";
import { STATUSES, STATUS, GOLD } from "@/constants";
import { daysUntil, sum } from "@/lib/helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { DressDetail } from "./dress-detail";

interface DressesViewProps {
  dresses: Dress[];
  setDresses: Dispatch<SetStateAction<Dress[]>>;
  collections: Collection[];
  manufacturers: Manufacturer[];
  user: User;
  initCol: string | null;
}

export const DressesView = ({ dresses, setDresses, collections, manufacturers, user, initCol }: DressesViewProps) => {
  const [sel, setSel] = useState<Dress | null>(null);
  const [fCol, setFCol] = useState(initCol || "all");
  const [fSt, setFSt] = useState<DressStatus | "all">("all");

  useEffect(() => { if (initCol) setFCol(initCol); }, [initCol]);

  const filtered = dresses.filter(d => (fCol === "all" || d.collectionId === fCol) && (fSt === "all" || d.status === fSt));

  const handleUpdate = (u: Dress) => {
    setDresses(p => p.map(d => d.id === u.id ? u : d));
    setSel(u);
  };

  return (
    <div className="fade-up">
      {sel && <DressDetail dress={sel} onClose={() => setSel(null)} onUpdate={handleUpdate} allDresses={dresses} collections={collections} manufacturers={manufacturers} user={user} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>Purchase Orders</div>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>{dresses.length} total</div>
      </div>

      <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 8, marginBottom: 10, WebkitOverflowScrolling: "touch" }}>
        <Chip active={fCol === "all"} onClick={() => setFCol("all")}>All</Chip>
        {collections.map(c => <Chip key={c.id} active={fCol === c.id} onClick={() => setFCol(c.id)}>{c.name}</Chip>)}
      </div>
      <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 8, marginBottom: 18, WebkitOverflowScrolling: "touch" }}>
        <Chip active={fSt === "all"} onClick={() => setFSt("all")}>All Status</Chip>
        {STATUSES.map(s => <Chip key={s} active={fSt === s} onClick={() => setFSt(s)} color={STATUS[s].color}>{STATUS[s].label}</Chip>)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(dress => {
          const dd = dress.dueDate ? daysUntil(dress.dueDate) : null;
          const mfr = manufacturers.find(m => m.id === dress.manufacturerId);
          const done = dress.milestones.filter(m => m.done).length;
          return (
            <Card key={dress.id} onClick={() => setSel(dress)} alert={dress.alerts.length > 0} style={{ padding: 0 }}>
              <div style={{ display: "flex" }}>
                <div style={{ width: 72, minHeight: 88, flexShrink: 0, background: "var(--surface2)", position: "relative" }}>
                  {dress.imageUrl ? <img src={dress.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 20 }}>{"\ud83d\udcf7"}</div>}
                  {dress.alerts.length > 0 && <div style={{ position: "absolute", top: 4, left: 4, width: 18, height: 18, borderRadius: "50%", background: "#c0392b", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>!</div>}
                </div>
                <div style={{ flex: 1, padding: "10px 14px 10px 12px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: GOLD, letterSpacing: 1, fontWeight: 700 }}>{dress.inventoryItemSku || dress.poNumber}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dress.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{mfr?.name || dress.manufacturerName} {"\u00b7"} {dress.collectionName || "No Collection"}</div>
                    </div>
                    <Badge status={dress.status} small />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    {dd !== null && <span style={{ fontSize: 10, color: dd < 0 ? "#c0392b" : dd < 14 ? "#d4820a" : "#27855a", fontWeight: 700 }}>{dd < 0 ? `${Math.abs(dd)}d late` : `${dd}d`}</span>}
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{sum(dress.quantities)}u</span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{done}/{dress.milestones.length} {"\u2713"}</span>
                    {dress.orderStatus && <span style={{ fontSize: 10, color: "var(--text3)" }}>{dress.orderStatus}</span>}
                  </div>
                  {dress.tags && dress.tags.length > 0 && (
                    <div style={{ display: "flex", gap: 4, marginTop: 4, flexWrap: "wrap" }}>
                      {dress.tags.slice(0, 3).map(t => <span key={t} style={{ fontSize: 8, background: "var(--gold-bg)", color: GOLD, borderRadius: 20, padding: "1px 6px" }}>{t}</span>)}
                    </div>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 13 }}>No purchase orders match filters</div>}
      </div>
    </div>
  );
};
