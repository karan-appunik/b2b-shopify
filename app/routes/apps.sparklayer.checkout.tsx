import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { fetchVariantPricing, pickTierPrice } from "../services/variantPricing.server";
import { getOrderLimits, checkOrderLimits } from "../services/orderLimits.server";
import { getCreditInfo, checkCreditLimit, chargeCredit } from "../services/creditLimit.server";
import { syncOrderRows, type OrderRow } from "../services/orderSync.server";

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

  try {
    const { admin, session } = await authenticate.public.appProxy(request);

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

    const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems : [];
    const currency = payload.currency || "USD";

    if (!lineItems.length) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Wholesale pricing is looked up fresh here rather than trusted from the
    // cart drawer's payload — it no longer depends on a Shopify Segment /
    // Automatic Discount having already applied to the cart (see
    // priceListPush.server.ts), so this is the single source of truth for
    // what the buyer actually pays.
    const variantGids = lineItems.map(
      (item: any) => `gid://shopify/ProductVariant/${item.variantId}`,
    );
    const pricing = await fetchVariantPricing(admin, variantGids);

    // Enforce the shopper's customer group order limits (set in the merchant
    // panel's Customer Groups > Order quantity/total limits) before a draft
    // order is ever created — quantity is the sum across every line, value
    // is what the buyer is actually about to pay after wholesale/tier pricing.
    const totalQuantity = lineItems.reduce(
      (sum: number, item: any) => sum + Number(item.quantity || 0),
      0,
    );
    const totalValue = lineItems.reduce((sum: number, item: any) => {
      const variantId = `gid://shopify/ProductVariant/${item.variantId}`;
      const variantPricing = pricing.get(variantId);
      if (!variantPricing) return sum;
      const tierPrice = pickTierPrice(variantPricing.tiers, item.quantity);
      const unitPrice =
        tierPrice != null && tierPrice < variantPricing.price ? tierPrice : variantPricing.price;
      return sum + unitPrice * Number(item.quantity || 0);
    }, 0);

    const orderLimits = await getOrderLimits(session?.shop ?? "", loggedInCustomerId);
    const limitViolation = checkOrderLimits(orderLimits, totalQuantity, totalValue, currency);
    if (limitViolation) {
      return new Response(JSON.stringify({ error: limitViolation }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    // "account" is SparkLayer's real "Payment on Account" option — its own
    // payment method, independent of Shopify's native Net Terms (Terms
    // Net 30/60 is a separate option and never credit-checked). Enforce the
    // customer's credit limit (real Shopify metafield, Customer Groups >
    // Credit settings for the enforcement toggle) before letting them buy on
    // credit, same as SparkLayer blocking "Payment on Account" once a
    // shopper is over their limit.
    if (payload.paymentMethod === "account") {
      const creditInfo = await getCreditInfo(admin, session?.shop ?? "", loggedInCustomerId);
      if (!creditInfo.onAccountEnabled) {
        return new Response(
          JSON.stringify({ error: "Payment on Account is not available for your account." }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        );
      }
      const creditViolation = checkCreditLimit(creditInfo, totalValue);
      if (creditViolation) {
        return new Response(JSON.stringify({ error: creditViolation }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    const input: Record<string, unknown> = {
      lineItems: lineItems.map((item: any) => {
        const variantId = `gid://shopify/ProductVariant/${item.variantId}`;
        const line: Record<string, unknown> = {
          variantId,
          quantity: item.quantity,
        };

        const variantPricing = pricing.get(variantId);
        if (!variantPricing) return line;

        // Override to the native price so checkout shows it struck through,
        // then apply a fixed-amount line discount to bring the total down to
        // the wholesale price — instead of silently overriding straight to
        // the net price, which would hide the discount from the buyer.
        line.priceOverride = {
          amount: variantPricing.price.toFixed(2),
          currencyCode: currency,
        };

        // Which quantity-break tier applies is decided by the quantity this
        // line is actually ordering, not just the base "1+" price.
        const tierPrice = pickTierPrice(variantPricing.tiers, item.quantity);

        if (tierPrice != null && tierPrice < variantPricing.price) {
          const discountPerUnit = Number((variantPricing.price - tierPrice).toFixed(2));
          if (discountPerUnit > 0) {
            line.appliedDiscount = {
              title: "Wholesale Discount",
              valueType: "FIXED_AMOUNT",
              value: discountPerUnit,
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

    // "account" (Payment on Account) is completed directly below without a
    // Shopify payment-terms template — it doesn't depend on the company
    // location's Net Terms setting at all, only on the customer group's own
    // "Payment on account" toggle + credit limit checked above.
    if (
      payload.paymentMethod &&
      payload.paymentMethod !== "pay_now" &&
      payload.paymentMethod !== "account" &&
      loggedInCustomerId
    ) {
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

    const response = await admin.graphql(DRAFT_ORDER_CREATE, { variables: { input } });
    const body = await response.json();

    const result = body.data?.draftOrderCreate;

    if (!result || result.userErrors?.length) {
      return new Response(
        JSON.stringify({ error: result?.userErrors?.[0]?.message || "Could not start checkout" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    if (payload.paymentMethod === "account") {
      await chargeCredit(admin, session?.shop ?? "", loggedInCustomerId, totalValue);
    }

    // "Advance before shipping" and "Payment on Account" are both paid with
    // no online payment step (offline CC/BT/ACH, or against the customer's
    // credit line), so the buyer never visits Shopify's hosted checkout —
    // complete the draft order immediately with payment marked pending and
    // hand back the finished order instead of an invoiceUrl to redirect to.
    if (payload.paymentMethod === "advance" || payload.paymentMethod === "account") {
      const completeResponse = await admin.graphql(DRAFT_ORDER_COMPLETE, {
        variables: { id: result.draftOrder.id, paymentPending: true },
      });
      const completeBody = await completeResponse.json();

      const completeResult = completeBody.data?.draftOrderComplete;
      if (!completeResult || completeResult.userErrors?.length) {
        return new Response(
          JSON.stringify({ error: completeResult?.userErrors?.[0]?.message || "Could not complete order" }),
          { status: 422, headers: { "Content-Type": "application/json" } }
        );
      }

      const order = completeResult.draftOrder.order;

      // Push straight into backend-api instead of waiting on the orders/create
      // webhook — for "advance"/"account" we already have the full order data
      // right here, so the Activity/Home dashboards can show it the instant
      // this response comes back rather than whenever the webhook lands.
      const row: OrderRow = {
        shopifyOrderId: order.id,
        name: order.name,
        orderedAt: order.createdAt,
        totalPrice: Number(order.totalPriceSet.shopMoney.amount),
        currency: order.totalPriceSet.shopMoney.currencyCode,
        financialStatus: order.displayFinancialStatus || undefined,
        fulfillmentStatus: order.displayFulfillmentStatus || undefined,
        shippingAddress: order.shippingAddress
          ? [
              order.shippingAddress.address1,
              order.shippingAddress.city,
              order.shippingAddress.provinceCode,
              order.shippingAddress.zip,
              order.shippingAddress.country,
            ]
              .filter(Boolean)
              .join(", ")
          : undefined,
        customerName: order.customer?.displayName || undefined,
        customerEmail: order.customer?.email || undefined,
        shopifyCustomerId: order.customer?.id || undefined,
      };
      await syncOrderRows([row], session?.shop ?? "");

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
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
