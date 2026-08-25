const WHOLESALE_PRICE_NAMESPACE = "sparklayer";
const WHOLESALE_PRICE_KEY = "wholesale_price";

const VARIANT_PRICING_QUERY = `#graphql
  query VariantPricing($ids: [ID!]!, $namespace: String!, $key: String!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        price
        metafield(namespace: $namespace, key: $key) { value }
      }
    }
  }
`;

export interface VariantPricing {
  price: number;
  wholesalePrice: number | null;
}

// Single source of truth for "what does this variant actually cost this
// customer" — reads the live native price plus the sparklayer.wholesale_price
// metafield directly from Shopify, rather than trusting any client-supplied
// price. Used by both the checkout proxy (apps.sparklayer.checkout.tsx) and
// the cart-drawer pricing proxy (apps.sparklayer.variant-pricing.tsx) so the
// mini-cart and checkout never disagree about the wholesale price.
export async function fetchVariantPricing(
  admin: any,
  variantIds: string[],
): Promise<Map<string, VariantPricing>> {
  const pricing = new Map<string, VariantPricing>();
  if (variantIds.length === 0) return pricing;

  const response = await admin.graphql(VARIANT_PRICING_QUERY, {
    variables: { ids: variantIds, namespace: WHOLESALE_PRICE_NAMESPACE, key: WHOLESALE_PRICE_KEY },
  });
  const body = await response.json();

  for (const node of body.data?.nodes || []) {
    if (!node?.id) continue;
    const wholesaleValue = node.metafield?.value;
    pricing.set(node.id, {
      price: Number(node.price),
      wholesalePrice: wholesaleValue != null ? Number(wholesaleValue) : null,
    });
  }

  return pricing;
}
