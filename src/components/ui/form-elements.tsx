import type { InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes } from "react";

export const Inp = ({ style, ...p }: InputHTMLAttributes<HTMLInputElement>) => (
  <input
    {...p}
    style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: 10, color: "var(--text)",
      padding: "11px 14px", fontSize: 14, width: "100%",
      outline: "none", fontFamily: "var(--font-body)",
      ...style,
    }}
  />
);

export const Txa = ({ style, ...p }: TextareaHTMLAttributes<HTMLTextAreaElement>) => (
  <textarea
    {...p}
    style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      borderRadius: 10, color: "var(--text)",
      padding: "11px 14px", fontSize: 14, width: "100%",
      outline: "none", resize: "none", fontFamily: "var(--font-body)",
      ...style,
    }}
  />
);

export const Sel = ({ style, ...p }: SelectHTMLAttributes<HTMLSelectElement>) => (
  <select
    {...p}
    style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 10, color: "var(--text)",
      padding: "11px 14px", fontSize: 14, width: "100%",
      outline: "none", fontFamily: "var(--font-body)",
      ...style,
    }}
  />
);
