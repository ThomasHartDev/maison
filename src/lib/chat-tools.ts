import type { Dress, DressStatus, Quantities, Size } from "@/types";
import { uid, sum } from "@/lib/helpers";

export const CHAT_TOOLS = [
  {
    name: "update_status",
    description: "Update the production status of a purchase order. Use when a message indicates a status change (e.g. production started, shipped, delayed).",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string", description: "The PO number (e.g. PO-001)" },
        new_status: {
          type: "string",
          enum: ["draft", "submitted", "production", "ontrack", "delayed", "shipped", "received", "cancelled"],
          description: "The new status to set",
        },
      },
      required: ["po_number", "new_status"],
    },
  },
  {
    name: "update_quantities",
    description: "Update the size-by-size quantity breakdown for a purchase order.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string", description: "The PO number" },
        quantities: {
          type: "object",
          properties: {
            XS: { type: "number" }, S: { type: "number" }, M: { type: "number" },
            L: { type: "number" }, XL: { type: "number" }, XXL: { type: "number" },
          },
          required: ["XS", "S", "M", "L", "XL", "XXL"],
          description: "Full size breakdown",
        },
      },
      required: ["po_number", "quantities"],
    },
  },
  {
    name: "update_due_date",
    description: "Change the due date of a purchase order. Use when a delay or schedule change is mentioned.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string", description: "The PO number" },
        new_date: { type: "string", description: "New due date in YYYY-MM-DD format" },
      },
      required: ["po_number", "new_date"],
    },
  },
  {
    name: "add_alert",
    description: "Add an alert or note to a purchase order. Use for quality issues, delays, or important updates.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string", description: "The PO number" },
        alert: { type: "string", description: "The alert message to add" },
      },
      required: ["po_number", "alert"],
    },
  },
  {
    name: "update_milestone",
    description: "Mark a production milestone as done or not done. Milestones are: Fabric Sourced, Cutting, Sewing, QC Passed, Dispatched.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string", description: "The PO number" },
        milestone_label: {
          type: "string",
          enum: ["Fabric Sourced", "Cutting", "Sewing", "QC Passed", "Dispatched"],
          description: "Which milestone to update",
        },
        done: { type: "boolean", description: "Whether the milestone is complete" },
      },
      required: ["po_number", "milestone_label", "done"],
    },
  },
  {
    name: "create_purchase_order",
    description: "Create a new purchase order. Use when the conversation mentions placing a new order, creating a new PO, or ordering a new dress/style.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Name of the dress/style" },
        collection_id: { type: "string", enum: ["col-1", "col-2", "col-3", "col-4"], description: "Collection ID" },
        manufacturer_id: { type: "string", enum: ["mfr-1", "mfr-2", "mfr-3"], description: "Manufacturer ID" },
        due_date: { type: "string", description: "Due date in YYYY-MM-DD format" },
        quantities: {
          type: "object",
          properties: {
            XS: { type: "number" }, S: { type: "number" }, M: { type: "number" },
            L: { type: "number" }, XL: { type: "number" }, XXL: { type: "number" },
          },
          required: ["XS", "S", "M", "L", "XL", "XXL"],
          description: "Size breakdown",
        },
      },
      required: ["name", "due_date", "quantities"],
    },
  },
];

const VALID_TOOL_NAMES = new Set(CHAT_TOOLS.map(t => t.name));

export function isValidTool(name: string): boolean {
  return VALID_TOOL_NAMES.has(name);
}

export function describeProposal(
  toolName: string,
  input: Record<string, unknown>,
  dresses: Dress[],
): string {
  const dress = dresses.find(d => d.poNumber === input.po_number);
  const name = dress ? `${dress.poNumber} ${dress.name}` : String(input.po_number);

  switch (toolName) {
    case "update_status":
      return `Update ${name} status to "${input.new_status}"`;
    case "update_quantities": {
      const qty = input.quantities as Quantities;
      return `Update ${name} quantities (total: ${sum(qty)})`;
    }
    case "update_due_date":
      return `Change ${name} due date to ${input.new_date}`;
    case "add_alert":
      return `Add alert to ${name}: "${input.alert}"`;
    case "update_milestone":
      return `Mark "${input.milestone_label}" as ${input.done ? "done" : "not done"} on ${name}`;
    case "create_purchase_order": {
      const qty = input.quantities as Quantities;
      return `Create new PO "${input.name}" (${sum(qty)} units, due ${input.due_date})`;
    }
    default:
      return `${toolName} on ${name}`;
  }
}

export function applyMutation(
  toolName: string,
  input: Record<string, unknown>,
  dresses: Dress[],
): Dress[] {
  if (toolName === "create_purchase_order") {
    const poNum = `PO-${String(dresses.length + 1).padStart(3, "0")}`;
    const qty = input.quantities as Quantities;
    const today = new Date().toISOString().split("T")[0];
    const newDress: Dress = {
      id: uid(),
      airtableId: null,
      poNumber: poNum,
      name: input.name as string,
      status: "draft",
      orderStatus: "Draft",
      orderDate: today,
      dueDate: input.due_date as string,
      sendPo: null,
      lateProduct: null,
      poNotes: null,
      separatePricing: null,
      shootSampleStatus: null,
      sendShootSamplesAgreed: null,
      tags: null,
      singleProductCost: null,
      straightSizeCost: null,
      plusSizeCost: null,
      salePrice: null,
      womensSizes: null,
      womensNumericSizes: null,
      girlsSizes: null,
      quantities: qty,
      inventoryItemId: null,
      inventoryItemSku: null,
      imageUrl: null,
      productNotes: null,
      collectionId: (input.collection_id as string) || null,
      collectionName: null,
      manufacturerId: (input.manufacturer_id as string) || null,
      manufacturerName: null,
      manufacturerCountry: null,
      shipMethod: null,
      milestones: [
        { label: "Fabric Sourced", done: false },
        { label: "Cutting", done: false },
        { label: "Sewing", done: false },
        { label: "QC Passed", done: false },
        { label: "Dispatched", done: false },
      ],
      alerts: [],
    };
    return [...dresses, newDress];
  }

  return dresses.map(d => {
    if (d.poNumber !== input.po_number) return d;

    switch (toolName) {
      case "update_status":
        return { ...d, status: input.new_status as DressStatus };
      case "update_quantities":
        return { ...d, quantities: input.quantities as Quantities };
      case "update_due_date":
        return { ...d, dueDate: input.new_date as string };
      case "add_alert":
        return { ...d, alerts: [...d.alerts, input.alert as string] };
      case "update_milestone":
        return {
          ...d,
          milestones: d.milestones.map(m =>
            m.label === input.milestone_label ? { ...m, done: input.done as boolean } : m,
          ),
        };
      default:
        return d;
    }
  });
}
