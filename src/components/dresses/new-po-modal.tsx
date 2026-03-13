"use client";

import { useState, useRef, type ChangeEvent } from "react";
import type { NewPOForm, Size } from "@/types";
import { COLLECTIONS, MFRS, SIZES, GOLD } from "@/constants";
import { sum } from "@/lib/helpers";
import { Overlay } from "@/components/ui/overlay";
import { Lbl } from "@/components/ui/label";
import { Inp, Sel } from "@/components/ui/form-elements";
import { BtnGold, BtnGhost } from "@/components/ui/buttons";

interface NewPOModalProps {
  onClose: () => void;
  onCreate: (form: NewPOForm) => void;
  nextPO: string;
}

export const NewPOModal = ({ onClose, onCreate, nextPO }: NewPOModalProps) => {
  const [form, setForm] = useState<NewPOForm>({
    name: "", collectionId: COLLECTIONS[0].id, manufacturerId: MFRS[0].id,
    dueDate: "", imageUrl: "", quantities: { XS: 0, S: 0, M: 0, L: 0, XL: 0, XXL: 0 },
  });
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof NewPOForm>(k: K, v: NewPOForm[K]) => setForm(f => ({ ...f, [k]: v }));
  const setQ = (s: Size, v: string) => setForm(f => ({ ...f, quantities: { ...f.quantities, [s]: parseInt(v) || 0 } }));
  const mfr = MFRS.find(m => m.id === form.manufacturerId);

  const submit = () => {
    if (!form.name || !form.dueDate) return alert("Enter dress name and due date");
    onCreate(form);
    onClose();
  };

  return (
    <Overlay onClose={onClose}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
        <div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 24, fontWeight: 600 }}>New Purchase Order</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 2 }}>{nextPO}</div>
        </div>
        <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 24 }}>\u00d7</button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
        <div style={{ gridColumn: "1/-1" }}>
          <Lbl>Dress Name</Lbl>
          <Inp value={form.name} onChange={(e: ChangeEvent<HTMLInputElement>) => set("name", e.target.value)} placeholder="e.g. Florentine Wrap" />
        </div>
        <div><Lbl>Collection</Lbl><Sel value={form.collectionId} onChange={(e: ChangeEvent<HTMLSelectElement>) => set("collectionId", e.target.value)}>{COLLECTIONS.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</Sel></div>
        <div><Lbl>Manufacturer</Lbl><Sel value={form.manufacturerId} onChange={(e: ChangeEvent<HTMLSelectElement>) => set("manufacturerId", e.target.value)}>{MFRS.map(m => <option key={m.id} value={m.id}>{m.name} ({m.country})</option>)}</Sel></div>
        <div style={{ gridColumn: "1/-1" }}><Lbl>Due Date</Lbl><Inp type="date" value={form.dueDate} onChange={(e: ChangeEvent<HTMLInputElement>) => set("dueDate", e.target.value)} /></div>
      </div>
      {mfr && <div style={{ background: "var(--gold-bg)", border: `1px solid ${GOLD}22`, borderRadius: 10, padding: "9px 14px", fontSize: 12, color: GOLD, marginBottom: 14 }}>\ud83d\udea2 {mfr.name} ({mfr.country}) \u2014 Sea: ~{mfr.seaWeeks}wk \u00b7 Air: {mfr.airDays}d</div>}
      <div style={{ marginBottom: 14 }}>
        <Lbl>Design Image</Lbl>
        <div onClick={() => fileRef.current?.click()} style={{ border: "2px dashed var(--border2)", borderRadius: 12, padding: 16, textAlign: "center", cursor: "pointer" }}>
          {preview ? <img src={preview} alt="" style={{ maxHeight: 140, borderRadius: 8, objectFit: "cover", margin: "0 auto" }} /> : <div style={{ color: "var(--text3)" }}><div style={{ fontSize: 24, marginBottom: 4 }}>\ud83d\udcf7</div><div style={{ fontSize: 12 }}>Upload image</div></div>}
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e: ChangeEvent<HTMLInputElement>) => { const f = e.target.files?.[0]; if (f) { setPreview(URL.createObjectURL(f)); set("imageUrl", URL.createObjectURL(f)); } }} />
        <Inp value={form.imageUrl} onChange={(e: ChangeEvent<HTMLInputElement>) => { set("imageUrl", e.target.value); setPreview(e.target.value); }} placeholder="or paste URL" style={{ marginTop: 8, fontSize: 12 }} />
      </div>
      <div style={{ marginBottom: 20 }}>
        <Lbl>Quantities</Lbl>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 8 }}>
          {SIZES.map(s => <div key={s}><div style={{ fontSize: 10, color: GOLD, textAlign: "center", fontWeight: 700, marginBottom: 3 }}>{s}</div><Inp type="number" min="0" value={form.quantities[s]} onChange={(e: ChangeEvent<HTMLInputElement>) => setQ(s, e.target.value)} style={{ textAlign: "center", padding: "8px 2px" }} /></div>)}
        </div>
        <div style={{ marginTop: 8, color: GOLD, fontSize: 12, fontWeight: 700 }}>Total: {sum(form.quantities)} units</div>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <BtnGhost onClick={onClose} style={{ flex: 1 }}>Cancel</BtnGhost>
        <BtnGold onClick={submit} style={{ flex: 2 }}>Submit PO</BtnGold>
      </div>
    </Overlay>
  );
};
