"use client";

import type { Dress, Message, Shipment, User, TabId } from "@/types";
import { COLLECTIONS, STATUS, GREEN, RED, AMBER, MUTED, GOLD } from "@/constants";
import { daysUntil, fmtDate, sum } from "@/lib/helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Lbl } from "@/components/ui/label";
import { Ring } from "@/components/ui/ring";

interface HomeViewProps {
  dresses: Dress[];
  messages: Message[];
  shipments: Shipment[];
  user: User;
  setTab: (tab: TabId) => void;
  setColFilter: (id: string) => void;
}

export const HomeView = ({ dresses, messages, shipments, user, setTab, setColFilter }: HomeViewProps) => {
  const delayed = dresses.filter(d => d.status === "delayed");
  const needsReview = messages.filter(m => m.needsReview && !m.resolved).length;
  const urgent = dresses.filter(d => {
    const dd = daysUntil(d.dueDate);
    return dd >= 0 && dd < 21 && !["received", "cancelled"].includes(d.status);
  });

  return (
    <div className="fade-up">
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 10, color: "var(--text3)", letterSpacing: 2, textTransform: "uppercase", marginBottom: 8 }}>
          {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
        </div>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 28, fontWeight: 600, lineHeight: 1.2 }}>
          Good {new Date().getHours() < 12 ? "morning" : "afternoon"},<br />{user.name.split(" ")[0]}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 28 }}>
        {[
          { l: "Active POs", v: dresses.filter(d => !["cancelled", "received"].includes(d.status)).length, c: "var(--text)" },
          { l: "Delayed", v: delayed.length, c: delayed.length > 0 ? RED : GREEN },
          { l: "Needs Review", v: needsReview, c: needsReview > 0 ? AMBER : "var(--text)" },
          { l: "Shipments", v: shipments.length, c: "var(--text)" },
        ].map(({ l, v, c }) => (
          <div key={l} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 14, padding: "14px 16px", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 10, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>{l}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: c, fontFamily: "var(--font-display)" }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{ marginBottom: 28 }}>
        <Lbl>Collections</Lbl>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 8 }}>
          {COLLECTIONS.map(col => {
            const cd = dresses.filter(d => d.collectionId === col.id);
            const onTrack = cd.filter(d => ["ontrack", "received", "shipped"].includes(d.status)).length;
            const dl = cd.filter(d => d.status === "delayed").length;
            const empty = col.slots - cd.length;
            return (
              <Card key={col.id} onClick={() => { setColFilter(col.id); setTab("dresses"); }} style={{ padding: 14 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div style={{ position: "relative", flexShrink: 0 }}>
                    <Ring value={onTrack} total={col.slots} color={col.color} size={56} stroke={4} />
                    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                      <span style={{ fontSize: 15, fontWeight: 800, lineHeight: 1 }}>{onTrack}</span>
                      <span style={{ fontSize: 8, color: "var(--text3)" }}>/{col.slots}</span>
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "var(--font-display)", fontSize: 16, fontWeight: 600 }}>{col.name}</div>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                      {dl > 0 && <span style={{ fontSize: 9, color: RED, background: "var(--red-bg)", borderRadius: 20, padding: "1px 8px", fontWeight: 600 }}>\u26a0 {dl} delayed</span>}
                      {empty > 0 && <span style={{ fontSize: 9, color: MUTED, background: "var(--surface2)", borderRadius: 20, padding: "1px 8px" }}>{empty} empty</span>}
                      {dl === 0 && empty === 0 && <span style={{ fontSize: 9, color: GREEN, background: "var(--green-bg)", borderRadius: 20, padding: "1px 8px" }}>\u2713 Full</span>}
                    </div>
                  </div>
                  <div style={{ color: "var(--border2)", fontSize: 18 }}>\u203a</div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(12,1fr)", gap: 3, marginTop: 10 }}>
                  {Array.from({ length: col.slots }, (_, i) => {
                    const d = cd[i];
                    const c = d ? (STATUS[d.status]?.color || MUTED) : "rgba(0,0,0,0.06)";
                    return <div key={i} style={{ height: 5, borderRadius: 3, background: c }} />;
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {urgent.length > 0 && (
        <div style={{ marginBottom: 28 }}>
          <Lbl>\u26a0 Due Within 21 Days</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {urgent.slice(0, 5).map(dress => {
              const dd = daysUntil(dress.dueDate);
              return (
                <Card key={dress.id} style={{ padding: "10px 14px", borderLeft: `3px solid ${dd < 7 ? RED : AMBER}` }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      {dress.imageUrl && <img src={dress.imageUrl} alt="" style={{ width: 36, height: 44, objectFit: "cover", borderRadius: 6 }} />}
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13 }}>{dress.name}</div>
                        <div style={{ fontSize: 10, color: "var(--text3)" }}>{dress.poNumber}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <Badge status={dress.status} small />
                      <div style={{ fontSize: 11, color: dd < 7 ? RED : AMBER, fontWeight: 700, marginTop: 3 }}>{dd}d</div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
