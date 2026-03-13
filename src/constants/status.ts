import type { DressStatus, StatusConfig } from "@/types";

export const GOLD = "#9e7c3c";
export const RED = "#c0392b";
export const AMBER = "#d4820a";
export const GREEN = "#27855a";
export const BLUE = "#2872a8";
export const MUTED = "#999";

export const STATUS: Record<DressStatus, StatusConfig> = {
  draft:      { color: MUTED,    label: "Draft",         bg: "rgba(0,0,0,0.05)" },
  submitted:  { color: BLUE,     label: "Submitted",     bg: "var(--blue-bg)" },
  production: { color: AMBER,    label: "In Production", bg: "var(--amber-bg)" },
  ontrack:    { color: GREEN,    label: "On Track",      bg: "var(--green-bg)" },
  delayed:    { color: RED,      label: "Delayed",       bg: "var(--red-bg)" },
  shipped:    { color: "#7c3aed", label: "Shipped",      bg: "rgba(124,58,237,0.08)" },
  received:   { color: GREEN,    label: "Received",      bg: "var(--green-bg)" },
  cancelled:  { color: "#888",   label: "Cancelled",     bg: "rgba(0,0,0,0.04)" },
};

export const STATUSES = Object.keys(STATUS) as DressStatus[];
