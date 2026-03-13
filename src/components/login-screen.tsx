"use client";

import { useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { User } from "@/types";
import { GOLD, RED } from "@/constants";
import { Inp } from "@/components/ui/form-elements";
import { BtnGold } from "@/components/ui/buttons";
import { Lbl } from "@/components/ui/label";

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export const LoginScreen = ({ onLogin }: LoginScreenProps) => {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const go = async () => {
    setErr("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pass }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErr(data.error || "Login failed");
        return;
      }
      onLogin(data.user);
    } catch {
      setErr("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ width: "100%", maxWidth: 340 }}>
        <div style={{ textAlign: "center", marginBottom: 44 }}>
          <div style={{ fontSize: 10, letterSpacing: 5, color: GOLD, textTransform: "uppercase", marginBottom: 10, fontWeight: 600 }}>Atelier</div>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 44, fontWeight: 600, color: "var(--text)", lineHeight: 1 }}>Maison</div>
          <div style={{ color: "var(--text3)", fontSize: 13, marginTop: 10, fontWeight: 300 }}>Fashion Operations Platform</div>
        </div>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: 28, boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ marginBottom: 16 }}>
            <Lbl>Email</Lbl>
            <Inp value={email} onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)} placeholder="you@maison.com" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <Lbl>Password</Lbl>
            <Inp value={pass} onChange={(e: ChangeEvent<HTMLInputElement>) => setPass(e.target.value)} type="password" placeholder="••••••••" onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => e.key === "Enter" && go()} />
          </div>
          {err && <div style={{ color: RED, fontSize: 12, marginBottom: 12, textAlign: "center" }}>{err}</div>}
          <BtnGold onClick={go} style={{ width: "100%", padding: 14, opacity: loading ? 0.6 : 1 }}>
            {loading ? "Signing in..." : "Sign In"}
          </BtnGold>
          <div style={{ marginTop: 20, fontSize: 11, color: "var(--text3)", textAlign: "center", lineHeight: 1.7 }}>
            admin / logistics / marketing / design / warehouse<br />password: <span style={{ color: GOLD, fontWeight: 600 }}>pass</span>
          </div>
        </div>
      </div>
    </div>
  );
};
