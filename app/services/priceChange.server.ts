// Price changed under the agent (spec §7.5 PRICE_CHANGED, §12 "price changes
// during the session"): what the agent saw on the cart is compared with what
// the server works out at checkout. If a line differs, the agent is shown the
// old and new totals and has to confirm before the order goes ahead. Free of
// Shopify calls so it can be tested.

export interface ExpectedLine {
  variantId: string | number;
  quantity: number;
  // The unit price the agent saw, in minor units (cents).
  expectedUnit?: number | null;
}

export interface ActualLine {
  variantId: string | number;
  title: string;
  sku: string | null;
  // The unit price now, in major units, or null when it can't be told.
  unit: number | null;
}

export interface PriceChange {
  title: string;
  sku: string | null;
  quantity: number;
  oldUnit: number; // major units
  newUnit: number;
}

export interface PriceCheck {
  changes: PriceChange[];
  oldTotal: number; // major units, over the lines that could be compared
  newTotal: number;
}

const cents = (n: number) => Math.round(n * 100);

export function comparePrices(expected: ExpectedLine[], actual: ActualLine[]): PriceCheck {
  const out: PriceCheck = { changes: [], oldTotal: 0, newTotal: 0 };

  expected.forEach((line, i) => {
    const now = actual[i];
    const quantity = Number(line.quantity || 0);
    // Nothing to compare when the agent's price or the current one is unknown.
    if (!now || now.unit === null || now.unit === undefined) return;
    if (line.expectedUnit === null || line.expectedUnit === undefined || !Number.isFinite(Number(line.expectedUnit))) return;

    const oldUnit = Number(line.expectedUnit) / 100;
    out.oldTotal += oldUnit * quantity;
    out.newTotal += now.unit * quantity;

    // A cent either way is rounding, not a change.
    if (Math.abs(cents(now.unit) - Number(line.expectedUnit)) <= 1) return;
    out.changes.push({ title: now.title, sku: now.sku, quantity, oldUnit, newUnit: now.unit });
  });

  out.oldTotal = Math.round(out.oldTotal * 100) / 100;
  out.newTotal = Math.round(out.newTotal * 100) / 100;
  return out;
}

export function describeChanges(check: PriceCheck, currency: string): string {
  const money = (n: number) => `${currency} ${n.toFixed(2)}`;
  const lines = check.changes.map((c) => `${c.title}${c.sku ? ` (${c.sku})` : ""}: ${money(c.oldUnit)} -> ${money(c.newUnit)} each`);
  return `${lines.join("; ")}. Total was ${money(check.oldTotal)}, now ${money(check.newTotal)}`;
}
