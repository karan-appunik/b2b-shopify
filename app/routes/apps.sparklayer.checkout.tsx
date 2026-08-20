import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import * as fs from "fs";
import * as path from "path";

const DRAFT_ORDER_CREATE = `#graphql
  mutation DraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        invoiceUrl
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const DRAFT_ORDER_COMPLETE = `#graphql
  mutation DraftOrderComplete($id: ID!, $paymentPending: Boolean) {
    draftOrderComplete(id: $id, paymentPending: $paymentPending) {
      draftOrder {
        order {
          id
          name
          statusPageUrl
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMER_PAYMENT_TERMS_TEMPLATES = `#graphql
  query CustomerPaymentTermsTemplates($customerId: ID!) {
    customer(id: $customerId) {
      companyContactProfiles {
        company {
          locations(first: 10) {
            edges {
              node {
                buyerExperienceConfiguration {
                  paymentTermsTemplate {
                    id
                    paymentTermsType
                    dueInDays
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

async function findPaymentTermsTemplateId(admin: any, customerId: string, paymentMethod: string) {
  const response = await admin.graphql(CUSTOMER_PAYMENT_TERMS_TEMPLATES, {
    variables: { customerId: `gid://shopify/Customer/${customerId}` },
  });
  const body = await response.json();
  const profiles = body.data?.customer?.companyContactProfiles || [];

  for (const profile of profiles) {
    const edges = profile.company?.locations?.edges || [];
    for (const edge of edges) {
      const template = edge.node?.buyerExperienceConfiguration?.paymentTermsTemplate;
      if (!template) continue;

      if (paymentMethod === "net30" && template.paymentTermsType === "NET") {
        return template.id;
      }
      if (
        paymentMethod === "advance" &&
        (template.paymentTermsType === "FULFILLMENT" ||
          template.paymentTermsType === "RECEIPT" ||
          template.paymentTermsType === "FIXED")
      ) {
        return template.id;
      }
    }
  }
  return null;
}

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  const logPath = "e:\\B2B\\SparkLayer\\admin-frontend\\debug.log";
  try {
    const { admin } = await authenticate.public.appProxy(request);

    if (!admin) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Present only for storefront visitors with an active customer session —
    // Shopify appends this automatically to app proxy requests. Guests check
    // out with no customerId, which draftOrderCreate allows.
    const url = new URL(request.url);
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    const payload = await request.json();
    fs.appendFileSync(logPath, `\n\n--- Checkout Action at ${new Date().toISOString()} ---\n`);
    fs.appendFileSync(logPath, `Payload: ${JSON.stringify(payload, null, 2)}\n`);

    const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems : [];
    const currency = payload.currency || "USD";

    if (!lineItems.length) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const input: Record<string, unknown> = {
      lineItems: lineItems.map((item: any) => {
        const line: Record<string, unknown> = {
          variantId: `gid://shopify/ProductVariant/${item.variantId}`,
          quantity: item.quantity,
        };
        // item.price/originalPrice are in cents, sent by the cart drawer as
        // cart.js's final_price/original_price (unit prices after and before
        // the wholesale/segment discount). We override the unit price to the
        // MSRP (originalPrice) so checkout displays it struck through, then
        // apply a fixed-amount line discount to bring the total down to the
        // wholesale price — instead of silently overriding straight to the
        // net price, which hid the discount from the buyer at checkout.
        const hasOriginal = typeof item.originalPrice === "number";
        const hasPrice = typeof item.price === "number";
        if (hasOriginal) {
          line.priceOverride = {
            amount: (item.originalPrice / 100).toFixed(2),
            currencyCode: currency,
          };
        } else if (hasPrice) {
          line.priceOverride = {
            amount: (item.price / 100).toFixed(2),
            currencyCode: currency,
          };
        }
        if (hasOriginal && hasPrice) {
          const discountCents = (item.originalPrice - item.price) * item.quantity;
          if (discountCents > 0) {
            line.appliedDiscount = {
              title: "Wholesale Discount",
              valueType: "FIXED_AMOUNT",
              value: Number((discountCents / 100).toFixed(2)),
            };
          }
        }
        return line;
      }),
    };

    if (payload.note) {
      input.note = payload.note;
    }

    if (loggedInCustomerId) {
      input.customerId = `gid://shopify/Customer/${loggedInCustomerId}`;
    }

    if (payload.shippingAddress) {
      const a = payload.shippingAddress;
      input.shippingAddress = {
        firstName: a.firstName || null,
        lastName: a.lastName || null,
        company: a.company || null,
        address1: a.address1 || null,
        address2: a.address2 || null,
        city: a.city || null,
        provinceCode: a.provinceCode || null,
        zip: a.zip || null,
        countryCode: a.countryCode || null,
        phone: a.phone || null,
      };
    }

    if (payload.paymentMethod && payload.paymentMethod !== "pay_now" && loggedInCustomerId) {
      const templateId = await findPaymentTermsTemplateId(admin, loggedInCustomerId, payload.paymentMethod);
      if (templateId) {
        const paymentTerms: Record<string, unknown> = { paymentTermsTemplateId: templateId };
        if (payload.paymentMethod === "net30") {
          paymentTerms.paymentSchedules = [{
            issuedAt: new Date().toISOString()
          }];
        }
        input.paymentTerms = paymentTerms;
      }
    }

    fs.appendFileSync(logPath, `Draft Order Input: ${JSON.stringify(input, null, 2)}\n`);

    const response = await admin.graphql(DRAFT_ORDER_CREATE, { variables: { input } });
    const body = await response.json();
    fs.appendFileSync(logPath, `Draft Order Response: ${JSON.stringify(body, null, 2)}\n`);

    const result = body.data?.draftOrderCreate;

    if (!result || result.userErrors?.length) {
      return new Response(
        JSON.stringify({ error: result?.userErrors?.[0]?.message || "Could not start checkout" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // "Advance before shipping" is paid manually offline (CC/BT/ACH), so the
    // buyer never visits Shopify's hosted checkout — complete the draft order
    // immediately with payment marked pending and hand back the finished
    // order instead of an invoiceUrl to redirect to.
    if (payload.paymentMethod === "advance") {
      const completeResponse = await admin.graphql(DRAFT_ORDER_COMPLETE, {
        variables: { id: result.draftOrder.id, paymentPending: true },
      });
      const completeBody = await completeResponse.json();
      fs.appendFileSync(logPath, `Draft Order Complete Response: ${JSON.stringify(completeBody, null, 2)}\n`);

      const completeResult = completeBody.data?.draftOrderComplete;
      if (!completeResult || completeResult.userErrors?.length) {
        return new Response(
          JSON.stringify({ error: completeResult?.userErrors?.[0]?.message || "Could not complete order" }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }

      const order = completeResult.draftOrder.order;
      return new Response(
        JSON.stringify({ order: { id: order.id, name: order.name, statusUrl: order.statusPageUrl } }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ invoiceUrl: result.draftOrder.invoiceUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("checkout proxy error:", error);
    fs.appendFileSync(logPath, `Error: ${error.stack || error.message || String(error)}\n`);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
