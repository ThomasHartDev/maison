"use client";

import { useState } from "react";
import type { User, TabId, Message } from "@/types";
import { CSS } from "@/styles/maison.css";
import { TABS_BY_ROLE } from "@/constants";
import { useDresses } from "@/hooks/use-dresses";
import { useCollections } from "@/hooks/use-collections";
import { useManufacturers } from "@/hooks/use-manufacturers";
import { useInvoices } from "@/hooks/use-invoices";
import { LoginScreen } from "./login-screen";
import { AppHeader } from "./app-header";
import { AppNav } from "./app-nav";
import { HomeView } from "./home-view";
import { DressesView } from "./dresses/dresses-view";
import { InboxView } from "./inbox/inbox-view";
import { ShipmentsView } from "./shipments/shipments-view";
import { ChatView } from "./chat/chat-view";

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<TabId>("home");
  const { dresses, setDresses, loading: dressesLoading } = useDresses();
  const { collections, loading: colLoading } = useCollections();
  const { manufacturers, loading: mfrLoading } = useManufacturers();
  const { invoices, loading: invLoading } = useInvoices();
  const [messages, setMessages] = useState<Message[]>([]);
  const [colFilter, setColFilter] = useState<string | null>(null);

  const loading = dressesLoading || colLoading || mfrLoading || invLoading;

  if (!user) {
    return (
      <><style>{CSS}</style><LoginScreen onLogin={(u: User) => { setUser(u); setTab("home"); }} /></>
    );
  }

  const tabs = TABS_BY_ROLE[user.role] || TABS_BY_ROLE.admin;
  const unread = messages.filter(m => !m.read).length;

  return (
    <><style>{CSS}</style>
      <div style={{ minHeight: "100dvh", background: "var(--bg)", display: "flex", flexDirection: "column", ...(tab === "chat" && { height: "100dvh", maxHeight: "100dvh" }) }}>
        <AppHeader user={user} onSignOut={() => setUser(null)} />
        <div style={{
          flex: 1,
          ...(tab === "chat"
            ? { overflow: "hidden", padding: 0, display: "flex", flexDirection: "column" as const }
            : { overflowY: "auto" as const, padding: "20px 16px 100px", WebkitOverflowScrolling: "touch" as const }),
        }}>
          {loading ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 60, color: "var(--text3)", fontSize: 14 }}>Loading...</div>
          ) : (
            <>
              {tab === "home" && <HomeView dresses={dresses} messages={messages} invoices={invoices} collections={collections} user={user} setTab={setTab} setColFilter={setColFilter} />}
              {tab === "dresses" && <DressesView dresses={dresses} setDresses={setDresses} collections={collections} manufacturers={manufacturers} user={user} initCol={colFilter} />}
              {tab === "inbox" && <InboxView messages={messages} setMessages={setMessages} dresses={dresses} setDresses={setDresses} user={user} />}
              {tab === "shipments" && <ShipmentsView invoices={invoices} manufacturers={manufacturers} dresses={dresses} />}
              {tab === "chat" && <ChatView dresses={dresses} setDresses={setDresses} collections={collections} manufacturers={manufacturers} user={user} />}
            </>
          )}
        </div>
        <AppNav tabs={tabs} activeTab={tab} unread={unread} onTabChange={(t) => { setTab(t); if (t !== "dresses") setColFilter(null); }} />
      </div>
    </>
  );
}
