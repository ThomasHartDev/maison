import type { Dress } from "@/types";
import { Badge } from "@/components/ui/badge";
import { sum } from "@/lib/helpers";
import { GOLD } from "@/constants";

interface POPanelProps {
  dresses: Dress[];
  changedPOs: Set<string>;
}

export const POPanel = ({ dresses, changedPOs }: POPanelProps) => (
  <div style={{
    width: 320,
    borderRight: "1px solid var(--border)",
    overflowY: "auto",
    padding: "16px 12px",
    flexShrink: 0,
  }}>
    <div style={{
      fontSize: 10,
      letterSpacing: 3,
      textTransform: "uppercase",
      color: GOLD,
      fontWeight: 700,
      marginBottom: 12,
      paddingLeft: 4,
    }}>
      Purchase Orders
    </div>
    {dresses.map(d => {
      const justChanged = changedPOs.has(d.poNumber);
      return (
        <div
          key={d.id}
          style={{
            padding: "10px 12px",
            borderRadius: 10,
            marginBottom: 6,
            background: justChanged ? "rgba(158,124,60,0.08)" : "var(--surface)",
            border: `1px solid ${justChanged ? GOLD : "var(--border)"}`,
            transition: "all 0.5s ease",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "var(--text)" }}>{d.poNumber}</span>
            <Badge status={d.status} />
          </div>
          <div style={{ fontSize: 12, color: "var(--text2)", marginBottom: 4 }}>{d.name}</div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text3)" }}>
            <span>Due: {d.dueDate}</span>
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
  </div>
);
