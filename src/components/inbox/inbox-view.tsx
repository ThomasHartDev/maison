"use client";

import { useState, type Dispatch, type SetStateAction, type ChangeEvent } from "react";
import type { Dress, Message, User, MessageChannel, TimelineCategory, ComposeForm } from "@/types";
import { GOLD, AMBER, BLUE } from "@/constants";
import { uid, nowISO, nowTime } from "@/lib/helpers";
import { Card } from "@/components/ui/card";
import { Chip } from "@/components/ui/chip";
import { ToggleBtn } from "@/components/ui/toggle-btn";
import { Lbl } from "@/components/ui/label";
import { Inp, Sel, Txa } from "@/components/ui/form-elements";
import { BtnGold } from "@/components/ui/buttons";

interface InboxViewProps {
  messages: Message[];
  setMessages: Dispatch<SetStateAction<Message[]>>;
  dresses: Dress[];
  setDresses: Dispatch<SetStateAction<Dress[]>>;
  user: User;
}

export const InboxView = ({ messages, setMessages, dresses, setDresses, user }: InboxViewProps) => {
  const [sel, setSel] = useState<Message | null>(null);
  const [compose, setCompose] = useState(false);
  const [newMsg, setNewMsg] = useState<ComposeForm>({ to: "", channel: "whatsapp", body: "", linkedDressIds: [] });
  const [filter, setFilter] = useState<"all" | TimelineCategory>("all");
  const unread = messages.filter(m => !m.read).length;
  const reviewQueue = messages.filter(m => m.needsReview && !m.resolved);

  const markRead = (id: string) => setMessages(p => p.map(m => m.id === id ? { ...m, read: true } : m));
  const toggleD = (id: string) => setNewMsg(f => ({ ...f, linkedDressIds: f.linkedDressIds.includes(id) ? f.linkedDressIds.filter(x => x !== id) : [...f.linkedDressIds, id] }));

  const send = () => {
    const msg: Message = {
      id: uid(), from: `You (${user.name})`, channel: newMsg.channel,
      content: newMsg.body, date: nowISO(), time: nowTime(),
      read: true, linkedDressIds: newMsg.linkedDressIds,
      needsReview: false, resolved: true, category: "design",
    };
    newMsg.linkedDressIds.forEach(dId => {
      setDresses(prev => prev.map(d => {
        if (d.id !== dId) return d;
        return d;
      }));
    });
    setMessages(p => [msg, ...p]);
    setCompose(false);
    setNewMsg({ to: "", channel: "whatsapp", body: "", linkedDressIds: [] });
  };

  const linkAndApprove = (msg: Message, dressId: string) => {
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, needsReview: false, resolved: true, linkedDressIds: [...(m.linkedDressIds || []), dressId] } : m));
  };

  const filteredMsgs = messages.filter(m => {
    if (m.needsReview && !m.resolved) return false;
    if (filter === "all") return true;
    return (m.category || "design") === filter;
  });

  return (
    <div className="fade-up">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
        <div style={{ fontFamily: "var(--font-display)", fontSize: 26, fontWeight: 600 }}>Inbox {unread > 0 && <span style={{ fontSize: 14, color: AMBER, fontFamily: "var(--font-body)" }}>({unread})</span>}</div>
        <BtnGold small onClick={() => setCompose(true)}>+ Compose</BtnGold>
      </div>

      <div style={{ display: "flex", gap: 4, marginBottom: 16, background: "var(--surface2)", borderRadius: 10, padding: 3 }}>
        <ToggleBtn active={filter === "all"} onClick={() => setFilter("all")}>All</ToggleBtn>
        <ToggleBtn active={filter === "design"} onClick={() => setFilter("design")}>Design</ToggleBtn>
        <ToggleBtn active={filter === "shipping"} onClick={() => setFilter("shipping")}>Shipping</ToggleBtn>
      </div>

      {reviewQueue.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <Lbl>{"\u26a0"} Needs Review {"\u2014"} Link to a Dress</Lbl>
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 8 }}>
            {reviewQueue.map(msg => (
              <Card key={msg.id} alert style={{ padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <div><div style={{ fontWeight: 700, fontSize: 13 }}>{msg.from}</div><div style={{ fontSize: 10, color: "var(--text3)" }}>{msg.date} {"\u00b7"} {msg.channel}</div></div>
                  <span style={{ fontSize: 9, background: "var(--amber-bg)", color: AMBER, borderRadius: 20, padding: "2px 10px", fontWeight: 700 }}>{"\u26a0"} REVIEW</span>
                </div>
                <div style={{ fontSize: 13, color: "var(--text2)", marginBottom: 10, lineHeight: 1.4 }}>{msg.content}</div>
                <Lbl>Link to dress:</Lbl>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                  {dresses.slice(0, 12).map(d => (
                    <button key={d.id} onClick={() => linkAndApprove(msg, d.id)} style={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8, padding: "4px 10px", fontSize: 10, color: "var(--text)", display: "flex", alignItems: "center", gap: 6 }}>
                      {d.imageUrl && <img src={d.imageUrl} alt="" style={{ width: 18, height: 22, objectFit: "cover", borderRadius: 3 }} />}
                      <span>{d.inventoryItemSku || d.poNumber} {d.name}</span>
                    </button>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {compose && (
        <Card style={{ padding: 18, marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ fontWeight: 700, fontSize: 15 }}>New Message</div>
            <button onClick={() => setCompose(false)} style={{ color: "var(--text3)", fontSize: 18 }}>{"\u00d7"}</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <Sel value={newMsg.channel} onChange={(e: ChangeEvent<HTMLSelectElement>) => setNewMsg(f => ({ ...f, channel: e.target.value as MessageChannel }))}><option value="whatsapp">{"\ud83d\udcac"} WhatsApp</option><option value="email">{"\ud83d\udce7"} Email</option></Sel>
            <Inp value={newMsg.to} onChange={(e: ChangeEvent<HTMLInputElement>) => setNewMsg(f => ({ ...f, to: e.target.value }))} placeholder="Recipient" />
            <div>
              <Lbl>Link Dresses</Lbl>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>{dresses.slice(0, 8).map(d => <Chip key={d.id} active={newMsg.linkedDressIds.includes(d.id)} onClick={() => toggleD(d.id)}>{d.poNumber}</Chip>)}</div>
            </div>
            <Txa value={newMsg.body} onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setNewMsg(f => ({ ...f, body: e.target.value }))} rows={4} placeholder="Type message..." />
            <BtnGold small onClick={send} disabled={!newMsg.body} style={{ width: "100%" }}>Send</BtnGold>
          </div>
        </Card>
      )}

      {sel ? (
        <div>
          <button onClick={() => setSel(null)} style={{ color: GOLD, fontSize: 13, marginBottom: 12, padding: 0 }}>{"\u2190"} Back</button>
          <Card style={{ padding: 18 }}>
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{sel.from}</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
              <span style={{ fontSize: 10, background: sel.channel === "whatsapp" ? "#25d36614" : BLUE + "14", color: sel.channel === "whatsapp" ? "#25d366" : BLUE, borderRadius: 20, padding: "2px 10px" }}>{sel.channel === "whatsapp" ? "\ud83d\udcac WhatsApp" : "\ud83d\udce7 Email"}</span>
              <span style={{ fontSize: 10, background: (sel.category || "design") === "shipping" ? AMBER + "14" : GOLD + "14", color: (sel.category || "design") === "shipping" ? AMBER : GOLD, borderRadius: 20, padding: "2px 10px" }}>{(sel.category || "design") === "shipping" ? "\ud83d\udce6 Shipping" : "\ud83c\udfa8 Design"}</span>
              {sel.linkedDressIds?.map(id => { const d = dresses.find(x => x.id === id); return d ? <span key={id} style={{ fontSize: 10, background: GOLD + "14", color: GOLD, borderRadius: 20, padding: "2px 10px" }}>{d.poNumber}</span> : null; })}
            </div>
            <div style={{ fontSize: 11, color: "var(--text3)", marginBottom: 12 }}>{sel.date} {"\u00b7"} {sel.time}</div>
            <div style={{ background: "var(--surface2)", borderRadius: 10, padding: 14, fontSize: 14, lineHeight: 1.6 }}>{sel.content}</div>
          </Card>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {filteredMsgs.length === 0 && <div style={{ textAlign: "center", color: "var(--text3)", padding: 40, fontSize: 13 }}>No messages yet</div>}
          {filteredMsgs.map(m => (
            <Card key={m.id} onClick={() => { setSel(m); markRead(m.id); }} style={{ padding: "10px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ fontWeight: m.read ? 400 : 700, fontSize: 13 }}>{m.from}</div>
                <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  <span style={{ fontSize: 9, background: (m.category || "design") === "shipping" ? AMBER + "14" : GOLD + "14", color: (m.category || "design") === "shipping" ? AMBER : GOLD, borderRadius: 20, padding: "1px 7px" }}>{(m.category || "design") === "shipping" ? "\ud83d\udce6" : "\ud83c\udfa8"}</span>
                  <span style={{ fontSize: 10, color: "var(--text3)" }}>{m.time}</span>
                </div>
              </div>
              <div style={{ fontSize: 12, color: "var(--text3)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginTop: 2 }}>{m.content}</div>
              <div style={{ display: "flex", gap: 5, marginTop: 5, flexWrap: "wrap" }}>
                <span style={{ fontSize: 9, background: m.channel === "whatsapp" ? "#25d36614" : BLUE + "14", color: m.channel === "whatsapp" ? "#25d366" : BLUE, borderRadius: 20, padding: "1px 7px" }}>{m.channel}</span>
                {m.linkedDressIds?.map(id => { const d = dresses.find(x => x.id === id); return d ? <span key={id} style={{ fontSize: 9, background: GOLD + "14", color: GOLD, borderRadius: 20, padding: "1px 7px" }}>{d.poNumber}</span> : null; })}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
