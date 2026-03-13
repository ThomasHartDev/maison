"use client";

import { useState } from "react";
import type { Dress, DressStatus, Collection, Manufacturer, User, SizeBreakdown } from "@/types";
import { STATUSES, STATUS, GOLD, RED, AMBER, GREEN } from "@/constants";
import { daysUntil, fmtDate, sum } from "@/lib/helpers";
import { Overlay } from "@/components/ui/overlay";
import { Badge } from "@/components/ui/badge";
import { Chip } from "@/components/ui/chip";
import { Lbl } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

interface DressDetailProps {
  dress: Dress;
  onClose: () => void;
  onUpdate: (dress: Dress) => void;
  allDresses?: Dress[];
  collections?: Collection[];
  manufacturers?: Manufacturer[];
  user: User;
}

function SizeGrid({ sizes }: { sizes: SizeBreakdown | null }) {
  if (!sizes) return null;
  const entries = Object.entries(sizes).filter(([, v]) => v > 0);
  if (entries.length === 0) return null;
  const total = entries.reduce((a, [, v]) => a + v, 0);

  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(entries.length, 8)},1fr)`, gap: 4 }}>
        {entries.map(([size, qty]) => (
          <div key={size} style={{ textAlign: "center", background: "var(--surface)", borderRadius: 8, padding: "4px 2px", border: "1px solid var(--border)" }}>
            <div style={{ fontSize: 9, color: GOLD, fontWeight: 700, textTransform: "uppercase" }}>{size}</div>
            <div style={{ fontSize: 14, fontWeight: 700, fontFamily: "var(--font-display)" }}>{qty}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 4, color: GOLD, fontSize: 11, fontWeight: 700 }}>Subtotal: {total}</div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | number | null | undefined }) {
  if (value === null || value === undefined || value === "") return null;
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
      <span style={{ color: "var(--text3)" }}>{label}</span>
      <span style={{ fontWeight: 600, textAlign: "right", maxWidth: "60%" }}>{value}</span>
    </div>
  );
}

function RelatedOrderCard({ po, isActive, onClick }: { po: Dress; isActive: boolean; onClick: () => void }) {
  const dd = po.dueDate ? daysUntil(po.dueDate) : null;
  const fmtCost = (v: number | null) => v !== null ? `$${v.toFixed(2)}` : null;

  return (
    <Card
      onClick={onClick}
      style={{
        padding: "12px 14px",
        border: isActive ? `2px solid ${GOLD}` : "1px solid var(--border)",
        background: isActive ? "rgba(158,124,60,0.04)" : "var(--surface)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
        <div style={{ fontSize: 10, color: GOLD, letterSpacing: 1, fontWeight: 700 }}>{po.inventoryItemSku || po.poNumber}</div>
        <Badge status={po.status} small />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 6 }}>
        <div>
          <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Order Date</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{po.orderDate ? fmtDate(po.orderDate) : "\u2014"}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Ship By</div>
          <div style={{ fontSize: 12, fontWeight: 600 }}>{po.dueDate ? fmtDate(po.dueDate) : "\u2014"}</div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, fontSize: 11 }}>
        <span style={{ color: "var(--text3)" }}>{sum(po.quantities)}u</span>
        {dd !== null && <span style={{ color: dd < 0 ? RED : dd < 14 ? AMBER : GREEN, fontWeight: 700 }}>{dd < 0 ? `${Math.abs(dd)}d late` : `${dd}d`}</span>}
        {po.orderStatus && <span style={{ color: "var(--text3)" }}>{po.orderStatus}</span>}
        {po.singleProductCost !== null && <span style={{ color: "var(--text3)" }}>{fmtCost(po.singleProductCost)}</span>}
      </div>

      {po.collectionName && (
        <div style={{ fontSize: 10, color: "var(--text3)", marginTop: 4 }}>{po.collectionName} {"\u00b7"} {po.manufacturerName}</div>
      )}
    </Card>
  );
}

export const DressDetail = ({ dress, onClose, onUpdate, allDresses = [], collections = [], manufacturers = [], user }: DressDetailProps) => {
  const [sizeTab, setSizeTab] = useState<"letter" | "numeric" | "girls">("letter");
  const [activeTab, setActiveTab] = useState<"details" | "orders">("details");
  const mfr = manufacturers.find(m => m.id === dress.manufacturerId);
  const col = collections.find(c => c.id === dress.collectionId);
  const d = dress.dueDate ? daysUntil(dress.dueDate) : null;
  const done = dress.milestones.filter(m => m.done).length;

  const relatedOrders = dress.inventoryItemId
    ? allDresses.filter(po => po.inventoryItemId === dress.inventoryItemId)
    : [dress];
  const hasRelated = relatedOrders.length > 1;

  const setStatus = (s: DressStatus) => {
    onUpdate({ ...dress, status: s });
  };

  const toggleMs = (i: number) => {
    const ms = [...dress.milestones];
    ms[i] = { ...ms[i], done: !ms[i].done };
    onUpdate({ ...dress, milestones: ms });
  };

  const fmtCost = (v: number | null) => v !== null ? `$${v.toFixed(2)}` : null;

  return (
    <Overlay onClose={onClose} wide>
      <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
        {dress.imageUrl && <img src={dress.imageUrl} alt="" style={{ width: 72, height: 90, objectFit: "cover", borderRadius: 10, flexShrink: 0 }} />}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, color: GOLD, letterSpacing: 2, fontWeight: 700 }}>{dress.inventoryItemSku || dress.poNumber}</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 600, color: "var(--text)", lineHeight: 1.2, marginTop: 2 }}>{dress.name}</div>
          <div style={{ fontSize: 12, color: "var(--text3)", marginTop: 4 }}>
            {col?.name || dress.collectionName || "No Collection"} {"\u00b7"} {mfr?.name || dress.manufacturerName} ({dress.manufacturerCountry})
          </div>
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
            <Badge status={dress.status} />
            {dress.orderStatus && <span style={{ fontSize: 10, color: "var(--text3)", background: "var(--surface2)", borderRadius: 20, padding: "2px 8px" }}>{dress.orderStatus}</span>}
            {hasRelated && <span style={{ fontSize: 10, color: GOLD, background: "var(--gold-bg)", borderRadius: 20, padding: "2px 8px", fontWeight: 600 }}>{relatedOrders.length} orders</span>}
          </div>
        </div>
        <button onClick={onClose} style={{ color: "var(--text3)", fontSize: 22, alignSelf: "flex-start", padding: 4 }}>{"\u00d7"}</button>
      </div>

      {/* Tab bar — only show if there are related orders */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
        <button
          onClick={() => setActiveTab("details")}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: activeTab === "details" ? 700 : 400,
            background: activeTab === "details" ? "var(--surface)" : "transparent",
            color: activeTab === "details" ? "var(--text)" : "var(--text3)",
            border: "none", cursor: "pointer",
            boxShadow: activeTab === "details" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          PO Details
        </button>
        <button
          onClick={() => setActiveTab("orders")}
          style={{
            flex: 1, padding: "8px 12px", borderRadius: 8, fontSize: 12, fontWeight: activeTab === "orders" ? 700 : 400,
            background: activeTab === "orders" ? "var(--surface)" : "transparent",
            color: activeTab === "orders" ? "var(--text)" : "var(--text3)",
            border: "none", cursor: "pointer",
            boxShadow: activeTab === "orders" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
          }}
        >
          All Orders ({relatedOrders.length})
        </button>
      </div>

      {activeTab === "details" && (
        <div className="dress-detail-body">
          <div className="dress-detail-left">
            {dress.alerts.map((a, i) => (
              <div key={i} style={{ background: "var(--red-bg)", border: `1px solid ${RED}22`, borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: RED, display: "flex", gap: 8 }}>
                <span>{"\u26a0"}</span><span>{a}</span>
              </div>
            ))}

            {dress.lateProduct && (
              <div style={{ background: "var(--amber-bg)", border: `1px solid ${AMBER}22`, borderRadius: 10, padding: "10px 14px", marginBottom: 10, fontSize: 13, color: AMBER, display: "flex", gap: 8 }}>
                <span>{"\u231b"}</span><span>Late Product: {dress.lateProduct}</span>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Order Date</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{dress.orderDate ? fmtDate(dress.orderDate) : "\u2014"}</div>
              </div>
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 16px" }}>
                <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Ship By Date</div>
                <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{dress.dueDate ? fmtDate(dress.dueDate) : "\u2014"}</div>
              </div>
              {d !== null && (
                <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Countdown</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: d < 0 ? RED : d < 14 ? AMBER : GREEN, marginTop: 2 }}>
                    {d < 0 ? `${Math.abs(d)}d LATE` : `${d}d`}
                  </div>
                </div>
              )}
              {col?.launchDate && (
                <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "12px 16px" }}>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Launch Date</div>
                  <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{fmtDate(col.launchDate)}</div>
                </div>
              )}
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
              <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                <Chip active={sizeTab === "letter"} onClick={() => setSizeTab("letter")}>Women&apos;s Letter</Chip>
                <Chip active={sizeTab === "numeric"} onClick={() => setSizeTab("numeric")}>Women&apos;s Numeric</Chip>
                <Chip active={sizeTab === "girls"} onClick={() => setSizeTab("girls")}>Girls</Chip>
              </div>
              {sizeTab === "letter" && <SizeGrid sizes={dress.womensSizes} />}
              {sizeTab === "numeric" && <SizeGrid sizes={dress.womensNumericSizes} />}
              {sizeTab === "girls" && <SizeGrid sizes={dress.girlsSizes} />}
              {sizeTab === "letter" && !dress.womensSizes && <div style={{ color: "var(--text3)", fontSize: 12 }}>No women&apos;s letter sizes</div>}
              {sizeTab === "numeric" && !dress.womensNumericSizes && <div style={{ color: "var(--text3)", fontSize: 12 }}>No women&apos;s numeric sizes</div>}
              {sizeTab === "girls" && !dress.girlsSizes && <div style={{ color: "var(--text3)", fontSize: 12 }}>No girls sizes</div>}
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
            <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <Lbl>Pricing</Lbl>
              <InfoRow label="Single Product Cost" value={fmtCost(dress.singleProductCost)} />
              <InfoRow label="Straight Size Cost" value={fmtCost(dress.straightSizeCost)} />
              <InfoRow label="Plus Size Cost" value={fmtCost(dress.plusSizeCost)} />
              <InfoRow label="Sale Price" value={fmtCost(dress.salePrice)} />
              <InfoRow label="Separate Pricing" value={dress.separatePricing} />
            </div>

            <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
              <Lbl>Details</Lbl>
              <InfoRow label="SKU" value={dress.inventoryItemSku} />
              <InfoRow label="Manufacturer" value={mfr ? `${mfr.name} (${mfr.country})` : dress.manufacturerName} />
              {mfr?.termsDays && <InfoRow label="Payment Terms" value={`${mfr.termsDays} days`} />}
              {mfr?.proformaPercent && <InfoRow label="Proforma" value={`${mfr.proformaPercent}%`} />}
              {mfr?.downpaymentPercent && <InfoRow label="Downpayment" value={`${mfr.downpaymentPercent}%`} />}
              <InfoRow label="Ship Method" value={dress.shipMethod} />
              <InfoRow label="Send PO" value={dress.sendPo} />
              <InfoRow label="Shoot Sample" value={dress.shootSampleStatus} />
              {dress.sendShootSamplesAgreed && <InfoRow label="Samples Due" value={fmtDate(dress.sendShootSamplesAgreed)} />}
            </div>

            {dress.tags && dress.tags.length > 0 && (
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                <Lbl>Tags</Lbl>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 6 }}>
                  {dress.tags.map(t => (
                    <span key={t} style={{ fontSize: 11, background: "var(--gold-bg)", color: GOLD, borderRadius: 20, padding: "3px 10px", fontWeight: 600 }}>{t}</span>
                  ))}
                </div>
              </div>
            )}

            {(dress.poNotes || dress.productNotes) && (
              <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                <Lbl>Notes</Lbl>
                {dress.poNotes && <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text2)", marginTop: 6 }}>{dress.poNotes}</div>}
                {dress.productNotes && (
                  <>
                    {dress.poNotes && <div style={{ borderTop: "1px solid var(--border)", margin: "10px 0" }} />}
                    <div style={{ fontSize: 13, lineHeight: 1.5, color: "var(--text2)" }}>{dress.productNotes}</div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "orders" && (
        <div>
          <div style={{ fontSize: 13, color: "var(--text3)", marginBottom: 12 }}>
            {relatedOrders.length === 1
              ? "This is the only order for this style."
              : `${relatedOrders.length} purchase orders for "${dress.name}"`}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {relatedOrders.map(po => (
              <RelatedOrderCard
                key={po.id}
                po={po}
                isActive={po.id === dress.id}
                onClick={() => { if (po.id !== dress.id) onUpdate(po); }}
              />
            ))}
          </div>

          {relatedOrders.length > 1 && (
            <div style={{ background: "var(--surface2)", borderRadius: 12, padding: "14px 16px", marginTop: 16 }}>
              <Lbl>Combined Totals</Lbl>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginTop: 8 }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Total Units</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", marginTop: 2 }}>
                    {relatedOrders.reduce((a, po) => a + sum(po.quantities), 0)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Orders</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", marginTop: 2 }}>{relatedOrders.length}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--text3)", textTransform: "uppercase", letterSpacing: 1 }}>Collections</div>
                  <div style={{ fontSize: 20, fontWeight: 800, fontFamily: "var(--font-display)", marginTop: 2 }}>
                    {new Set(relatedOrders.map(po => po.collectionId).filter(Boolean)).size}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </Overlay>
  );
};
