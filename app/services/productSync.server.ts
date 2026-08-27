import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

const PRODUCTS_QUERY = `#graphql
  query SyncProducts($cursor: String) {
    products(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          title
          handle
          featuredImage {
            url
          }
          variants(first: 100) {
            edges {
              node {
                id
                sku
                price
                title
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
        }
      }
    }
  }
`;

type ProductRow = {
  sku: string;
  name: string;
  msrp: number;
  shopifyProductId: string;
  shopifyVariantId: string;
  productTitle: string;
  productHandle: string;
  variantTitle: string;
  image: string | null;
  options: Array<{ name: string; value: string }>;
};

interface ProductsQueryResponse {
  data: {
    products: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          featuredImage: { url: string } | null;
          variants: {
            edges: Array<{
              node: {
                id: string;
                sku: string | null;
                price: string;
                title: string;
                selectedOptions: Array<{ name: string; value: string }>;
              };
            }>;
          };
        };
      }>;
    };
  };
}

export interface ShopifyProductWebhookPayload {
  id: number | string;
  title: string;
  handle?: string;
  image?: { src: string } | null;
  options?: Array<{ name: string; position: number }>;
  variants?: Array<{
    id: number | string;
    sku: string | null;
    price: string;
    title: string;
    option1?: string | null;
    option2?: string | null;
    option3?: string | null;
  }>;
}

function variantName(productTitle: string, variantTitle: string): string {
  return variantTitle && variantTitle !== "Default Title"
    ? `${productTitle} - ${variantTitle}`
    : productTitle;
}

async function fetchAllProductRows(admin: AdminApiContext): Promise<ProductRow[]> {
  const rows: ProductRow[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(PRODUCTS_QUERY, { variables: { cursor } });
    const body = (await response.json()) as ProductsQueryResponse;
    const productsConnection = body.data.products;

    for (const { node: product } of productsConnection.edges) {
      for (const { node: variant } of product.variants.edges) {
        if (!variant.sku) continue;
        rows.push({
          sku: variant.sku,
          name: variantName(product.title, variant.title),
          msrp: Number(variant.price),
          shopifyProductId: product.id,
          shopifyVariantId: variant.id,
          productTitle: product.title,
          productHandle: product.handle,
          variantTitle: variant.title,
          image: product.featuredImage?.url || null,
          options: variant.selectedOptions || [],
        });
      }
    }

    hasNextPage = productsConnection.pageInfo.hasNextPage;
    cursor = productsConnection.pageInfo.endCursor;
  }

  return rows;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function getBackendConfig(): { backendUrl: string; internalKey: string } | null {
  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_API_URL;
  // eslint-disable-next-line no-undef
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  if (!backendUrl || !internalKey) {
    console.error(
      "[productSync] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set — skipping product sync",
    );
    return null;
  }

  return { backendUrl, internalKey };
}

async function syncProductRows(rows: ProductRow[], shop: string): Promise<void> {
  if (rows.length === 0) return;

  const config = getBackendConfig();
  if (!config) return;

  for (const batch of chunk(rows, 500)) {
    const res = await fetch(`${config.backendUrl}/api/internal/products/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": config.internalKey,
      },
      body: JSON.stringify({ shop, products: batch }),
    });

    if (!res.ok) {
      console.error("[productSync] backend sync batch failed", res.status, await res.text());
    }
  }
}

async function cleanupRemovedProductsOnBackend(
  activeVariantIds: string[],
  shop: string,
): Promise<void> {
  const config = getBackendConfig();
  if (!config) return;

  const res = await fetch(`${config.backendUrl}/api/internal/products/cleanup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": config.internalKey,
    },
    body: JSON.stringify({ activeVariantIds, shop }),
  });

  if (!res.ok) {
    console.error("[productSync] backend cleanup failed", res.status, await res.text());
  }
}

export async function syncProductsToBackend(admin: AdminApiContext, shop: string): Promise<void> {
  if (!getBackendConfig()) return;

  try {
    const rows = await fetchAllProductRows(admin);

    // Sync active products
    await syncProductRows(rows, shop);

    // Clean up products in local DB that were deleted in Shopify
    const activeVariantIds = rows.map((r) => r.shopifyVariantId);
    await cleanupRemovedProductsOnBackend(activeVariantIds, shop);

    console.log(
      `[productSync] synced ${rows.length} product variant(s) and cleaned up removed products on backend-api`,
    );
  } catch (err) {
    console.error("[productSync] failed to sync products to backend-api", err);
  }
}

export async function syncProductFromWebhookPayload(
  shop: string,
  payload: ShopifyProductWebhookPayload,
): Promise<void> {
  const optionDefs = [...(payload.options || [])].sort((a, b) => a.position - b.position);

  const rows: ProductRow[] = (payload.variants || [])
    .filter((variant) => variant.sku)
    .map((variant) => {
      const optionValues = [variant.option1, variant.option2, variant.option3].filter(
        (v): v is string => Boolean(v),
      );
      const options = optionDefs
        .slice(0, optionValues.length)
        .map((def, idx) => ({ name: def.name, value: optionValues[idx] }));

      return {
        sku: variant.sku as string,
        name: variantName(payload.title, variant.title),
        msrp: Number(variant.price),
        shopifyProductId: String(payload.id),
        shopifyVariantId: String(variant.id),
        productTitle: payload.title,
        productHandle: payload.handle || "",
        variantTitle: variant.title,
        image: payload.image?.src || null,
        options,
      };
    });

  try {
    await syncProductRows(rows, shop);
    console.log(`[productSync] synced ${rows.length} variant(s) for product ${payload.id}`);
  } catch (err) {
    console.error("[productSync] failed to sync product from webhook", err);
  }
}

export async function deleteProductsByShopifyProductId(
  shopifyProductId: number | string,
  shop: string,
): Promise<void> {
  const config = getBackendConfig();
  if (!config) return;

  try {
    const res = await fetch(`${config.backendUrl}/api/internal/products/delete-by-shopify-product`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": config.internalKey,
      },
      body: JSON.stringify({ shopifyProductId: String(shopifyProductId), shop }),
    });

    if (!res.ok) {
      console.error("[productSync] backend delete failed", res.status, await res.text());
    } else {
      console.log(`[productSync] deleted products for shopify product ${shopifyProductId}`);
    }
  } catch (err) {
    console.error("[productSync] failed to delete product from webhook", err);
  }
}
