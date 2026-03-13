import type { ReactNode } from "react";
import { GOLD } from "@/constants";

interface ChipProps {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
  color?: string;
}

export const Chip = ({ children, active, onClick, color }: ChipProps) => (
  <button
    onClick={onClick}
    style={{
      background: active ? (color || GOLD) + "14" : "var(--surface2)",
      border: `1px solid ${active ? (color || GOLD) + "33" : "var(--border)"}`,
      color: active ? (color || GOLD) : "var(--text3)",
      borderRadius: 20, padding: "5px 14px",
      fontSize: 12, fontWeight: 600,
      whiteSpace: "nowrap", transition: "all .15s",
    }}
  >
    {children}
  </button>
);
