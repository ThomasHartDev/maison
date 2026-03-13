import type { User, Role, TabId } from "@/types";

export const USERS: User[] = [
  { id: "u1", email: "admin@brand.com",     pass: "pass", role: "admin",     name: "Alex Admin" },
  { id: "u2", email: "logistics@brand.com", pass: "pass", role: "logistics", name: "Jordan Lee" },
  { id: "u3", email: "marketing@brand.com", pass: "pass", role: "marketing", name: "Priya Nair" },
  { id: "u4", email: "design@brand.com",    pass: "pass", role: "design",    name: "Sofia Marte" },
  { id: "u5", email: "warehouse@brand.com", pass: "pass", role: "warehouse", name: "Carlos Ruiz" },
];

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
