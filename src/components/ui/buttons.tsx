import type { ReactNode, CSSProperties } from "react";

interface BtnGoldProps {
  children: ReactNode;
  onClick: () => void;
  small?: boolean;
  style?: CSSProperties;
  disabled?: boolean;
}

export const BtnGold = ({ children, onClick, small, style, disabled }: BtnGoldProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    style={{
      background: disabled ? "#ddd" : "var(--gold)",
      color: "#fff", borderRadius: 10,
      padding: small ? "8px 16px" : "12px 24px",
      fontSize: small ? 12 : 14, fontWeight: 700,
      opacity: disabled ? 0.5 : 1,
      ...style,
    }}
  >
    {children}
  </button>
);

interface BtnGhostProps {
  children: ReactNode;
  onClick: () => void;
  small?: boolean;
  style?: CSSProperties;
}

export const BtnGhost = ({ children, onClick, small, style }: BtnGhostProps) => (
  <button
    onClick={onClick}
    style={{
      background: "var(--surface2)",
      border: "1px solid var(--border)",
      color: "var(--text2)", borderRadius: 10,
      padding: small ? "8px 14px" : "12px 20px",
      fontSize: small ? 12 : 14, fontWeight: 500,
      ...style,
    }}
  >
    {children}
  </button>
);
