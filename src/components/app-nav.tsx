import type { TabId } from "@/types";
import { GOLD, RED, TAB_ICONS } from "@/constants";

interface AppNavProps {
  tabs: TabId[];
  activeTab: TabId;
  unread: number;
  onTabChange: (tab: TabId) => void;
}

export const AppNav = ({ tabs, activeTab, unread, onTabChange }: AppNavProps) => (
  <div style={{
    position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
    background: "rgba(250,249,247,0.95)", backdropFilter: "blur(20px)",
    borderTop: "1px solid var(--border)",
    display: "flex", justifyContent: "space-around",
    paddingBottom: "env(safe-area-inset-bottom, 8px)", paddingTop: 8,
  }}>
    {tabs.map(t => {
      const active = activeTab === t;
      const hasN = t === "inbox" && unread > 0;
      return (
        <button
          key={t}
          onClick={() => onTabChange(t)}
          style={{
            color: active ? GOLD : "var(--text3)",
            display: "flex", flexDirection: "column", alignItems: "center",
            gap: 2, padding: "4px 12px", position: "relative", minWidth: 56,
          }}
        >
          <div style={{ fontSize: 20, lineHeight: 1 }}>{TAB_ICONS[t]}</div>
          <div style={{ fontSize: 9, letterSpacing: 0.5, textTransform: "uppercase", fontWeight: active ? 700 : 400 }}>
            {t === "dresses" ? "Dresses" : t.charAt(0).toUpperCase() + t.slice(1)}
          </div>
          {hasN && (
            <div style={{
              position: "absolute", top: 2, right: "calc(50% - 16px)",
              width: 16, height: 16, borderRadius: "50%",
              background: RED, color: "#fff", fontSize: 9, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {unread > 9 ? "9+" : unread}
            </div>
          )}
          {active && <div style={{ position: "absolute", bottom: 0, left: "25%", right: "25%", height: 2, background: GOLD, borderRadius: 2 }} />}
        </button>
      );
    })}
  </div>
);
