import type { User } from "@/types";
import { GOLD, GREEN } from "@/constants";

interface AppHeaderProps {
  user: User;
  onSignOut: () => void;
}

export const AppHeader = ({ user, onSignOut }: AppHeaderProps) => (
  <div style={{
    position: "sticky", top: 0, zIndex: 100,
    background: "rgba(250,249,247,0.95)", backdropFilter: "blur(20px)",
    padding: "11px 16px", borderBottom: "1px solid var(--border)",
    display: "flex", justifyContent: "space-between", alignItems: "center",
  }}>
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ fontFamily: "var(--font-display)", fontSize: 18, fontWeight: 600, color: GOLD }}>Maison</div>
      <div style={{ width: 6, height: 6, borderRadius: "50%", background: GREEN }} className="live-dot" />
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ fontSize: 11, color: "var(--text3)" }}>
        {user.name.split(" ")[0]} \u00b7 <span style={{ color: GOLD, textTransform: "capitalize" }}>{user.role}</span>
      </div>
      <button onClick={onSignOut} style={{ color: "var(--text3)", fontSize: 12 }}>Sign Out</button>
    </div>
  </div>
);
