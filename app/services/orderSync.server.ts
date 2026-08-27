import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

const ORDERS_QUERY = `#graphql
  query SyncOrders($cursor: String) {
    orders(first: 100, after: $cursor, sortKey: CREATED_AT, reverse: true) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          name
          createdAt
          displayFinancialStatus
          displayFulfillmentStatus
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          shippingAddress {
            address1
            city
            provinceCode
            zip
            country
          }
          customer {
            id
            displayName
            email
          }
        }
      }
    }
  }
`;

export type OrderRow = {
  shopifyOrderId: string;
  name: string;
  orderedAt: string;
  totalPrice: number;
  currency: string;
  financialStatus?: string;
  fulfillmentStatus?: string;
  shippingAddress?: string;
  customerName?: string;
  customerEmail?: string;
  shopifyCustomerId?: string;
};

interface OrderNode {
  id: string;
  name: string;
  createdAt: string;
  displayFinancialStatus: string | null;
  displayFulfillmentStatus: string | null;
  totalPriceSet: { shopMoney: { amount: string; currencyCode: string } };
  shippingAddress: {
    address1: string | null;
    city: string | null;
    provinceCode: string | null;
    zip: string | null;
    country: string | null;
  } | null;
  customer: { id: string; displayName: string | null; email: string | null } | null;
}

interface OrdersQueryResponse {
  data: {
    orders: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{ node: OrderNode }>;
    };
  };
}

function formatShippingAddress(address: OrderNode["shippingAddress"]): string | undefined {
  if (!address) return undefined;
  return [address.address1, address.city, address.provinceCode, address.zip, address.country]
    .filter(Boolean)
    .join(", ");
}

function toOrderRow(node: OrderNode): OrderRow {
  return {
    shopifyOrderId: node.id,
    name: node.name,
    orderedAt: node.createdAt,
    totalPrice: Number(node.totalPriceSet.shopMoney.amount),
    currency: node.totalPriceSet.shopMoney.currencyCode,
    financialStatus: node.displayFinancialStatus || undefined,
    fulfillmentStatus: node.displayFulfillmentStatus || undefined,
    shippingAddress: formatShippingAddress(node.shippingAddress),
    customerName: node.customer?.displayName || undefined,
    customerEmail: node.customer?.email || undefined,
    shopifyCustomerId: node.customer?.id || undefined,
  };
}

// Bounded to the last 12 months — the activity dashboard only ever looks at
// short trailing windows (7/30/90 days), so there's no reason to backfill a
// shop's entire order history on every install.
async function fetchRecentOrderRows(admin: AdminApiContext): Promise<OrderRow[]> {
  const rows: OrderRow[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  const cutoff = Date.now() - 365 * 24 * 60 * 60 * 1000;

  while (hasNextPage) {
    const response = await admin.graphql(ORDERS_QUERY, { variables: { cursor } });
    const body = (await response.json()) as OrdersQueryResponse;
    const connection = body.data.orders;

    let hitCutoff = false;
    for (const { node } of connection.edges) {
      if (new Date(node.createdAt).getTime() < cutoff) {
        hitCutoff = true;
        break;
      }
      rows.push(toOrderRow(node));
    }

    hasNextPage = !hitCutoff && connection.pageInfo.hasNextPage;
    cursor = connection.pageInfo.endCursor;
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
    console.error("[orderSync] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set — skipping order sync");
    return null;
  }

  return { backendUrl, internalKey };
}

export async function syncOrderRows(rows: OrderRow[], shop: string): Promise<void> {
  if (rows.length === 0) return;

  const config = getBackendConfig();
  if (!config) return;

  for (const batch of chunk(rows, 200)) {
    const res = await fetch(`${config.backendUrl}/api/internal/orders/sync`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-api-key": config.internalKey },
      body: JSON.stringify({ shop, orders: batch }),
    });

    if (!res.ok) {
      console.error("[orderSync] backend sync batch failed", res.status, await res.text());
    }
  }
}

export async function syncOrdersToBackend(admin: AdminApiContext, shop: string): Promise<void> {
  if (!getBackendConfig()) return;

  try {
    const rows = await fetchRecentOrderRows(admin);
    await syncOrderRows(rows, shop);
    console.log(`[orderSync] synced ${rows.length} order(s) to backend-api`);
  } catch (err) {
    console.error("[orderSync] failed to sync orders to backend-api", err);
  }
}

export interface ShopifyOrderWebhookPayload {
  admin_graphql_api_id: string;
  name: string;
  created_at: string;
  total_price: string;
  currency: string;
  financial_status?: string | null;
  fulfillment_status?: string | null;
  shipping_address?: {
    address1?: string | null;
    city?: string | null;
    province_code?: string | null;
    zip?: string | null;
    country?: string | null;
  } | null;
  customer?: {
    admin_graphql_api_id?: string;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  } | null;
}

export async function syncOrderFromWebhookPayload(
  shop: string,
  payload: ShopifyOrderWebhookPayload,
): Promise<void> {
  const address = payload.shipping_address;
  const customer = payload.customer;
  const customerName = customer
    ? [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() || undefined
    : undefined;

  const row: OrderRow = {
    shopifyOrderId: payload.admin_graphql_api_id,
    name: payload.name,
    orderedAt: payload.created_at,
    totalPrice: Number(payload.total_price),
    currency: payload.currency,
    financialStatus: payload.financial_status || undefined,
    fulfillmentStatus: payload.fulfillment_status || undefined,
    shippingAddress: address
      ? [address.address1, address.city, address.province_code, address.zip, address.country]
          .filter(Boolean)
          .join(", ")
      : undefined,
    customerName,
    customerEmail: customer?.email || undefined,
    shopifyCustomerId: customer?.admin_graphql_api_id || undefined,
  };

  try {
    await syncOrderRows([row], shop);
    console.log(`[orderSync] synced order ${payload.name}`);
  } catch (err) {
    console.error("[orderSync] failed to sync order from webhook", err);
  }
}
