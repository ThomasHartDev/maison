"use client";

import { useRef, useEffect, useState, type KeyboardEvent } from "react";
import type { ChatMessage, ToolProposal, ChatRole } from "@/types/chat";
import { MutationCard } from "./mutation-card";
import { GOLD, MUTED } from "@/constants";

interface ChatPanelProps {
  messages: ChatMessage[];
  proposals: ToolProposal[];
  senderRole: "company" | "manufacturer";
  loading: boolean;
  onSend: (text: string) => void;
  onAccept: (proposalId: string) => void;
  onReject: (proposalId: string) => void;
}

const BUBBLE_COLORS: Record<ChatRole, { bg: string; align: string; color: string }> = {
  company: { bg: "rgba(158,124,60,0.1)", align: "flex-end", color: "var(--text)" },
  manufacturer: { bg: "var(--surface)", align: "flex-start", color: "var(--text)" },
  system: { bg: "rgba(40,114,168,0.08)", align: "center", color: "var(--text2)" },
};

export const ChatPanel = ({ messages, proposals, senderRole, loading, onSend, onAccept, onReject }: ChatPanelProps) => {
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, proposals]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
      <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px", display: "flex", flexDirection: "column", gap: 6 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: MUTED, fontSize: 13, marginTop: 40 }}>
            Start a conversation — type as {senderRole === "company" ? "the brand" : "the manufacturer"}
          </div>
        )}

        {messages.map(m => {
          const style = BUBBLE_COLORS[m.role];
          const isSystem = m.role === "system";
          const linkedProposals = isSystem
            ? proposals.filter(p => p.parentMessageId === m.id)
            : [];

          // Hidden anchor messages — only render their proposals
          if (isSystem && !m.content) {
            if (linkedProposals.length === 0) return null;
            return (
              <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                {linkedProposals.map(p => (
                  <div key={p.id} style={{ maxWidth: "90%", width: "100%" }}>
                    <MutationCard
                      proposal={p}
                      onAccept={() => onAccept(p.id)}
                      onReject={() => onReject(p.id)}
                    />
                  </div>
                ))}
              </div>
            );
          }

          return (
            <div key={m.id} style={{ display: "flex", flexDirection: "column", alignItems: style.align }}>
              <div style={{ fontSize: 10, color: MUTED, marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 }}>
                {m.role === "company" ? "Company" : m.role === "manufacturer" ? "Manufacturer" : "System"}
              </div>
              <div style={{
                background: style.bg,
                padding: "10px 14px",
                borderRadius: 14,
                maxWidth: isSystem ? "90%" : "75%",
                fontSize: 13,
                lineHeight: 1.5,
                color: style.color,
                border: isSystem ? "1px solid rgba(40,114,168,0.15)" : "none",
              }}>
                {m.content}
              </div>
              {linkedProposals.map(p => (
                <div key={p.id} style={{ maxWidth: "90%", width: "100%" }}>
                  <MutationCard
                    proposal={p}
                    onAccept={() => onAccept(p.id)}
                    onReject={() => onReject(p.id)}
                  />
                </div>
              ))}
            </div>
          );
        })}

        <div ref={bottomRef} />
      </div>

      <div style={{
        padding: "12px 16px",
        borderTop: "1px solid var(--border)",
        display: "flex",
        gap: 8,
      }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={`Type as ${senderRole === "company" ? "Company" : "Manufacturer"}...`}
          disabled={loading}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: 10,
            border: "1px solid var(--border)",
            background: "var(--surface)",
            fontSize: 13,
            color: "var(--text)",
            outline: "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={loading || !input.trim()}
          style={{
            padding: "10px 20px",
            borderRadius: 10,
            background: GOLD,
            color: "#fff",
            fontSize: 13,
            fontWeight: 600,
            opacity: loading || !input.trim() ? 0.5 : 1,
            cursor: loading || !input.trim() ? "default" : "pointer",
          }}
        >
          Send
        </button>
      </div>
    </div>
  );
};
