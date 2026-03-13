import type { Dress, DressStatus } from "@/types";

/** Reverse map: our DressStatus → the orderStatus string stored in Postgres */
const STATUS_TO_ORDER_STATUS: Record<DressStatus, string> = {
  draft: "Draft",
  submitted: "Submitted",
  production: "Complete",
  ontrack: "Open",
  delayed: "Delayed",
  shipped: "Shipped",
  received: "Delivered",
  cancelled: "Cancelled",
};

/**
 * Persists a chat tool mutation to the database.
 * Returns the new dress ID for create_purchase_order, or null for updates.
 */
export async function persistMutation(
  toolName: string,
  input: Record<string, unknown>,
  dresses: Dress[],
): Promise<string | null> {
  if (toolName === "create_purchase_order") {
    const qty = input.quantities as Record<string, number>;
    const res = await fetch("/api/purchase-orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderStatus: "Draft",
        shipByDateAgreed: input.due_date,
        womensSizes: { xs: qty.XS, s: qty.S, m: qty.M, l: qty.L, xl: qty.XL, xxl: qty.XXL },
        collectionId: input.collection_id || null,
        manufacturerId: input.manufacturer_id || null,
      }),
    });
    if (!res.ok) throw new Error("Failed to create purchase order");
    const data = await res.json();
    return data.id as string;
  }

  // For updates, find the dress by poNumber to get the DB id
  const dress = dresses.find(d => d.poNumber === input.po_number);
  if (!dress) throw new Error(`PO ${input.po_number} not found`);

  const patch: Record<string, unknown> = {};

  switch (toolName) {
    case "update_status": {
      const status = input.new_status as DressStatus;
      patch.orderStatus = STATUS_TO_ORDER_STATUS[status] || input.new_status;
      break;
    }
    case "update_due_date":
      patch.shipByDateAgreed = input.new_date;
      break;
    case "update_quantities": {
      const qty = input.quantities as Record<string, number>;
      patch.womensSizes = { xs: qty.XS, s: qty.S, m: qty.M, l: qty.L, xl: qty.XL, xxl: qty.XXL };
      break;
    }
    case "add_alert": {
      const existing = dress.poNotes || "";
      const separator = existing ? "\n" : "";
      patch.poNotes = existing + separator + (input.alert as string);
      break;
    }
    case "update_milestone":
      // Milestones are derived from status — no DB column to update.
      // Skip the API call, local state handles it.
      return null;
    default:
      return null;
  }

  const res = await fetch(`/api/purchase-orders/${dress.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!res.ok) throw new Error(`Failed to update ${dress.poNumber}`);
  return null;
}
