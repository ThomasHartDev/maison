"use client";

import { useState, useCallback } from "react";
import type { Dress } from "@/types";
import type { ChatMessage, ToolProposal } from "@/types/chat";
import { SEED_DRESSES } from "@/data/seed";
import { applyMutation } from "@/lib/chat-tools";
import { uid } from "@/lib/helpers";
import { GOLD, MUTED } from "@/constants";
import { CSS } from "@/styles/maison.css";
import { ChatPanel } from "./chat-panel";
import { POPanel } from "./po-panel";

export default function ChatPOC() {
  const [dresses, setDresses] = useState<Dress[]>(SEED_DRESSES);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposals, setProposals] = useState<ToolProposal[]>([]);
  const [senderRole, setSenderRole] = useState<"company" | "manufacturer">("manufacturer");
  const [loading, setLoading] = useState(false);
  const [changedPOs, setChangedPOs] = useState<Set<string>>(new Set());

  const clearHighlight = useCallback((po: string) => {
    setTimeout(() => {
      setChangedPOs(prev => {
        const next = new Set(prev);
        next.delete(po);
        return next;
      });
    }, 2000);
  }, []);

  const sendMessage = useCallback(async (text: string) => {
    const userMsg: ChatMessage = {
      id: uid(),
      role: senderRole,
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          dresses,
        }),
      });

      const data = await res.json();

      if (data.error) {
        setMessages(prev => [...prev, {
          id: uid(),
          role: "system",
          content: `Error: ${data.error}`,
          timestamp: new Date().toISOString(),
        }]);
        return;
      }

      if (data.reply) {
        setMessages(prev => [...prev, {
          id: uid(),
          role: "system",
          content: data.reply,
          timestamp: new Date().toISOString(),
        }]);
      }

      if (data.proposals && data.proposals.length > 0) {
        const newProposals: ToolProposal[] = data.proposals.map((p: { toolName: string; toolInput: Record<string, unknown>; description: string }) => ({
          id: uid(),
          toolName: p.toolName,
          toolInput: p.toolInput,
          description: p.description,
          status: "pending" as const,
        }));

        setProposals(prev => [...prev, ...newProposals]);

        if (!data.reply) {
          const proposalDesc = newProposals.map(p => p.description).join("; ");
          setMessages(prev => [...prev, {
            id: `msg-${newProposals[0].id}`,
            role: "system",
            content: `Proposed: ${proposalDesc}`,
            timestamp: new Date().toISOString(),
          }]);
        }
      }
    } catch {
      setMessages(prev => [...prev, {
        id: uid(),
        role: "system",
        content: "Failed to reach the API. Check your connection and API key.",
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [senderRole, messages, dresses]);

  const handleAccept = useCallback((proposalId: string) => {
    setProposals(prev => prev.map(p => {
      if (p.id !== proposalId) return p;
      const updated = { ...p, status: "accepted" as const };

      setDresses(prevDresses => {
        const newDresses = applyMutation(p.toolName, p.toolInput, prevDresses);
        const po = String(p.toolInput.po_number);
        setChangedPOs(prev => new Set(prev).add(po));
        clearHighlight(po);
        return newDresses;
      });

      setMessages(prev => [...prev, {
        id: uid(),
        role: "system",
        content: `Confirmed: ${p.description}`,
        timestamp: new Date().toISOString(),
      }]);

      return updated;
    }));
  }, [clearHighlight]);

  const handleReject = useCallback((proposalId: string) => {
    setProposals(prev => prev.map(p =>
      p.id === proposalId ? { ...p, status: "rejected" as const } : p,
    ));
    const proposal = proposals.find(p => p.id === proposalId);
    if (proposal) {
      setMessages(prev => [...prev, {
        id: uid(),
        role: "system",
        content: `Dismissed: ${proposal.description}`,
        timestamp: new Date().toISOString(),
      }]);
    }
  }, [proposals]);

  return (
    <>
      <style>{CSS}</style>
      <div style={{ height: "100dvh", display: "flex", flexDirection: "column", background: "var(--bg)" }}>
        {/* Header */}
        <div style={{
          padding: "12px 20px",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(250,249,247,0.95)",
          backdropFilter: "blur(20px)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <a href="/" style={{ color: "var(--text3)", fontSize: 12, textDecoration: "none" }}>
              &larr; Dashboard
            </a>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: GOLD }}>
              Chat POC
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <button
              onClick={() => setSenderRole("company")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: senderRole === "company" ? 700 : 400,
                background: senderRole === "company" ? GOLD : "transparent",
                color: senderRole === "company" ? "#fff" : MUTED,
                border: `1px solid ${senderRole === "company" ? GOLD : "var(--border)"}`,
              }}
            >
              Company
            </button>
            <button
              onClick={() => setSenderRole("manufacturer")}
              style={{
                padding: "6px 14px",
                borderRadius: 8,
                fontSize: 12,
                fontWeight: senderRole === "manufacturer" ? 700 : 400,
                background: senderRole === "manufacturer" ? GOLD : "transparent",
                color: senderRole === "manufacturer" ? "#fff" : MUTED,
                border: `1px solid ${senderRole === "manufacturer" ? GOLD : "var(--border)"}`,
              }}
            >
              Manufacturer
            </button>
          </div>
        </div>

        {/* Main content */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <POPanel dresses={dresses} changedPOs={changedPOs} />
          <ChatPanel
            messages={messages}
            proposals={proposals}
            senderRole={senderRole}
            loading={loading}
            onSend={sendMessage}
            onAccept={handleAccept}
            onReject={handleReject}
          />
        </div>
      </div>
    </>
  );
}
