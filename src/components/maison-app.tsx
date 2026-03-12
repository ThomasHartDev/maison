"use client";

import { useState } from "react";
import type { User, TabId, Dress, Message, Shipment } from "@/types";
import { CSS } from "@/styles/maison.css";
import { TABS_BY_ROLE } from "@/constants";
import { SEED_DRESSES, SEED_SHIPMENTS, SEED_MSGS } from "@/data/seed";
import { useAutoLink } from "@/hooks/use-auto-link";
import { useLiveMessages } from "@/hooks/use-live-messages";
import { LoginScreen } from "./login-screen";
import { AppHeader } from "./app-header";
import { AppNav } from "./app-nav";
import { HomeView } from "./home-view";
import { DressesView } from "./dresses/dresses-view";
import { InboxView } from "./inbox/inbox-view";
import { ShipmentsView } from "./shipments/shipments-view";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabId>("home");
  const [dresses, setDresses] = useState<Dress[]>(SEED_DRESSES);
  const [messages, setMessages] = useState<Message[]>(SEED_MSGS);
  const [shipments, setShipments] = useState<Shipment[]>(SEED_SHIPMENTS);
  const [colFilter, setColFilter] = useState<string | null>(null);

  useAutoLink(dresses, setDresses, setMessages, setShipments);
  useLiveMessages(user, dresses, setDresses, setMessages);

  if (!user) {
    return (
      <><style>{CSS}</style><LoginScreen onLogin={(u: User) => { setUser(u); setTab("home"); }} /></>
    );
  }

  const tabs = TABS_BY_ROLE[user.role] || TABS_BY_ROLE.admin;
  const unread = messages.filter(m => !m.read).length;

  return (
    <><style>{CSS}</style>
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column" }}>
        <AppHeader user={user} onSignOut={() => setUser(null)} />
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px 100px", WebkitOverflowScrolling: "touch" }}>
          {tab === "home" && <HomeView dresses={dresses} messages={messages} shipments={shipments} user={user} setTab={setTab} setColFilter={setColFilter} />}
          {tab === "dresses" && <DressesView dresses={dresses} setDresses={setDresses} user={user} initCol={colFilter} />}
          {tab === "inbox" && <InboxView messages={messages} setMessages={setMessages} dresses={dresses} setDresses={setDresses} user={user} />}
          {tab === "shipments" && <ShipmentsView shipments={shipments} setShipments={setShipments} dresses={dresses} setDresses={setDresses} />}
        </div>
        <AppNav tabs={tabs} activeTab={tab} unread={unread} onTabChange={(t) => { setTab(t); if (t !== "dresses") setColFilter(null); }} />
      </div>
    </>
  );
}
