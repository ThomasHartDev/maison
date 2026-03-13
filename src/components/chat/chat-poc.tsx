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

      const hasProposals = data.proposals && data.proposals.length > 0;

      // Deduplicate proposals — same tool + same PO = keep only the first
      const rawProposals: { toolName: string; toolInput: Record<string, unknown>; description: string }[] = data.proposals || [];
      const seen = new Set<string>();
      const dedupedProposals = rawProposals.filter(p => {
        const key = `${p.toolName}:${p.toolInput.po_number}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

      // Create a hidden anchor message for proposals — no visible text
      const systemMsgId = uid();

      if (dedupedProposals.length > 0) {
        setMessages(prev => [...prev, {
          id: systemMsgId,
          role: "system",
          content: "",
          timestamp: new Date().toISOString(),
        }]);
      }

      if (hasProposals && dedupedProposals.length > 0) {
        const newProposals: ToolProposal[] = dedupedProposals.map(p => ({
          id: uid(),
          parentMessageId: systemMsgId,
          toolName: p.toolName,
          toolInput: p.toolInput,
          description: p.description,
          status: "pending" as const,
        }));

        setProposals(prev => [...prev, ...newProposals]);
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

      setDresses(prevDresses => {
        const newDresses = applyMutation(p.toolName, p.toolInput, prevDresses);
        const po = String(p.toolInput.po_number);
        setChangedPOs(prev => new Set(prev).add(po));
        clearHighlight(po);
        return newDresses;
      });

      return { ...p, status: "accepted" as const };
    }));
  }, [clearHighlight]);

  const handleReject = useCallback((proposalId: string) => {
    setProposals(prev => prev.map(p =>
      p.id === proposalId ? { ...p, status: "rejected" as const } : p,
    ));
  }, []);

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
