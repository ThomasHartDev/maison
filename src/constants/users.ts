import type { Role, TabId } from "@/types";

export const TABS_BY_ROLE: Record<Role, TabId[]> = {
  admin: ["home", "dresses", "inbox", "shipments", "chat"],
  logistics: ["home", "dresses", "shipments", "chat"],
  marketing: ["home", "dresses"],
  design: ["home", "dresses", "inbox", "chat"],
  warehouse: ["home", "dresses", "shipments"],
};

export const TAB_ICONS: Record<TabId, string> = {
  home: "\u2302",
  dresses: "\u25C8",
  inbox: "\u2709",
  shipments: "\u25CE",
  chat: "\u25AC",
};
