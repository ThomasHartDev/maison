import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { Dress, Message, User } from "@/types";
import { MFRS } from "@/constants";
import { uid, matchDress, nowISO, nowTime } from "@/lib/helpers";

export function useLiveMessages(
  user: User | null,
  dresses: Dress[],
  setDresses: Dispatch<SetStateAction<Dress[]>>,
  setMessages: Dispatch<SetStateAction<Message[]>>,
) {
  useEffect(() => {
    if (!user) return;
    const t = setInterval(() => {
      if (Math.random() > 0.8) {
        const from = MFRS[Math.floor(Math.random() * MFRS.length)];
        const dress = dresses[Math.floor(Math.random() * dresses.length)];
        const isShipping = Math.random() > 0.6;
        const designTexts = [
          `Update on ${dress.poNumber} ${dress.name}: cutting complete, moving to sewing.`,
          `${dress.name} production on schedule.`,
          `QC photos for ${dress.poNumber} attached.`,
          `Slight delay on ${dress.name}, 2 days behind.`,
        ];
        const shipTexts = [
          `Shipping update: container for ${dress.poNumber} cleared customs.`,
          `Tracking update for ${dress.poNumber}: in transit, on schedule.`,
          `Delivery for ${dress.name} confirmed for next week.`,
        ];
        const texts = isShipping ? shipTexts : designTexts;
        const text = texts[Math.floor(Math.random() * texts.length)];
        const matched = matchDress(text, dresses);
        const msg: Message = {
          id: uid(), from: isShipping ? "DHL Express" : from.name,
          channel: isShipping ? "email" : "whatsapp",
          content: text, date: nowISO(), time: nowTime(),
          read: false, linkedDressIds: matched,
          needsReview: matched.length === 0, resolved: matched.length > 0,
          category: isShipping ? "shipping" : "design",
        };
        if (matched.length > 0) {
          matched.forEach(dId => {
            setDresses(prev => prev.map(d => {
              if (d.id !== dId) return d;
              return {
                ...d, timeline: [...d.timeline, {
                  id: uid(), date: nowISO(), time: nowTime(), type: msg.channel,
                  source: `${msg.channel === "whatsapp" ? "WhatsApp" : "Email"} from ${msg.from}`,
                  content: text, user: msg.from, category: msg.category,
                }],
              };
            }));
          });
        }
        setMessages(prev => [msg, ...prev]);
      }
    }, 18000);
    return () => clearInterval(t);
  }, [user, dresses, setDresses, setMessages]);
}
