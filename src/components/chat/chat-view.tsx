"use client";

import { useState, useCallback, type Dispatch, type SetStateAction } from "react";
import type { Dress, Collection, Manufacturer, User } from "@/types";
import type { ChatMessage, ToolProposal } from "@/types/chat";
import { applyMutation } from "@/lib/chat-tools";
import { persistMutation } from "@/lib/persist-mutation";
import { uid } from "@/lib/helpers";
import { GOLD, MUTED } from "@/constants";
import { ChatPanel } from "./chat-panel";
import { POPanelWithDetail } from "./po-panel";
import { DressDetail } from "@/components/dresses/dress-detail";

interface ChatViewProps {
  dresses: Dress[];
  setDresses: Dispatch<SetStateAction<Dress[]>>;
  collections: Collection[];
  manufacturers: Manufacturer[];
  user: User;
}

export const ChatView = ({ dresses, setDresses, collections, manufacturers, user }: ChatViewProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [proposals, setProposals] = useState<ToolProposal[]>([]);
  const [senderRole, setSenderRole] = useState<"company" | "manufacturer">("manufacturer");
  const [loading, setLoading] = useState(false);
  const [changedPOs, setChangedPOs] = useState<Set<string>>(new Set());
  const [selectedDress, setSelectedDress] = useState<Dress | null>(null);

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
          dresses: dresses.map(d => ({
            id: d.id, poNumber: d.poNumber, name: d.name, status: d.status,
            dueDate: d.dueDate, quantities: d.quantities, milestones: d.milestones, alerts: d.alerts,
          })),
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

  const handleAccept = useCallback(async (proposalId: string) => {
    const proposal = proposals.find(p => p.id === proposalId);
    if (!proposal) return;

    // Optimistic local update
    setProposals(prev => prev.map(p =>
      p.id === proposalId ? { ...p, status: "accepted" as const } : p,
    ));
    setDresses(prevDresses => applyMutation(proposal.toolName, proposal.toolInput, prevDresses));

    const po = String(proposal.toolInput.po_number);
    setChangedPOs(prev => new Set(prev).add(po));
    clearHighlight(po);

    // Persist to database
    try {
      await persistMutation(proposal.toolName, proposal.toolInput, dresses);
    } catch (err) {
      console.error("Failed to persist mutation:", err);
    }
  }, [proposals, setDresses, clearHighlight, dresses]);

  const handleReject = useCallback((proposalId: string) => {
    setProposals(prev => prev.map(p =>
      p.id === proposalId ? { ...p, status: "rejected" as const } : p,
    ));
  }, []);

  const handleDressUpdate = useCallback((updated: Dress) => {
    setDresses(prev => prev.map(d => d.id === updated.id ? updated : d));
    setSelectedDress(updated);
  }, [setDresses]);

  return (
    <>
      <div style={{ flex: 1, display: "flex", overflow: "hidden", paddingBottom: 60 }}>
        <POPanelWithDetail
          dresses={dresses}
          changedPOs={changedPOs}
          collections={collections}
          manufacturers={manufacturers}
          onSelectDress={setSelectedDress}
        />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
          {/* Role toggle bar */}
          <div style={{
            display: "flex",
            justifyContent: "flex-end",
            padding: "8px 16px",
            borderBottom: "1px solid var(--border)",
            flexShrink: 0,
          }}>
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

      {selectedDress && (
        <DressDetail
          dress={selectedDress}
          onClose={() => setSelectedDress(null)}
          onUpdate={handleDressUpdate}
          allDresses={dresses}
          user={user}
        />
      )}
    </>
  );
};
