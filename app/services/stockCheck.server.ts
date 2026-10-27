// Stock at checkout (spec §9.5, AC11): an agent's order is checked against what
// is in stock. An item that can't be sold past zero blocks the order; one that
// can (a backorder) is allowed only once the agent says so, because the promise
// to the customer has changed. Free of Shopify calls so it can be tested.

export interface StockVariant {
  id: string; // gid
  title: string;
  sku: string | null;
  inventoryQuantity: number | null; // null: stock is not tracked
  inventoryPolicy: string | null; // "DENY" | "CONTINUE"
}

export interface WantedLine {
  variantId: string | number;
  quantity: number;
}

export interface StockIssue {
  title: string;
  sku: string | null;
  requested: number;
  available: number;
}

export interface StockResult {
  // Not enough stock and it can't be sold past zero.
  unavailable: StockIssue[];
  // Not enough stock, but it can be backordered.
  backordered: StockIssue[];
}

export function checkStock(lines: WantedLine[], variants: StockVariant[]): StockResult {
  const byId = new Map(variants.map((v) => [v.id, v]));
  // The same item on two lines is asked for together.
  const wanted = new Map<string, number>();
  for (const line of lines) {
    const gid = `gid://shopify/ProductVariant/${line.variantId}`;
    wanted.set(gid, (wanted.get(gid) ?? 0) + Number(line.quantity || 0));
  }

  const out: StockResult = { unavailable: [], backordered: [] };

  for (const [gid, requested] of wanted) {
    const v = byId.get(gid);
    if (!v || v.inventoryQuantity === null || v.inventoryQuantity === undefined) continue; // not tracked
    const available = Math.max(v.inventoryQuantity, 0);
    if (requested <= available) continue;

    const issue = { title: v.title, sku: v.sku, requested, available };
    if (v.inventoryPolicy === "CONTINUE") out.backordered.push(issue);
    else out.unavailable.push(issue);
  }

  return out;
}

export function describeIssues(issues: StockIssue[]): string {
  return issues
    .map((i) => `${i.title}${i.sku ? ` (${i.sku})` : ""}: ${i.requested} wanted, ${i.available} in stock`)
    .join("; ");
}
