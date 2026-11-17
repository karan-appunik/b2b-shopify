// Exceptions (price overrides) an agent has been given for the customer's
// order, and how checkout uses them. Kept free of Shopify and network calls so
// the rules can be tested on their own.

export interface AgentOverride {
  id: string;
  type: string;
  status: string;
  denyReason: string | null;
  lineVariantId: string | null;
  // The quantity the exception was approved for.
  snapshotQuantity?: number | null;
  baseline: { amount: number; currency: string };
  proposed: { amount: number; currency: string };
  deltaPercent: number | null;
  reasonCode: string;
  reasonText: string;
  custom?: { title: string; quantity: number; taxable?: boolean; taxCode?: string | null; accountingCode?: string | null } | null;
  // Which quantity rule a QUANTITY_RULE exception relaxes.
  rule?: "MOQ" | "INCREMENT" | null;
  // A one-off delivery address.
  address?: {
    company?: string; address1: string; address2?: string; city: string; provinceCode?: string; zip: string; countryCode: string; phone?: string;
  } | null;
  expiresAt: string | null;
  route?: { policyName?: string; slaHours?: number } | null;
  decisions?: { name: string; decision: string; comment?: string; at: string }[];
}

export interface CheckoutLine {
  variantId: string | number;
  quantity: number;
}

export interface AppliedOverride {
  id: string;
  // Unit price in the order's currency (major units, e.g. 42.50).
  unitPrice: number;
}

const USABLE = ["AUTO_APPROVED", "APPROVED"];

// Which of the agent's exceptions checkout should apply, keyed by the
// Shopify variant gid. Only a unit-price exception that is approved, for a
// line that is really in this order, in the order's currency, counts.
// Anything else is ignored — the line is simply charged its baseline price.
export function overridesForCheckout(
  overrides: AgentOverride[],
  lines: CheckoutLine[],
  currency: string,
): Map<string, AppliedOverride> {
  const out = new Map<string, AppliedOverride>();

  for (const override of overrides) {
    if (override.type !== "UNIT_PRICE" || !USABLE.includes(override.status)) continue;
    if (!override.lineVariantId) continue;
    if (override.proposed.currency.toUpperCase() !== currency.toUpperCase()) continue;

    const line = lines.find((l) => String(l.variantId) === override.lineVariantId);
    if (!line) continue;
    // An approval is for the quantity that was asked about; a different
    // quantity is a different deal.
    if (override.snapshotQuantity != null && Number(line.quantity) !== override.snapshotQuantity) continue;

    const gid = `gid://shopify/ProductVariant/${override.lineVariantId}`;
    // If two approved exceptions cover one line, the lower price is what was
    // last negotiated down to; keep the first seen (newest first from the API).
    if (!out.has(gid)) out.set(gid, { id: override.id, unitPrice: override.proposed.amount / 100 });
  }

  return out;
}

// Exceptions still waiting for an approver. Checkout is held while any exist
// (spec §4.6: "Block checkout when … approval is pending").
export function pendingOverrides(overrides: AgentOverride[]): AgentOverride[] {
  return overrides.filter((o) => o.status === "PENDING_APPROVAL");
}

// The price checkout charges for a line: the agreed exception if there is
// one, otherwise what the pricing rules gave.
export function effectiveUnitPrice(
  variantGid: string,
  computedUnitPrice: number,
  applied: Map<string, AppliedOverride>,
): number {
  const override = applied.get(variantGid);
  return override ? override.unitPrice : computedUnitPrice;
}

// Minor units (cents) from a price a person typed, or null if it isn't a
// valid non-negative amount.
export function toMinorUnits(input: unknown): number | null {
  // An empty box is "no price", not a free price: Number("") is 0.
  if (typeof input !== "number" && String(input ?? "").trim() === "") return null;

  const value = typeof input === "number" ? input : Number(String(input).trim());
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

// The exceptions that act on the whole order rather than on one line (spec
// §8.2): an order discount, a shipping price, quantity rules that were relaxed,
// and custom lines. Same rule as for prices: only an approved one, in the
// order's currency, counts. Amounts are in major units (e.g. 42.50).
export interface OrderExceptions {
  discount: { id: string; amount: number } | null;
  shipping: { id: string; price: number } | null;
  // The smallest quantity the agent was allowed to accept, if any.
  acceptedMinQuantity: { id: string; quantity: number } | null;
  // The pack-size rule is waived for this order.
  incrementWaived: { id: string } | null;
  // Ship to this address for this order, instead of the one chosen.
  address: { id: string; address: NonNullable<AgentOverride["address"]> } | null;
  // The most the order may come to when it goes past the customer's credit.
  credit: { id: string; exposure: number } | null;
  // A manager's approval of the whole order (approval-first roles), and the
  // total it covers in major units.
  orderApproval: { id: string; total: number } | null;
  customLines: {
    id: string; title: string; quantity: number; unitPrice: number; taxable: boolean; taxCode: string | null; accountingCode: string | null;
  }[];
}

export function orderExceptionsForCheckout(overrides: AgentOverride[], currency: string): OrderExceptions {
  const out: OrderExceptions = { discount: null, shipping: null, acceptedMinQuantity: null, incrementWaived: null, address: null, credit: null, orderApproval: null, customLines: [] };
  const sameCurrency = (o: AgentOverride) => o.proposed.currency.toUpperCase() === currency.toUpperCase();

  for (const o of overrides) {
    if (!USABLE.includes(o.status)) continue;

    if (o.type === "ORDER_DISCOUNT" && !out.discount && sameCurrency(o)) {
      const off = o.baseline.amount - o.proposed.amount;
      if (off > 0) out.discount = { id: o.id, amount: off / 100 };
    } else if (o.type === "SHIPPING_PRICE" && !out.shipping && sameCurrency(o)) {
      out.shipping = { id: o.id, price: o.proposed.amount / 100 };
    } else if (o.type === "QUANTITY_RULE" && o.rule === "INCREMENT") {
      if (!out.incrementWaived) out.incrementWaived = { id: o.id };
    } else if (o.type === "QUANTITY_RULE") {
      const accepted = o.proposed.amount;
      if (!out.acceptedMinQuantity || accepted < out.acceptedMinQuantity.quantity) {
        out.acceptedMinQuantity = { id: o.id, quantity: accepted };
      }
    } else if (o.type === "ADDRESS" && o.address && !out.address) {
      out.address = { id: o.id, address: o.address };
    } else if (o.type === "ORDER_APPROVAL" && !out.orderApproval && sameCurrency(o)) {
      out.orderApproval = { id: o.id, total: o.proposed.amount / 100 };
    } else if (o.type === "CREDIT_LIMIT" && !out.credit && sameCurrency(o)) {
      out.credit = { id: o.id, exposure: o.proposed.amount / 100 };
    } else if (o.type === "CUSTOM_LINE" && o.custom && sameCurrency(o)) {
      out.customLines.push({
        id: o.id,
        title: o.custom.title,
        quantity: o.custom.quantity,
        unitPrice: o.proposed.amount / 100,
        taxable: o.custom.taxable !== false,
        taxCode: o.custom.taxCode || null,
        accountingCode: o.custom.accountingCode || null,
      });
    }
  }

  return out;
}

// The ids of every exception this order uses, so they can be marked spent.
export function appliedExceptionIds(applied: Map<string, AppliedOverride>, order: OrderExceptions): string[] {
  const ids = [...applied.values()].map((o) => o.id);
  if (order.discount) ids.push(order.discount.id);
  if (order.shipping) ids.push(order.shipping.id);
  if (order.acceptedMinQuantity) ids.push(order.acceptedMinQuantity.id);
  if (order.incrementWaived) ids.push(order.incrementWaived.id);
  if (order.address) ids.push(order.address.id);
  if (order.credit) ids.push(order.credit.id);
  if (order.orderApproval) ids.push(order.orderApproval.id);
  for (const line of order.customLines) ids.push(line.id);
  return ids;
}

// The order's minimum quantity, lowered to what the agent was allowed to
// accept. A limit that isn't set stays unset.
export function relaxedMinQuantity(min: number | null | undefined, order: OrderExceptions): number | null | undefined {
  if (min == null || !order.acceptedMinQuantity) return min;
  return Math.min(min, order.acceptedMinQuantity.quantity);
}
