"use client";

import { useState, type Dispatch, type SetStateAction, type ChangeEvent } from "react";
import type { Dress, DressStatus, NewShipmentForm, Shipment, ShipmentMethod, ShipmentStatus, TimelineCategory, TimelineType } from "@/types";
import { MFRS, GOLD, RED, GREEN, BLUE, AMBER } from "@/constants";
import { daysUntil, fmtDate, sum, uid, nowISO, nowTime } from "@/lib/helpers";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Lbl } from "@/components/ui/label";
import { Inp, Sel } from "@/components/ui/form-elements";
import { BtnGold } from "@/components/ui/buttons";
import { ShipmentDetail } from "./shipment-detail";

interface ShipmentsViewProps {
  shipments: Shipment[];
  setShipments: Dispatch<SetStateAction<Shipment[]>>;
  dresses: Dress[];
  setDresses: Dispatch<SetStateAction<Dress[]>>;
}

export const ShipmentsView = ({ shipments, setShipments, dresses, setDresses }: ShipmentsViewProps) => {
  const [showAdd, setShowAdd] = useState(false);
  const [selShip, setSelShip] = useState<Shipment | null>(null);
  const [form, setForm] = useState<NewShipmentForm>({ dressIds: [], carrier: "", trackingNo: "", eta: "", method: "sea", mfrId: MFRS[0].id });

  const set = <K extends keyof NewShipmentForm>(k: K, v: NewShipmentForm[K]) => setForm(f => ({ ...f, [k]: v }));
  const mfr = MFRS.find(m => m.id === form.mfrId);
  const toggleD = (id: string) => setForm(f => ({ ...f, dressIds: f.dressIds.includes(id) ? f.dressIds.filter(x => x !== id) : [...f.dressIds, id] }));

  const addShip = () => {
    const units = form.dressIds.reduce((a, id) => { const d = dresses.find(x => x.id === id); return a + (d ? sum(d.quantities) : 0); }, 0);
    setShipments(s => [...s, {
      id: `SHP-${String(s.length + 1).padStart(3, "0")}`, units, ...form,
      status: "Awaiting Pickup" as ShipmentStatus, lastUpdate: "Shipment created",
      updates: [{ date: nowISO(), time: nowTime(), type: "tracking", content: "Shipment created and awaiting pickup" }],
    }]);
    setShowAdd(false);
  };

  const handleStatusChange = (shipId: string, newStatus: ShipmentStatus) => {
    setShipments(p => p.map(s => {
      if (s.id !== shipId) return s;
      return {
        ...s, status: newStatus, lastUpdate: `Status updated to ${newStatus}`,
        updates: [...(s.updates || []), { date: nowISO(), time: nowTime(), type: "tracking" as const, content: `Shipment status changed to ${newStatus}` }],
      };
    }));

    const ship = shipments.find(s => s.id === shipId);
    if (newStatus === "Delayed" && ship) {
      ship.dressIds.forEach(dId => {
        setDresses(prev => prev.map(d => {
          if (d.id !== dId) return d;
          const alreadyDelayed = d.status === "delayed";
          const alertMsg = `Shipment ${ship.id} (${ship.carrier}) marked as delayed`;
          const hasAlert = d.alerts.includes(alertMsg);
          return {
            ...d,
            status: "delayed" as DressStatus,
            alerts: hasAlert ? d.alerts : [...d.alerts, alertMsg],
            timeline: [...d.timeline, {
              id: uid(), date: nowISO(), time: nowTime(), type: "shipping" as TimelineType,
              source: `Shipment ${ship.id} Delay`,
              content: `\u26a0 Shipment ${ship.id} (${ship.carrier}) has been marked as delayed${!alreadyDelayed ? " \u2014 dress status updated to Delayed" : ""}`,
              user: "System", category: "shipping" as TimelineCategory,
            }],
          };
        }));
      });
    }

    if (newStatus === "Delivered" && ship) {
      ship.dressIds.forEach(dId => {
        setDresses(prev => prev.map(d => {
          if (d.id !== dId) return d;
          return {
            ...d, status: "received" as DressStatus,
            timeline: [...d.timeline, {
              id: uid(), date: nowISO(), time: nowTime(), type: "shipping" as TimelineType,
              source: `Shipment ${ship.id} Delivered`,
              content: `Shipment ${ship.id} delivered \u2014 dress marked as received`,
              user: "System", category: "shipping" as TimelineCategory,
            }],
          };
        }));
      });
    }

    if (selShip && selShip.id === shipId) {
      setSelShip(prev => prev ? ({
        ...prev, status: newStatus, lastUpdate: `Status updated to ${newStatus}`,
        updates: [...(prev.updates || []), { date: nowISO(), time: nowTime(), type: "tracking" as const, content: `Shipment status changed to ${newStatus}` }],
      }) : null);
    }
  };

  return (
    <div className="fade-up">
      {selShip && <ShipmentDetail ship={selShip} onClose={() => setSelShip(null)} dresses={dresses} onStatusChange={handleStatusChange} />}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>Shipments</div>
        <BtnGold small onClick={() => setShowAdd(!showAdd)}>+ Track</BtnGold>
      </div>

      <Card style={{ padding: "12px 16px", marginBottom: 16 }}>
        <Lbl>Transit Times</Lbl>
        {MFRS.map(m => (
          <div key={m.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
            <span style={{ fontSize: 13, fontWeight: 600 }}>{m.name} <span style={{ color: "var(--text3)", fontWeight: 400 }}>({m.country})</span></span>
            <div style={{ display: "flex", gap: 6 }}>
              <span style={{ fontSize: 10, color: BLUE, background: "var(--blue-bg)", borderRadius: 20, padding: "2px 9px" }}>{"\u2708"} {m.airDays}d</span>
              <span style={{ fontSize: 10, color: "var(--text2)", background: "var(--surface2)", borderRadius: 20, padding: "2px 9px" }}>{"\ud83d\udea2"} {m.seaWeeks}w</span>
            </div>
          </div>
        ))}
      </Card>

      {showAdd && (
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>New Shipment</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <div><Lbl>Manufacturer</Lbl><Sel value={form.mfrId} onChange={(e: ChangeEvent<HTMLSelectElement>) => set("mfrId", e.target.value)}>{MFRS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}</Sel></div>
            {mfr && <div style={{ background: "var(--gold-bg)", border: `1px solid ${GOLD}22`, borderRadius: 10, padding: "8px 12px", fontSize: 12, color: GOLD }}>{"\u2708"} Air: {mfr.airDays}d \u00b7 {"\ud83d\udea2"} Sea: {mfr.seaWeeks}w from {mfr.country}</div>}
            <div><Lbl>Link Dresses</Lbl><div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{dresses.filter(d => d.manufacturerId === form.mfrId).map(d => <Chip key={d.id} active={form.dressIds.includes(d.id)} onClick={() => toggleD(d.id)}>{d.poNumber}</Chip>)}</div></div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div><Lbl>Carrier</Lbl><Inp value={form.carrier} onChange={(e: ChangeEvent<HTMLInputElement>) => set("carrier", e.target.value)} placeholder="DHL, Maersk..." /></div>
              <div><Lbl>Tracking #</Lbl><Inp value={form.trackingNo} onChange={(e: ChangeEvent<HTMLInputElement>) => set("trackingNo", e.target.value)} /></div>
              <div><Lbl>Method</Lbl><Sel value={form.method} onChange={(e: ChangeEvent<HTMLSelectElement>) => set("method", e.target.value as ShipmentMethod)}><option value="sea">{"\ud83d\udea2"} Sea</option><option value="air">{"\u2708"} Air</option></Sel></div>
              <div><Lbl>ETA</Lbl><Inp type="date" value={form.eta} onChange={(e: ChangeEvent<HTMLInputElement>) => set("eta", e.target.value)} /></div>
            </div>
            <BtnGold onClick={addShip}>Add Shipment</BtnGold>
          </div>
        </Card>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {shipments.map(s => {
          const linked = dresses.filter(d => s.dressIds.includes(d.id));
          const eta = s.eta ? daysUntil(s.eta) : null;
          const m = MFRS.find(x => x.id === s.mfrId);
          const isDelayed = s.status === "Delayed";
          return (
            <Card key={s.id} onClick={() => setSelShip(s)} alert={isDelayed} style={{ padding: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <div><div style={{ fontSize: 10, color: GOLD, letterSpacing: 1 }}>{s.id}</div><div style={{ fontWeight: 700, fontSize: 15 }}>{s.carrier}</div><div style={{ fontSize: 11, color: "var(--text3)", marginTop: 2 }}>{m?.name} \u00b7 {s.method === "air" ? "\u2708" : "\ud83d\udea2"}</div></div>
                <div style={{ textAlign: "right" }}><span style={{ fontSize: 10, background: isDelayed ? "var(--red-bg)" : s.status === "Delivered" ? "var(--green-bg)" : "var(--blue-bg)", color: isDelayed ? RED : s.status === "Delivered" ? GREEN : BLUE, borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>{s.status}</span></div>
              </div>
              {linked.length > 0 && (
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
                  {linked.map(d => <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 5, background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "3px 8px" }}>{d.imageUrl && <img src={d.imageUrl} alt="" style={{ width: 16, height: 20, objectFit: "cover", borderRadius: 3 }} />}<span style={{ fontSize: 10, color: GOLD }}>{d.poNumber}</span></div>)}
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 6 }}>
                {([["Tracking", s.trackingNo || "\u2014"], ["ETA", s.eta ? fmtDate(s.eta) : "\u2014"], ["Units", `${s.units}u`]] as [string, string][]).map(([l, v]) => <div key={l}><div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>{l}</div><div style={{ fontSize: 13, fontWeight: 600, marginTop: 1 }}>{v}</div></div>)}
              </div>
              {eta !== null && <div style={{ fontSize: 12, color: eta < 0 ? RED : eta < 7 ? AMBER : GREEN, fontWeight: 700 }}>{eta < 0 ? `${Math.abs(eta)}d overdue` : `${eta}d until arrival`}</div>}
              <div style={{ fontSize: 11, color: "var(--text3)", marginTop: 4 }}>{"\u21b3"} {s.lastUpdate}</div>
              <div style={{ fontSize: 10, color: GOLD, marginTop: 6, fontWeight: 600 }}>Tap for details {"\u2192"}</div>
            </Card>
          );
        })}
        {shipments.length === 0 && <div style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 13 }}>No shipments yet</div>}
      </div>
    </div>
  );
};
