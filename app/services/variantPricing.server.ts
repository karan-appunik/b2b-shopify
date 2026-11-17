import {
  WHOLESALE_PRICE_NAMESPACE,
  LEGACY_PRICE_KEY,
  LEGACY_TIERS_KEY,
  currencyKeys,
  sameCurrency,
} from "./wholesaleMetafields.server";

const VARIANT_PRICING_QUERY = `#graphql
  query VariantPricing(
    $ids: [ID!]!
    $namespace: String!
    $key: String!
    $tiersKey: String!
    $legacyKey: String!
    $legacyTiersKey: String!
  ) {
    shop {
      currencyCode
      taxesIncluded
    }
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        price
        taxable
        sku
        metafield(namespace: $namespace, key: $key) { value }
        tiersMetafield: metafield(namespace: $namespace, key: $tiersKey) { value }
        legacyMetafield: metafield(namespace: $namespace, key: $legacyKey) { value }
        legacyTiersMetafield: metafield(namespace: $namespace, key: $legacyTiersKey) { value }
        product {
          tags
          vendor
        }
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
  // Whether tax applies to this item, and whether the shop's prices already
  // include it (spec §4.6 "tax basis"). Tax itself is worked out at checkout.
  taxable: boolean;
  taxesIncluded: boolean;
  // For "Advanced Requirements" (SKU/tag/vendor) discount matching.
  sku: string | null;
  tags: string[];
  vendor: string | null;
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
//
// `currency` is the shopper's cart currency. A variant can hold a different
// wholesale price per currency (wholesale_price_eur, wholesale_price_usd, ...);
// the matching one is read. The original un-suffixed keys are only used as a
// fallback when the cart is in the shop's own currency, so a EUR shopper is
// never handed a USD number. Without a currency the original keys are read
// as before.
export async function fetchVariantPricing(
  admin: any,
  variantIds: string[],
  currency?: string | null,
): Promise<Map<string, VariantPricing>> {
  const pricing = new Map<string, VariantPricing>();
  if (variantIds.length === 0) return pricing;

  const keys = currency
    ? currencyKeys(currency)
    : { priceKey: LEGACY_PRICE_KEY, tiersKey: LEGACY_TIERS_KEY };

  const response = await admin.graphql(VARIANT_PRICING_QUERY, {
    variables: {
      ids: variantIds,
      namespace: WHOLESALE_PRICE_NAMESPACE,
      key: keys.priceKey,
      tiersKey: keys.tiersKey,
      legacyKey: LEGACY_PRICE_KEY,
      legacyTiersKey: LEGACY_TIERS_KEY,
    },
  });
  const body = await response.json();

  const useLegacyFallback = !currency || sameCurrency(currency, body.data?.shop?.currencyCode);

  for (const node of body.data?.nodes || []) {
    if (!node?.id) continue;
    // Price and tiers come from the same source: the currency's own keys when
    // it has a price, otherwise the un-suffixed pair (shop currency only).
    const hasCurrencyPrice = node.metafield?.value != null;
    const wholesaleValue = hasCurrencyPrice
      ? node.metafield.value
      : useLegacyFallback
        ? node.legacyMetafield?.value
        : null;
    const rawTiers = hasCurrencyPrice
      ? node.tiersMetafield?.value
      : useLegacyFallback
        ? node.legacyTiersMetafield?.value
        : null;
    const basePrice = wholesaleValue != null ? Number(wholesaleValue) : null;
    const tiers = parseTiers(rawTiers, basePrice);

    pricing.set(node.id, {
      price: Number(node.price),
      wholesalePrice: basePrice,
      tiers,
      taxable: node.taxable !== false,
      taxesIncluded: body.data?.shop?.taxesIncluded === true,
      sku: node.sku || null,
      tags: Array.isArray(node.product?.tags) ? node.product.tags : [],
      vendor: node.product?.vendor || null,
    });
  }

  return pricing;
}
