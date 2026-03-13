import { db } from "./db";
import { auditLog } from "./schema";
import { randomUUID } from "crypto";

interface AuditEntry {
  purchaseOrderId: string;
  userId: string | null;
  userName: string;
  action: string;
  field?: string;
  oldValue?: string | null;
  newValue?: string | null;
  source?: "manual" | "chat" | "system";
}

export async function logAudit(entry: AuditEntry) {
  await db.insert(auditLog).values({
    id: randomUUID(),
    purchaseOrderId: entry.purchaseOrderId,
    userId: entry.userId,
    userName: entry.userName,
    action: entry.action,
    field: entry.field ?? null,
    oldValue: entry.oldValue ?? null,
    newValue: entry.newValue ?? null,
    source: entry.source ?? "manual",
  });
}

export function stringifyValue(val: unknown): string | null {
  if (val === null || val === undefined) return null;
  if (typeof val === "object") return JSON.stringify(val);
  return String(val);
}
