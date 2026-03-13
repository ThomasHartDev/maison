"use client";

import { useState, useRef, type ChangeEvent } from "react";
import type { Dress, DressStatus, TimelineEntry, User } from "@/types";
import { COLLECTIONS, MFRS, SIZES, STATUSES, STATUS, GOLD, RED, AMBER, GREEN, BLUE } from "@/constants";
import { daysUntil, fmtDate, sum, uid, nowISO, nowTime } from "@/lib/helpers";
import { Overlay } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Lbl } from "@/components/ui/label";
import { Txa } from "@/components/ui/form-elements";
import { BtnGold, BtnGhost } from "@/components/ui/buttons";

interface DressDetailProps {
  dress: Dress;
  onClose: () => void;
  onUpdate: (dress: Dress) => void;
  user: User;
}

export const DressDetail = ({ dress, onClose, onUpdate, user }: DressDetailProps) => {
  const [comment, setComment] = useState("");
  const [img, setImg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mfr = MFRS.find(m => m.id === dress.manufacturerId);
  const d = daysUntil(dress.dueDate);
  const done = dress.milestones.filter(m => m.done).length;

  const addEntry = () => {
    if (!comment && !img) return;
    const entry: TimelineEntry = {
      id: uid(), date: nowISO(), time: nowTime(),
      type: img ? "image" : "comment",
      source: `Comment by ${user.name}`,
      content: comment || "Image uploaded",
      user: user.name, imageUrl: img || null, category: "design",
    };
    onUpdate({ ...dress, timeline: [...dress.timeline, entry] });
    setComment("");
    setImg(null);
  };

  const setStatus = (s: DressStatus) => {
    const entry: TimelineEntry = {
      id: uid(), date: nowISO(), time: nowTime(),
      type: "system", source: "Status Change",
      content: `Status \u2192 ${STATUS[s].label}`,
      user: user.name, category: "design",
    };
    onUpdate({ ...dress, status: s, timeline: [...dress.timeline, entry] });
  };

  const toggleMs = (i: number) => {
    const ms = [...dress.milestones];
    ms[i] = { ...ms[i], done: !ms[i].done };
    const entry: TimelineEntry = {
      id: uid(), date: nowISO(), time: nowTime(),
      type: "system", source: "Milestone",
      content: `${ms[i].label}: ${ms[i].done ? "\u2713" : "unchecked"}`,
      user: user.name, category: "design",
    };
    onUpdate({ ...dress, milestones: ms, timeline: [...dress.timeline, entry] });
  };

  return (
    <Overlay onClose={onClose} wide>
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
        {dress.imageUrl && <img src={dress.imageUrl} alt="" style={{ width: 72, height: 90, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, fontWeight: 700 }}>{dress.poNumber}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--text)", lineHeight: 1.2, marginTop: 2 }}>{dress.name}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>{COLLECTIONS.find(c => c.id === dress.collectionId)?.name} \u00b7 {mfr?.name}</div>
          <div style={{ marginTop: 6 }}><Badge status={dress.status} /></div>
        </div>
        <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 22, alignSelf: "flex-start", padding: 4 }}>\u00d7</button>
      </div>

      <div className="dress-detail-body">
        <div className="dress-detail-left">
          {dress.alerts.map((a, i) => (
            <div key={i} style={{ background: "var(--red-bg)", border: `1px solid ${RED}22`, borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: RED, display: "flex", gap: 8 }}>
              <span>\u26a0</span><span>{a}</span>
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
            <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Due</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginTop: 2 }}>{fmtDate(dress.dueDate)}</div>
            </div>
            <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 16px" }}>
              <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Countdown</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: d < 0 ? RED : d < 14 ? AMBER : GREEN, marginTop: 2 }}>
                {d < 0 ? `${Math.abs(d)}d LATE` : `${d}d`}
              </div>
            </div>
          </div>

          <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <Lbl>Production ({done}/{dress.milestones.length})</Lbl>
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              {dress.milestones.map((m, i) => (
                <div key={i} onClick={() => toggleMs(i)} style={{ flex: 1, cursor: "pointer", textAlign: "center" }}>
                  <div style={{ height: 4, borderRadius: 2, background: m.done ? GREEN : "rgba(0,0,0,0.08)", marginBottom: 6, transition: "background 0.2s" }} />
                  <div style={{ fontSize: 9, color: m.done ? GREEN : "var(--text3)", fontWeight: 600, lineHeight: 1.2 }}>{m.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <Lbl>Size Breakdown</Lbl>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 6, marginTop: 6 }}>
              {SIZES.map(s => (
                <div key={s} style={{ textAlign: "center", background: "var(--surface)", borderRadius: 8, padding: "6px 2px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: 9, color: GOLD, fontWeight: 700 }}>{s}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontFamily: "var(--font-display)" }}>{dress.quantities[s]}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, color: GOLD, fontSize: 12, fontWeight: 700 }}>Total: {sum(dress.quantities)} units</div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Lbl>Update Status</Lbl>
            <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
              {STATUSES.filter(s => s !== "draft").map(s => (
                <Chip key={s} active={dress.status === s} onClick={() => setStatus(s)} color={STATUS[s].color}>{STATUS[s].label}</Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="dress-detail-right">
          <div style={{ marginBottom: 16 }}>
            <Lbl>Timeline ({dress.timeline.length})</Lbl>
            <div className="timeline-entries" style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto", marginTop: 6 }}>
              {[...dress.timeline].reverse().map(e => {
                const ic = e.type === "alert" ? "\u26a0" : e.type === "whatsapp" ? "\ud83d\udcac" : e.type === "email" ? "\ud83d\udce7" : e.type === "image" ? "\ud83d\udcf7" : e.type === "shipping" ? "\ud83d\udce6" : "\u25c6";
                const icC = e.type === "alert" ? RED : e.type === "whatsapp" ? "#25d366" : e.type === "email" ? BLUE : e.type === "shipping" ? AMBER : e.type === "comment" ? GOLD : "var(--text3)";
                return (
                  <div key={e.id} style={{ display: "flex", gap: 10, padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
                    <div style={{ width: 24, height: 24, borderRadius: "50%", background: icC + "14", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, flexShrink: 0 }}>{ic}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4 }}>{e.content}</div>
                      {e.imageUrl && <img src={e.imageUrl} alt="" style={{ marginTop: 6, maxWidth: "100%", maxHeight: 100, borderRadius: 8, objectFit: "cover" }} />}
                      <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 3 }}>{fmtDate(e.date)} {e.time} \u00b7 <span style={{ color: icC }}>{e.source}</span> \u00b7 {e.user}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <Lbl>Add to Timeline</Lbl>
            <Txa value={comment} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setComment(e.target.value)} rows={3} placeholder="Add a note..." />
            {img && <img src={img} alt="" style={{ maxHeight: 60, marginTop: 8, borderRadius: 6 }} />}
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <BtnGhost small onClick={() => fileRef.current?.click()}>\ud83d\udcce Attach</BtnGhost>
              <BtnGold small onClick={addEntry} style={{ flex: 1 }}>Add Entry</BtnGold>
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) setImg(URL.createObjectURL(f)); }} />
          </div>
        </div>
      </div>
    </Overlay>
  );
};
