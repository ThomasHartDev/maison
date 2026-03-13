import type { ReactNode, CSSProperties } from "react";
import { RED } from "@/constants";

interface CardProps {
  children: ReactNode;
  onClick?: () => void;
  style?: CSSProperties;
  alert?: boolean;
  className?: string;
}

export const Card = ({ children, onClick, style, alert, className = "" }: CardProps) => (
  <div
    onClick={onClick}
    className={className}
    style={{
      background: "var(--surface)",
      border: `1px solid ${alert ? RED + "33" : "var(--border)"}`,
      borderRadius: 14, overflow: "hidden",
      boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      ...(onClick ? { cursor: "pointer" } : {}),
      ...style,
    }}
  >
    {children}
  </div>
);
