import type { ReactNode } from "react";

export const Lbl = ({ children }: { children: ReactNode }) => (
  <div
    style={{
      fontSize: 10, color: "var(--text3)",
      textTransform: "uppercase", letterSpacing: 1.5,
      marginBottom: 6, fontWeight: 600,
    }}
  >
    {children}
  </div>
);
