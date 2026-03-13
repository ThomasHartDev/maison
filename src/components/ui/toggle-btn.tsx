import type { ReactNode } from "react";

interface ToggleBtnProps {
  children: ReactNode;
  active: boolean;
  onClick: () => void;
}

export const ToggleBtn = ({ children, active, onClick }: ToggleBtnProps) => (
  <button
    onClick={onClick}
    style={{
      background: active ? "var(--text)" : "transparent",
      color: active ? "#fff" : "var(--text3)",
      borderRadius: 8, padding: "7px 16px",
      fontSize: 12, fontWeight: 600,
      transition: "all .15s",
      border: "1px solid var(--border)",
    }}
  >
    {children}
  </button>
);
