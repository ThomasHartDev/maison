import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Dress, Message, Shipment } from "@/types";
import { uid, matchDress } from "@/lib/helpers";

export function useAutoLink(
  dresses: Dress[],
  setDresses: Dispatch<SetStateAction<Dress[]>>,
  setMessages: Dispatch<SetStateAction<Message[]>>,
  setShipments: Dispatch<SetStateAction<Shipment[]>>,
) {
  useEffect(() => {
    setMessages(prev => prev.map(msg => {
      if (msg.linkedDressIds?.length > 0) return msg;
      const matched = matchDress(msg.content, dresses);
      if (matched.length > 0) {
        matched.forEach(dId => {
          setDresses(pd => pd.map(d => {
            if (d.id !== dId) return d;
            const exists = d.timeline.some(t => t.content?.includes(msg.content.slice(0, 30)));
            if (exists) return d;
            return {
              ...d, timeline: [...d.timeline, {
                id: uid(), date: msg.date, time: msg.time, type: msg.channel,
                source: `${msg.channel === "whatsapp" ? "WhatsApp" : "Email"} from ${msg.from}`,
                content: msg.content, user: msg.from, category: msg.category || "design",
              }],
            };
          }));
        });
        return { ...msg, linkedDressIds: matched };
      }
      return msg;
    }));

    setShipments(prev => prev.map(s => {
      if (s.dressIds?.length > 0) return s;
      if (s.id === "SHP-001") return { ...s, dressIds: dresses.filter(d => d.poNumber === "PO-001" || d.poNumber === "PO-004").map(d => d.id) };
      if (s.id === "SHP-002") return { ...s, dressIds: dresses.filter(d => d.poNumber === "PO-002" || d.poNumber === "PO-005").map(d => d.id) };
      return s;
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
