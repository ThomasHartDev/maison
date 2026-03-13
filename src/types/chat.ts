export type ChatRole = "company" | "manufacturer" | "system";

export type ProposalStatus = "pending" | "accepted" | "rejected";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  timestamp: string;
}

export interface ToolProposal {
  id: string;
  parentMessageId: string;
  toolName: string;
  toolInput: Record<string, unknown>;
  description: string;
  status: ProposalStatus;
}
