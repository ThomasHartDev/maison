import type { ToolProposal } from "@/types/chat";
import { GOLD, GREEN, MUTED } from "@/constants";
import { BtnGold, BtnGhost } from "@/components/ui/buttons";

interface MutationCardProps {
  proposal: ToolProposal;
  onAccept: () => void;
  onReject: () => void;
}

const TOOL_LABELS: Record<string, string> = {
  update_status: "Status Change",
  update_quantities: "Quantity Update",
  update_due_date: "Date Change",
  add_alert: "New Alert",
  update_milestone: "Milestone Update",
};

export const MutationCard = ({ proposal, onAccept, onReject }: MutationCardProps) => {
  const isPending = proposal.status === "pending";
  const isAccepted = proposal.status === "accepted";

  const borderColor = isPending ? GOLD : isAccepted ? GREEN : MUTED;
  const bgColor = isPending ? "rgba(158,124,60,0.06)" : isAccepted ? "rgba(39,133,90,0.06)" : "rgba(0,0,0,0.03)";

  return (
    <div style={{
      border: `1px solid ${borderColor}`,
      borderRadius: 12,
      padding: "12px 14px",
      background: bgColor,
      margin: "8px 0",
    }}>
      <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: 1, color: borderColor, fontWeight: 700, marginBottom: 4 }}>
        {TOOL_LABELS[proposal.toolName] || proposal.toolName}
      </div>
      <div style={{ fontSize: 13, color: "var(--text)", lineHeight: 1.4, marginBottom: isPending ? 10 : 0 }}>
        {proposal.description}
      </div>
      {isPending && (
        <div style={{ display: "flex", gap: 8 }}>
          <BtnGold onClick={onAccept} style={{ padding: "6px 16px", fontSize: 12 }}>Accept</BtnGold>
          <BtnGhost onClick={onReject} style={{ padding: "6px 16px", fontSize: 12 }}>Reject</BtnGhost>
        </div>
      )}
      {isAccepted && (
        <div style={{ fontSize: 11, color: GREEN, fontWeight: 600, marginTop: 6 }}>Applied</div>
      )}
      {proposal.status === "rejected" && (
        <div style={{ fontSize: 11, color: MUTED, fontWeight: 600, marginTop: 6 }}>Dismissed</div>
      )}
    </div>
  );
};
