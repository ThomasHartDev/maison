"use client";

import { useState, useEffect, useMemo, type Dispatch, type SetStateAction } from "react";
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

interface DressGroup {
  name: string;
  imageUrl: string | null;
  orders: Dress[];
}

export const DressesView = ({ dresses, setDresses, collections, manufacturers, user, initCol }: DressesViewProps) => {
  const [sel, setSel] = useState<Dress | null>(null);
  const [fCol, setFCol] = useState(initCol || "all");
  const [fSt, setFSt] = useState<DressStatus | "all">("all");
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => { if (initCol) setFCol(initCol); }, [initCol]);

  const filtered = dresses.filter(d => (fCol === "all" || d.collectionId === fCol) && (fSt === "all" || d.status === fSt));

  const groups = useMemo(() => {
    const map = new Map<string, DressGroup>();
    for (const d of filtered) {
      const existing = map.get(d.name);
      if (existing) {
        existing.orders.push(d);
        if (!existing.imageUrl && d.imageUrl) existing.imageUrl = d.imageUrl;
      } else {
        map.set(d.name, { name: d.name, imageUrl: d.imageUrl, orders: [d] });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [filtered]);

  const handleUpdate = (u: Dress) => {
    setDresses(p => p.map(d => d.id === u.id ? u : d));
    setSel(u);
  };

  const handleGroupClick = (group: DressGroup) => {
    if (group.orders.length === 1) {
      setSel(group.orders[0]);
    } else {
      setExpanded(prev => prev === group.name ? null : group.name);
    }
  };

  return (
    <div className="fade-up">
      {sel && <DressDetail dress={sel} onClose={() => setSel(null)} onUpdate={handleUpdate} allDresses={dresses} collections={collections} manufacturers={manufacturers} user={user} />}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>Dresses</div>
        <div style={{ fontSize: 12, color: "var(--text3)" }}>{groups.length} styles · {filtered.length} POs</div>
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
        {groups.map(group => {
          const isExpanded = expanded === group.name;
          const hasMultiple = group.orders.length > 1;
          const primary = group.orders[0];
          const mfr = manufacturers.find(m => m.id === primary.manufacturerId);

          return (
            <div key={group.name}>
              {/* Dress title card */}
              <Card onClick={() => handleGroupClick(group)} style={{ padding: 0 }}>
                <div style={{ display: "flex" }}>
                  <div style={{ width: 72, minHeight: 80, flexShrink: 0, background: "var(--surface2)", position: "relative" }}>
                    {group.imageUrl
                      ? <img src={group.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text3)", fontSize: 20 }}>{"\ud83d\udcf7"}</div>}
                  </div>
                  <div style={{ flex: 1, padding: "10px 14px 10px 12px", display: "flex", flexDirection: "column", justifyContent: "center", minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{group.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 2 }}>
                          {mfr?.name || primary.manufacturerName || "Unknown"} · {primary.collectionName || "No Collection"}
                        </div>
                      </div>
                      {hasMultiple
                        ? <div style={{ fontSize: 11, color: GOLD, fontWeight: 700, whiteSpace: "nowrap", padding: "2px 8px", background: "var(--gold-bg)", borderRadius: 12 }}>
                            {group.orders.length} POs {isExpanded ? "▲" : "▼"}
                          </div>
                        : <Badge status={primary.status} small />
                      }
                    </div>
                    {!hasMultiple && (
                      <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                        <span style={{ fontSize: 9, color: GOLD, letterSpacing: 1, fontWeight: 700 }}>{primary.inventoryItemSku || primary.poNumber}</span>
                        {primary.dueDate && (() => {
                          const dd = daysUntil(primary.dueDate);
                          return <span style={{ fontSize: 10, color: dd < 0 ? "#c0392b" : dd < 14 ? "#d4820a" : "#27855a", fontWeight: 700 }}>{dd < 0 ? `${Math.abs(dd)}d late` : `${dd}d`}</span>;
                        })()}
                        <span style={{ fontSize: 10, color: "var(--text3)" }}>{sum(primary.quantities)}u</span>
                      </div>
                    )}
                    {hasMultiple && !isExpanded && (
                      <div style={{ display: "flex", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
                        {group.orders.map(o => <Badge key={o.id} status={o.status} small />)}
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Expanded PO sub-cards */}
              {isExpanded && (
                <div style={{ marginLeft: 24, borderLeft: `2px solid ${GOLD}`, paddingLeft: 12, marginTop: 4, display: "flex", flexDirection: "column", gap: 4 }}>
                  {group.orders.map(po => {
                    const dd = po.dueDate ? daysUntil(po.dueDate) : null;
                    return (
                      <Card key={po.id} onClick={() => setSel(po)} alert={po.alerts.length > 0} style={{ padding: "8px 12px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: GOLD }}>{po.poNumber}</div>
                            <div style={{ display: "flex", gap: 10, marginTop: 2 }}>
                              {dd !== null && <span style={{ fontSize: 10, color: dd < 0 ? "#c0392b" : dd < 14 ? "#d4820a" : "#27855a", fontWeight: 700 }}>{dd < 0 ? `${Math.abs(dd)}d late` : `Due ${dd}d`}</span>}
                              <span style={{ fontSize: 10, color: "var(--text3)" }}>{sum(po.quantities)}u</span>
                              {po.collectionName && <span style={{ fontSize: 10, color: "var(--text3)" }}>{po.collectionName}</span>}
                            </div>
                          </div>
                          <Badge status={po.status} small />
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
        {groups.length === 0 && <div style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 13 }}>No dresses match filters</div>}
      </div>
    </div>
  );
};
