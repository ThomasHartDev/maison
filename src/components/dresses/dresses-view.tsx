"use client";

import { useState, useEffect, type Dispatch, type SetStateAction } from "react";
import type { Dress, NewPOForm, Role, User, DressStatus } from "@/types";
import { COLLECTIONS, MFRS, STATUSES, STATUS, GOLD } from "@/constants";
import { daysUntil, sum, uid, nowISO, nowTime } from "@/lib/helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { BtnGold } from "@/components/ui/buttons";
import { DressDetail } from "./dress-detail";
import { NewPOModal } from "./new-po-modal";

interface DressesViewProps {
  dresses: Dress[];
  setDresses: Dispatch<SetStateAction<Dress[]>>;
  user: User;
  initCol: string | null;
}

export const DressesView = ({ dresses, setDresses, user, initCol }: DressesViewProps) => {
  const [showNew, setShowNew] = useState(false);
  const [sel, setSel] = useState<Dress | null>(null);
  const [fCol, setFCol] = useState(initCol || "all");
  const [fSt, setFSt] = useState<DressStatus | "all">("all");

  useEffect(() => { if (initCol) setFCol(initCol); }, [initCol]);

  const filtered = dresses.filter(d => (fCol === "all" || d.collectionId === fCol) && (fSt === "all" || d.status === fSt));
  const nextPO = `PO-${String(dresses.length + 1).padStart(3, "0")}`;

  const handleCreate = (form: NewPOForm) => {
    const np: Dress = {
      id: uid(), poNumber: nextPO, name: form.name,
      collectionId: form.collectionId, manufacturerId: form.manufacturerId,
      status: "submitted", dueDate: form.dueDate, orderDate: nowISO(),
      quantities: form.quantities, imageUrl: form.imageUrl,
      milestones: [
        { label: "Fabric Sourced", done: false }, { label: "Cutting", done: false },
        { label: "Sewing", done: false }, { label: "QC Passed", done: false },
        { label: "Dispatched", done: false },
      ],
      timeline: [{
        id: uid(), date: nowISO(), time: nowTime(), type: "system",
        source: "PO Created", content: `PO ${nextPO} submitted`,
        user: user.name, category: "design",
      }],
      alerts: [],
    };
    setDresses(p => [...p, np]);
  };

  const handleUpdate = (u: Dress) => {
    setDresses(p => p.map(d => d.id === u.id ? u : d));
    setSel(u);
  };

  return (
    <div className="fade-up">
      {showNew && <NewPOModal onClose={() => setShowNew(false)} onCreate={handleCreate} nextPO={nextPO} />}
      {sel && <DressDetail dress={sel} onClose={() => setSel(null)} onUpdate={handleUpdate} user={user} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>Dresses</div>
        {(["admin", "design"] as Role[]).includes(user.role) && <BtnGold small onClick={() => setShowNew(true)}>+ New PO</BtnGold>}
      </div>

      <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 8, marginBottom: 10, WebkitOverflowScrolling: "touch" }}>
        <Chip active={fCol === "all"} onClick={() => setFCol("all")}>All</Chip>
        {COLLECTIONS.map(c => <Chip key={c.id} active={fCol === c.id} onClick={() => setFCol(c.id)} color={c.color}>{c.shortName}</Chip>)}
      </div>
      <div style={{ overflowX: "auto", display: "flex", gap: 6, paddingBottom: 8, marginBottom: 18, WebkitOverflowScrolling: "touch" }}>
        <Chip active={fSt === "all"} onClick={() => setFSt("all")}>All Status</Chip>
        {STATUSES.map(s => <Chip key={s} active={fSt === s} onClick={() => setFSt(s)} color={STATUS[s].color}>{STATUS[s].label}</Chip>)}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filtered.map(dress => {
          const dd = daysUntil(dress.dueDate);
          const mfr = MFRS.find(m => m.id === dress.manufacturerId);
          const col = COLLECTIONS.find(c => c.id === dress.collectionId);
          const done = dress.milestones.filter(m => m.done).length;
          return (
            <Card key={dress.id} onClick={() => setSel(dress)} alert={dress.alerts.length > 0} style={{ padding: 0 }}>
              <div style={{ display: "flex" }}>
                <div style={{ width: 72, minHeight: 88, flexShrink: 0, background: "var(--surface2)", position: "relative" }}>
                  {dress.imageUrl ? <img src={dress.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 20 }}>\ud83d\udcf7</div>}
                  {dress.alerts.length > 0 && <div style={{ position: "absolute", top: 4, left: 4, width: 18, height: 18, borderRadius: "50%", background: "#c0392b", color: "#fff", fontSize: 10, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700 }}>!</div>}
                </div>
                <div style={{ flex: 1, padding: "10px 14px 10px 12px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 9, color: GOLD, letterSpacing: 1, fontWeight: 700 }}>{dress.poNumber}</div>
                      <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2, marginTop: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{dress.name}</div>
                      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>{mfr?.name} \u00b7 {col?.shortName}</div>
                    </div>
                    <Badge status={dress.status} small />
                  </div>
                  <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: dd < 0 ? "#c0392b" : dd < 14 ? "#d4820a" : "#27855a", fontWeight: 700 }}>{dd < 0 ? `${Math.abs(dd)}d late` : `${dd}d`}</span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{sum(dress.quantities)}u</span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{done}/{dress.milestones.length} \u2713</span>
                    <span style={{ fontSize: 10, color: "var(--text3)" }}>{dress.timeline.length} entries</span>
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        {filtered.length === 0 && <div style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 13 }}>No dresses match filters</div>}
      </div>
    </div>
  );
};
