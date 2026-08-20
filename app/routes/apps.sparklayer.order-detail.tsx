import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

const ORDER_DETAIL_QUERY = `#graphql
  query OrderDetail($id: ID!) {
    order(id: $id) {
      id
      name
      displayFinancialStatus
      displayFulfillmentStatus
      customer {
        id
      }
      shippingLine {
        title
      }
      shippingAddress {
        address1
        address2
        city
        provinceCode
        zip
        country
      }
      subtotalPriceSet {
        shopMoney {
          amount
          currencyCode
        }
      }
      totalShippingPriceSet {
        shopMoney {
          amount
        }
      }
      totalTaxSet {
        shopMoney {
          amount
        }
      }
      totalPriceSet {
        shopMoney {
          amount
        }
      }
      lineItems(first: 50) {
        edges {
          node {
            title
            sku
            quantity
            image {
              url
            }
            originalUnitPriceSet {
              shopMoney {
                amount
              }
            }
            discountedUnitPriceSet {
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

// Right after "Advance before shipping" checkout, an order is always
// PENDING + UNFULFILLED — the buyer hasn't paid yet and the merchant hasn't
// shipped. Other combinations fall back to a plain, readable label rather
// than guessing at wording for states this flow doesn't currently produce.
function friendlyStatus(financial: string | null, fulfillment: string): string {
  if (financial === "PENDING" && fulfillment === "UNFULFILLED") return "Awaiting Merchant";
  if (financial === "PAID" && fulfillment === "FULFILLED") return "Complete";
  if (fulfillment === "FULFILLED") return "Shipped";
  if (financial === "PAID") return "Processing";
  return [financial, fulfillment].filter(Boolean).join(" · ");
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const orderId = url.searchParams.get("id");
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    if (!admin || !orderId || !loggedInCustomerId) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await admin.graphql(ORDER_DETAIL_QUERY, { variables: { id: orderId } });
    const body = await response.json();
    const order = body.data?.order;

    if (!order) {
      return new Response(JSON.stringify({ error: "Order not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Only let a customer view their own order.
    const orderCustomerId = order.customer?.id?.split("/").pop();
    if (orderCustomerId !== loggedInCustomerId) {
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }

    const address = order.shippingAddress;
    const shippingAddressLine = address
      ? [address.address1, address.address2, address.city, address.provinceCode, address.zip, address.country]
          .filter(Boolean)
          .join(", ")
      : null;

    const lineItems = (order.lineItems?.edges || []).map((edge: any) => ({
      title: edge.node.title,
      sku: edge.node.sku,
      quantity: edge.node.quantity,
      image: edge.node.image?.url || null,
      price: edge.node.discountedUnitPriceSet?.shopMoney?.amount,
      msrp: edge.node.originalUnitPriceSet?.shopMoney?.amount,
    }));

    return new Response(
      JSON.stringify({
        order: {
          name: order.name,
          status: friendlyStatus(order.displayFinancialStatus, order.displayFulfillmentStatus),
          // This endpoint is only reached from the "Advance before shipping"
          // flow, which never runs a real payment gateway online.
          paymentMethod: "On Account",
          shippingMethod: order.shippingLine?.title || null,
          shippingAddressLine,
          subtotal: order.subtotalPriceSet?.shopMoney?.amount,
          shipping: order.totalShippingPriceSet?.shopMoney?.amount,
          tax: order.totalTaxSet?.shopMoney?.amount,
          total: order.totalPriceSet?.shopMoney?.amount,
          lineItems,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("order-detail proxy error:", error);
    return new Response(JSON.stringify({ error: error.message || "Could not load order" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
