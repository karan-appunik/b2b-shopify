import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentSession } from "../services/agentContext.server";

const CUSTOMER_ORDERS = `#graphql
  query CustomerOrders($query: String!) {
    orders(first: 10, query: $query, sortKey: CREATED_AT, reverse: true) {
      edges {
        node {
          id
          name
          createdAt
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          lineItems(first: 50) {
            edges {
              node {
                title
                sku
                quantity
                variant {
                  id
                }
              }
            }
          }
        }
      }
    }
  }
`;

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

// Recent orders of the customer a sales agent is currently ordering for,
// with their lines, so a past order can be reordered (spec §3.5). Only
// answered while the server holds a live context for the agent; the customer
// is the context's, never one the browser names.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");

    if (!admin || !session || !loggedInCustomerId) return json({ orders: [] });

    const agentSession = await getAgentSession(session.shop, loggedInCustomerId);
    const customerGid = agentSession.customer?.shopifyCustomerId;
    if (!agentSession.active || !customerGid) return json({ orders: [] });

    const numericId = customerGid.split("/").pop();
    const response = await admin.graphql(CUSTOMER_ORDERS, {
      variables: { query: `customer_id:${numericId}` },
    });
    const body = (await response.json()) as any;

    const orders = (body.data?.orders?.edges || []).map(({ node }: any) => ({
      id: node.id,
      name: node.name,
      createdAt: node.createdAt,
      total: Number(node.totalPriceSet.shopMoney.amount),
      currency: node.totalPriceSet.shopMoney.currencyCode,
      // Lines whose product was deleted have no variant and can't be reordered.
      lines: (node.lineItems.edges || [])
        .filter(({ node: line }: any) => line.variant?.id)
        .map(({ node: line }: any) => ({
          variantId: line.variant.id.split("/").pop(),
          title: line.title,
          sku: line.sku,
          quantity: line.quantity,
        })),
    }));

    return json({ orders });
  } catch (error: any) {
    console.error("agent-orders proxy error:", error);
    return json({ orders: [] });
  }
};
