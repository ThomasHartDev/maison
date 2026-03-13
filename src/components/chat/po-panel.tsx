"use client";

import { useState } from "react";
import type { Dress, Collection, Manufacturer, DressStatus } from "@/types";
import { Badge } from "@/components/ui/badge";
import { sum } from "@/lib/helpers";
import { GOLD, STATUSES, STATUS } from "@/constants";

interface POPanelProps {
  dresses: Dress[];
  changedPOs: Set<string>;
  collections?: Collection[];
  manufacturers?: Manufacturer[];
  onSelectDress?: (dress: Dress) => void;
}

export const POPanel = ({ dresses, changedPOs }: POPanelProps) => (
  <POPanelWithDetail dresses={dresses} changedPOs={changedPOs} />
);

const selectStyle: React.CSSProperties = {
  width: "100%",
  padding: "6px 8px",
  fontSize: 11,
  borderRadius: 6,
  border: "1px solid var(--border)",
  background: "var(--surface)",
  color: "var(--text)",
  appearance: "auto",
  cursor: "pointer",
};

export const POPanelWithDetail = ({ dresses, changedPOs, collections = [], manufacturers = [], onSelectDress }: POPanelProps) => {
  const [fCol, setFCol] = useState("all");
  const [fMfr, setFMfr] = useState("all");
  const [fSt, setFSt] = useState<DressStatus | "all">("all");

  const filtered = dresses.filter(d =>
    (fCol === "all" || d.collectionId === fCol) &&
    (fMfr === "all" || d.manufacturerId === fMfr) &&
    (fSt === "all" || d.status === fSt),
  );

  return (
    <div style={{
      width: 320,
      borderRight: "1px solid var(--border)",
      display: "flex",
      flexDirection: "column",
      flexShrink: 0,
    }}>
      {/* Filter bar — pinned at top */}
      <div style={{ padding: "12px 12px 8px", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
        <div style={{
          fontSize: 10,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: GOLD,
          fontWeight: 700,
          marginBottom: 10,
          paddingLeft: 2,
        }}>
          Purchase Orders
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
          <select value={fCol} onChange={e => setFCol(e.target.value)} style={selectStyle}>
            <option value="all">All Collections ({dresses.length})</option>
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select value={fMfr} onChange={e => setFMfr(e.target.value)} style={selectStyle}>
            <option value="all">All Manufacturers</option>
            {manufacturers.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
          <select value={fSt} onChange={e => setFSt(e.target.value as DressStatus | "all")} style={selectStyle}>
            <option value="all">All Statuses</option>
            {STATUSES.map(s => (
              <option key={s} value={s}>{STATUS[s].label}</option>
            ))}
          </select>
        </div>
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 6, paddingLeft: 2 }}>
          {filtered.length} of {dresses.length} POs
        </div>
      </div>

      {/* Scrollable PO list */}
      <div style={{ flex: 1, overflowY: "auto", padding: "8px 12px" }}>
        {filtered.map(d => {
          const justChanged = changedPOs.has(d.poNumber);
          return (
            <div
              key={d.id}
              onClick={() => onSelectDress?.(d)}
              style={{
                padding: "10px 12px",
                borderRadius: 10,
                marginBottom: 6,
                background: justChanged ? "rgba(158,124,60,0.08)" : "var(--surface)",
                border: `1px solid ${justChanged ? GOLD : "var(--border)"}`,
                transition: "all 0.5s ease",
                cursor: onSelectDress ? "pointer" : "default",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{d.poNumber}</span>
                <Badge status={d.status} />
              </div>
              <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.name}</div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
                <span>Due: {d.dueDate || "\u2014"}</span>
                <span>{sum(d.quantities)} units</span>
              </div>
              {d.alerts.length > 0 && (
                <div style={{ fontSize: 10, color: "#c0392b", marginTop: 4 }}>
                  {d.alerts.length} alert{d.alerts.length > 1 ? "s" : ""}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--text3)", padding: "24px 8px", fontSize: 12 }}>
            No POs match filters
          </div>
        )}
      </div>
    </div>
  );
};
