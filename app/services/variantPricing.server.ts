const WHOLESALE_PRICE_NAMESPACE = "sparklayer";
const WHOLESALE_PRICE_KEY = "wholesale_price";
const WHOLESALE_PRICE_TIERS_KEY = "wholesale_price_tiers";

const VARIANT_PRICING_QUERY = `#graphql
  query VariantPricing($ids: [ID!]!, $namespace: String!, $key: String!, $tiersKey: String!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        price
        metafield(namespace: $namespace, key: $key) { value }
        tiersMetafield: metafield(namespace: $namespace, key: $tiersKey) { value }
      }
    }
  }
`;

export interface PriceTier {
  minQuantity: number;
  price: number;
}

export interface VariantPricing {
  price: number;
  wholesalePrice: number | null;
  tiers: PriceTier[];
}

function parseTiers(rawTiers: string | null | undefined, fallbackBasePrice: number | null): PriceTier[] {
  if (rawTiers) {
    try {
      const parsed = JSON.parse(rawTiers);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed
          .map((t) => ({ minQuantity: Number(t.minQuantity) || 1, price: Number(t.price) }))
          .filter((t) => !Number.isNaN(t.price))
          .sort((a, b) => a.minQuantity - b.minQuantity);
      }
    } catch {
      // Falls through to the single-price fallback below — covers variants
      // priced before wholesale_price_tiers existed, or a malformed value.
    }
  }

  return fallbackBasePrice != null ? [{ minQuantity: 1, price: fallbackBasePrice }] : [];
}

// Given a variant's quantity-break schedule (ascending by minQuantity) and
// the quantity actually being ordered, returns the price for the highest
// tier whose minQuantity the order still qualifies for.
export function pickTierPrice(tiers: PriceTier[], quantity: number): number | null {
  let applicable: PriceTier | null = null;
  for (const tier of tiers) {
    if (tier.minQuantity <= quantity) {
      applicable = tier;
    } else {
      break;
    }
  }
  return applicable ? applicable.price : null;
}

// Single source of truth for "what does this variant actually cost this
// customer" — reads the live native price plus the sparklayer.wholesale_price
// / wholesale_price_tiers metafields directly from Shopify, rather than
// trusting any client-supplied price. Used by both the checkout proxy
// (apps.sparklayer.checkout.tsx) and the cart-drawer pricing proxy
// (apps.sparklayer.variant-pricing.tsx) so the mini-cart and checkout never
// disagree about which price a given quantity actually gets.
export async function fetchVariantPricing(
  admin: any,
  variantIds: string[],
): Promise<Map<string, VariantPricing>> {
  const pricing = new Map<string, VariantPricing>();
  if (variantIds.length === 0) return pricing;

  const response = await admin.graphql(VARIANT_PRICING_QUERY, {
    variables: {
      ids: variantIds,
      namespace: WHOLESALE_PRICE_NAMESPACE,
      key: WHOLESALE_PRICE_KEY,
      tiersKey: WHOLESALE_PRICE_TIERS_KEY,
    },
  });
  const body = await response.json();

  for (const node of body.data?.nodes || []) {
    if (!node?.id) continue;
    const wholesaleValue = node.metafield?.value;
    const basePrice = wholesaleValue != null ? Number(wholesaleValue) : null;
    const tiers = parseTiers(node.tiersMetafield?.value, basePrice);

    pricing.set(node.id, {
      price: Number(node.price),
      wholesalePrice: basePrice,
      tiers,
    });
  }

  return pricing;
}
