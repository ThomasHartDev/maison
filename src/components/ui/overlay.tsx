"use client";

import { useEffect, type ReactNode, type MouseEvent } from "react";
import { createPortal } from "react-dom";

interface OverlayProps {
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}

export const Overlay = ({ children, onClose, wide }: OverlayProps) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  });

  return createPortal(
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.4)", backdropFilter: "blur(4px)",
        zIndex: 200, display: "flex",
        alignItems: "center", justifyContent: "center",
      }}
      onClick={(e: MouseEvent) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className={`fade-up${wide ? " modal-wide" : ""}`}
        style={{
          background: "#fff", borderRadius: 20,
          width: "100%", maxWidth: wide ? 960 : 580,
          maxHeight: "85dvh", overflowY: "auto",
          padding: "24px 20px 32px", margin: 16,
        }}
      >
        {children}
      </div>
    </div>,
    document.body,
  );
};
