// Reorder (spec §3.5): lines from an earlier order go into a new cart. Old
// prices, tax and promises are never copied; each line is looked at again and
// answered on its own so the agent can confirm the differences first.
// Kept free of Shopify calls so the rules can be tested.

export type ReorderStatus = "ADDED" | "QUANTITY_ADJUSTED" | "UNAVAILABLE" | "RESTRICTED" | "SUBSTITUTED";

export interface PastLine {
  title: string;
  sku: string | null;
  quantity: number;
  variant: {
    id: string;
    title: string | null;
    availableForSale: boolean;
    inventoryPolicy: string | null; // "DENY" | "CONTINUE"
    inventoryQuantity: number | null;
    product: { title: string; status: string } | null;
  } | null;
}

export interface ReorderRow {
  variantId: string | null;
  title: string;
  sku: string | null;
  requested: number;
  quantity: number;
  status: ReorderStatus;
  note: string;
  // For a substitute: the item it stands in for. The agent has to accept it.
  replaces?: { title: string; sku: string | null };
}

// A replacement the merchant has set for an item that is no longer sold (spec
// §3.5, §12): by SKU, with an optional note shown to the agent.
export interface Substitute {
  toSku: string;
  note?: string;
}

// What can be said about a substitute once it has been looked up.
export interface SubstituteVariant {
  id: string;
  sku: string;
  title: string;
  availableForSale: boolean;
  inventoryPolicy: string | null;
  inventoryQuantity: number | null;
  productStatus: string | null;
}

export function evaluateReorderLine(line: PastLine): ReorderRow {
  const base = {
    title: line.variant?.product?.title ? [line.variant.product.title, line.variant.title && line.variant.title !== "Default Title" ? line.variant.title : null].filter(Boolean).join(" - ") : line.title,
    sku: line.sku,
    requested: line.quantity,
  };
  const v = line.variant;

  if (!v) return { ...base, variantId: null, quantity: 0, status: "UNAVAILABLE", note: "This item is no longer sold." };

  const variantId = String(v.id).split("/").pop() as string;
  const status = v.product?.status;

  if (status === "ARCHIVED") return { ...base, variantId, quantity: 0, status: "UNAVAILABLE", note: "This item has been discontinued." };
  if (status && status !== "ACTIVE") return { ...base, variantId, quantity: 0, status: "RESTRICTED", note: "This item can't be ordered right now." };

  if (!v.availableForSale) return { ...base, variantId, quantity: 0, status: "UNAVAILABLE", note: "Out of stock." };

  const limited = v.inventoryPolicy === "DENY" && v.inventoryQuantity !== null && v.inventoryQuantity !== undefined;
  if (limited && (v.inventoryQuantity as number) < line.quantity) {
    const left = Math.max(v.inventoryQuantity as number, 0);
    if (left === 0) return { ...base, variantId, quantity: 0, status: "UNAVAILABLE", note: "Out of stock." };
    return { ...base, variantId, quantity: left, status: "QUANTITY_ADJUSTED", note: `Only ${left} in stock (you ordered ${line.quantity} before).` };
  }

  return { ...base, variantId, quantity: line.quantity, status: "ADDED", note: "" };
}

// An item that can't be added, but has a substitute that can, is offered the
// substitute in its place. It is only offered: it is never added without the
// agent saying yes (spec: "offer configured substitute without automatic
// acceptance").
export function applySubstitutes(rows: ReorderRow[], substitutes: Map<string, Substitute>, found: Map<string, SubstituteVariant>): ReorderRow[] {
  return rows.map((row) => {
    if ((row.status !== "UNAVAILABLE" && row.status !== "RESTRICTED") || !row.sku) return row;
    const sub = substitutes.get(row.sku.toLowerCase());
    const v = sub ? found.get(sub.toSku.toLowerCase()) : undefined;
    if (!sub || !v) return row;
    if (v.productStatus && v.productStatus !== "ACTIVE") return row;
    if (!v.availableForSale) return row;

    const limited = v.inventoryPolicy === "DENY" && v.inventoryQuantity !== null && v.inventoryQuantity !== undefined;
    const left = limited ? Math.max(v.inventoryQuantity as number, 0) : Infinity;
    if (left === 0) return row;
    const quantity = Math.min(row.requested, left);

    return {
      variantId: String(v.id).split("/").pop() as string,
      title: v.title,
      sku: v.sku,
      requested: row.requested,
      quantity,
      status: "SUBSTITUTED",
      note: `Offered instead of ${row.title}${row.sku ? ` (${row.sku})` : ""}.${sub.note ? " " + sub.note : ""}${quantity < row.requested ? ` Only ${quantity} in stock.` : ""}`,
      replaces: { title: row.title, sku: row.sku },
    };
  });
}

// Lines for the same item are added together so the cart gets one line each.
export function evaluateReorder(lines: PastLine[]): ReorderRow[] {
  const rows: ReorderRow[] = [];
  const seen = new Map<string, ReorderRow>();

  for (const line of lines) {
    const row = evaluateReorderLine(line);
    const earlier = row.variantId ? seen.get(row.variantId) : undefined;

    if (earlier && earlier.status !== "UNAVAILABLE" && row.status !== "UNAVAILABLE") {
      earlier.requested += row.requested;
      earlier.quantity += row.quantity;
      if (row.status === "QUANTITY_ADJUSTED") earlier.status = "QUANTITY_ADJUSTED";
      continue;
    }

    rows.push(row);
    if (row.variantId) seen.set(row.variantId, row);
  }

  return rows;
}
