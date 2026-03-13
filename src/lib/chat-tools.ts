import type { Dress, DressStatus, Quantities, Size } from "@/types";
import { uid, sum } from "@/lib/helpers";

export const CHAT_TOOLS = [
  {
    name: "update_status",
    description: "Change PO production status.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string" },
        new_status: {
          type: "string",
          enum: ["draft", "submitted", "production", "ontrack", "delayed", "shipped", "received", "cancelled"],
        },
      },
      required: ["po_number", "new_status"],
    },
  },
  {
    name: "update_quantities",
    description: "Update size-by-size quantities for a PO.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string" },
        quantities: {
          type: "object",
          properties: {
            XS: { type: "number" }, S: { type: "number" }, M: { type: "number" },
            L: { type: "number" }, XL: { type: "number" }, XXL: { type: "number" },
          },
          required: ["XS", "S", "M", "L", "XL", "XXL"],
        },
      },
      required: ["po_number", "quantities"],
    },
  },
  {
    name: "update_due_date",
    description: "Change PO due date.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string" },
        new_date: { type: "string", description: "YYYY-MM-DD" },
      },
      required: ["po_number", "new_date"],
    },
  },
  {
    name: "add_alert",
    description: "Add alert/note to a PO for quality issues or important updates.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string" },
        alert: { type: "string" },
      },
      required: ["po_number", "alert"],
    },
  },
  {
    name: "update_milestone",
    description: "Mark a production milestone done/not done.",
    input_schema: {
      type: "object" as const,
      properties: {
        po_number: { type: "string" },
        milestone_label: {
          type: "string",
          enum: ["Fabric Sourced", "Cutting", "Sewing", "QC Passed", "Dispatched"],
        },
        done: { type: "boolean" },
      },
      required: ["po_number", "milestone_label", "done"],
    },
  },
  {
    name: "create_purchase_order",
    description: "Create a new PO when a new order is mentioned.",
    input_schema: {
      type: "object" as const,
      properties: {
        name: { type: "string", description: "Dress/style name" },
        collection_id: { type: "string" },
        manufacturer_id: { type: "string" },
        due_date: { type: "string", description: "YYYY-MM-DD" },
        quantities: {
          type: "object",
          properties: {
            XS: { type: "number" }, S: { type: "number" }, M: { type: "number" },
            L: { type: "number" }, XL: { type: "number" }, XXL: { type: "number" },
          },
          required: ["XS", "S", "M", "L", "XL", "XXL"],
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
