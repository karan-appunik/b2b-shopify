function getBackendConfig(): { backendUrl: string; internalKey: string } | null {
  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_API_URL;
  // eslint-disable-next-line no-undef
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  if (!backendUrl || !internalKey) {
    console.error("[orderLimits] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set");
    return null;
  }

  return { backendUrl, internalKey };
}

export interface OrderLimitPair {
  min: number | null;
  max: number | null;
}

export interface TotalLimitRow extends OrderLimitPair {
  currency: string;
}

export interface OrderLimits {
  quantity: OrderLimitPair;
  // One row per currency — only the row matching the cart's own currency
  // applies (see checkOrderLimits).
  total: TotalLimitRow[];
}

const NO_LIMITS: OrderLimits = {
  quantity: { min: null, max: null },
  total: [],
};

// The order quantity/total limits set on the shopper's customer group in the
// merchant panel — same effective-settings resolution (own group, falling
// back to the base group) the merchant panel itself reads.
export async function getOrderLimits(
  shop: string,
  loggedInCustomerId: string | null,
): Promise<OrderLimits> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId) return NO_LIMITS;

  try {
    const shopifyCustomerId = `gid://shopify/Customer/${loggedInCustomerId}`;
    const res = await fetch(
      `${config.backendUrl}/api/internal/customers/order-limits?shop=${encodeURIComponent(shop)}&shopifyCustomerId=${encodeURIComponent(shopifyCustomerId)}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return NO_LIMITS;
    return (await res.json()) as OrderLimits;
  } catch (err) {
    console.error("[orderLimits] failed to fetch order limits", err);
    return NO_LIMITS;
  }
}

// Returns a human-readable reason the cart fails the given limits, or null
// if it's within range. quantity is the sum of every line's quantity; total
// is the cart's price after wholesale/tier pricing (the amount the buyer is
// actually about to pay) in `currency`, matching what the merchant
// configured against. Only the total-limit row for the cart's own currency
// applies — a USD minimum doesn't get enforced against a EUR order.
export function checkOrderLimits(
  limits: OrderLimits,
  totalQuantity: number,
  totalValue: number,
  currency: string,
): string | null {
  const { quantity, total } = limits;

  if (quantity.min != null && totalQuantity < quantity.min) {
    return `Minimum order quantity is ${quantity.min}.`;
  }
  if (quantity.max != null && totalQuantity > quantity.max) {
    return `Maximum order quantity is ${quantity.max}.`;
  }

  const totalRow = total.find((row) => row.currency === currency.toUpperCase());
  if (totalRow?.min != null && totalValue < totalRow.min) {
    return `Minimum order total is ${totalRow.min} ${currency}.`;
  }
  if (totalRow?.max != null && totalValue > totalRow.max) {
    return `Maximum order total is ${totalRow.max} ${currency}.`;
  }

  return null;
}
