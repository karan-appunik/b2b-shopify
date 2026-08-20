import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import fs from "fs";

const debugLogPath = "e:\\B2B\\SparkLayer\\admin-frontend\\debug.log";

const CUSTOMER_ORDERS_QUERY = `#graphql
  query CustomerOrders($customerId: ID!, $first: Int!, $query: String) {
    customer(id: $customerId) {
      orders(first: $first, sortKey: PROCESSED_AT, reverse: true, query: $query) {
        edges {
          node {
            id
            name
            processedAt
            displayFinancialStatus
            displayFulfillmentStatus
            totalPriceSet {
              shopMoney {
                amount
              }
            }
          }
        }
      }
    }
  }
`;

const OLDEST_ORDER_QUERY = `#graphql
  query CustomerOldestOrder($customerId: ID!) {
    customer(id: $customerId) {
      orders(first: 1, sortKey: PROCESSED_AT, reverse: false) {
        edges {
          node {
            processedAt
          }
        }
      }
    }
  }
`;

// Same mapping as apps.sparklayer.order-detail.tsx — kept local since each
// proxy route here is self-contained rather than sharing a helpers module.
function friendlyStatus(financial: string | null, fulfillment: string): string {
  if (financial === "PENDING" && fulfillment === "UNFULFILLED") return "Awaiting Merchant";
  if (financial === "PAID" && fulfillment === "FULFILLED") return "Complete";
  if (fulfillment === "FULFILLED") return "Shipped";
  if (financial === "PAID") return "Processing";
  return [financial, fulfillment].filter(Boolean).join(" · ");
}

// The Recent Activity widget groups every order into one of two buckets:
// orders still waiting on the merchant to act, and everything else that's
// already progressing through fulfillment.
function categoryForStatus(status: string): "awaiting_merchant" | "order" {
  return status === "Awaiting Merchant" ? "awaiting_merchant" : "order";
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");
    const wantYears = url.searchParams.get("list") === "1";
    const yearParam = url.searchParams.get("year");

    fs.appendFileSync(debugLogPath, `\n\n--- Orders Proxy Loader at ${new Date().toISOString()} ---\n`);
    fs.appendFileSync(debugLogPath, `admin present: ${!!admin}, loggedInCustomerId: ${loggedInCustomerId}\n`);

    if (!admin || !loggedInCustomerId) {
      return new Response(JSON.stringify({ orders: [], years: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const customerId = `gid://shopify/Customer/${loggedInCustomerId}`;

    // The full order-history view lets shoppers filter by year, so we also
    // need the range of years they actually have orders in for the dropdown.
    let years: number[] = [];
    let year = yearParam && /^\d{4}$/.test(yearParam) ? parseInt(yearParam, 10) : undefined;
    if (wantYears) {
      const oldestResponse = await admin.graphql(OLDEST_ORDER_QUERY, { variables: { customerId } });
      const oldestBody = await oldestResponse.json();
      const oldestProcessedAt = oldestBody.data?.customer?.orders?.edges?.[0]?.node?.processedAt;
      const currentYear = new Date().getFullYear();
      const oldestYear = oldestProcessedAt ? new Date(oldestProcessedAt).getFullYear() : currentYear;
      for (let y = currentYear; y >= oldestYear; y--) years.push(y);
      if (!year) year = years[0];
    }

    // The Recent Activity widget on the account dashboard filters this same
    // batch client-side by status tab, so it needs enough orders that each
    // tab has something to show rather than just the latest handful.
    const response = await admin.graphql(CUSTOMER_ORDERS_QUERY, {
      variables: {
        customerId,
        first: wantYears ? 50 : 20,
        query: year ? `processed_at:>=${year}-01-01 AND processed_at:<${year + 1}-01-01` : null,
      },
    });
    const body = await response.json();
    fs.appendFileSync(debugLogPath, `Orders Query Response: ${JSON.stringify(body, null, 2)}\n`);
    const edges = body.data?.customer?.orders?.edges || [];

    const orders = edges.map((edge: any) => {
      const status = friendlyStatus(edge.node.displayFinancialStatus, edge.node.displayFulfillmentStatus);
      return {
        id: edge.node.id,
        name: edge.node.name,
        date: edge.node.processedAt,
        status,
        category: categoryForStatus(status),
        total: edge.node.totalPriceSet?.shopMoney?.amount,
      };
    });

    const counts = {
      all: orders.length,
      awaitingMerchant: orders.filter((o: any) => o.category === "awaiting_merchant").length,
      order: orders.filter((o: any) => o.category === "order").length,
    };

    return new Response(JSON.stringify({ orders, years, counts }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("orders proxy error:", error);
    fs.appendFileSync(debugLogPath, `Orders Proxy Error: ${error.stack || error}\n`);
    return new Response(JSON.stringify({ orders: [], years: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
