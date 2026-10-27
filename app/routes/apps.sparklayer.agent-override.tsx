import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  cancelAgentOverride,
  getAgentCart,
  getAgentOverrides,
  getAgentOverridesWithStatus,
  getAgentSession,
  requestAgentOverride,
} from "../services/agentContext.server";
import { calculateShippingLine } from "../services/shippingRate.server";
import { getOrderLimits } from "../services/orderLimits.server";
import { getCreditInfo } from "../services/creditLimit.server";
import { toMinorUnits } from "../services/agentOverrides.server";
import { fetchVariantPricing, pickTierPrice } from "../services/variantPricing.server";

const CUSTOMER_ADDRESS = `#graphql
  query OverrideCustomerAddress($id: ID!) {
    customer(id: $id) {
      defaultAddress {
        firstName
        lastName
        company
        address1
        address2
        city
        provinceCode
        zip
        countryCodeV2
        phone
      }
    }
  }
`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveShopper(request: Request) {
  const { admin, session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");

  if (!admin || !session || !loggedInCustomerId) return null;
  return { admin, shop: session.shop, loggedInCustomerId };
}

// GET: this agent's exceptions for the customer they are ordering for.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return json({ overrides: [], enabled: false });

    return json(await getAgentOverridesWithStatus(shopper.shop, shopper.loggedInCustomerId));
  } catch (error: any) {
    console.error("agent-override proxy error:", error);
    return json({ overrides: [], enabled: false }, 500);
  }
};

// POST { intent: "request", variantId, proposedPrice, reasonCode, reasonText }
//   or { intent: "cancel", id }.
//
// For a request the BASELINE is worked out here, on the server: the price the
// customer would pay for that line at its quantity, from Shopify's wholesale
// pricing and the cart saved for this customer. The browser only says what
// price it wants; it never supplies the baseline (spec §8.1, §8.4).
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return json({ code: "CONTEXT_REQUIRED", message: "Sign in again" }, 401);

    const body = await request.json().catch(() => ({}));

    if (body.intent === "cancel") {
      const result = await cancelAgentOverride(shopper.shop, shopper.loggedInCustomerId, String(body.id ?? ""));
      return json(result.body ?? {}, result.status);
    }

    if (["request_discount", "request_shipping", "request_moq", "request_custom", "request_increment", "request_address", "request_credit", "request_order_approval"].includes(body.intent)) {
      return await requestOrderException(shopper, body);
    }

    if (body.intent !== "request") return json({ message: "Unknown intent" }, 400);

    const variantId = String(body.variantId ?? "").trim();
    const proposed = toMinorUnits(body.proposedPrice);
    if (!variantId || proposed === null) {
      return json({ code: "INVALID_AMOUNT", message: "Enter the price you want, for example 42.50" }, 400);
    }

    const cart = await getAgentCart(shopper.shop, shopper.loggedInCustomerId);
    const line = cart?.items.find((item) => item.variantId === variantId);
    if (!cart || !line) {
      return json({ code: "LINE_NOT_IN_CART", message: "That item isn't in the customer's cart" }, 400);
    }

    const currency = (cart.currency || "USD").toUpperCase();
    const gid = `gid://shopify/ProductVariant/${variantId}`;
    const pricing = (await fetchVariantPricing(shopper.admin, [gid], currency)).get(gid);
    if (!pricing) return json({ code: "PRICE_UNAVAILABLE", message: "Couldn't work out the current price" }, 422);

    // What the customer pays today for this quantity.
    const tier = pickTierPrice(pricing.tiers, line.quantity);
    const baselineUnit = tier != null && tier < pricing.price ? tier : pricing.price;

    const result = await requestAgentOverride(shopper.shop, shopper.loggedInCustomerId, {
      type: "UNIT_PRICE",
      lineVariantId: variantId,
      baseline: { amount: Math.round(baselineUnit * 100), currency },
      proposed: { amount: proposed, currency },
      reasonCode: body.reasonCode,
      reasonText: body.reasonText,
    });

    return json(result.body ?? {}, result.status);
  } catch (error: any) {
    console.error("agent-override proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};

type Shopper = NonNullable<Awaited<ReturnType<typeof resolveShopper>>>;

// The other exception types (spec §8.2). As with a price, the BASELINE is
// worked out here on the server — the order's total, the calculated shipping
// rate, the group's minimum quantity — and the browser only says what it
// wants.
async function requestOrderException(shopper: Shopper, body: Record<string, any>) {
  const cart = await getAgentCart(shopper.shop, shopper.loggedInCustomerId);
  if (!cart || cart.items.length === 0) return json({ code: "CART_EMPTY", message: "The customer's cart is empty" }, 400);

  const currency = (cart.currency || "USD").toUpperCase();
  const reason = { reasonCode: body.reasonCode, reasonText: body.reasonText };
  const send = async (input: Record<string, unknown>) => {
    const result = await requestAgentOverride(shopper.shop, shopper.loggedInCustomerId, { ...input, ...reason });
    return json(result.body ?? {}, result.status);
  };

  // What the customer pays for the lines today, before any exception.
  async function cartSubtotalMinor(): Promise<number | null> {
    const gids = cart!.items.map((i) => `gid://shopify/ProductVariant/${i.variantId}`);
    const pricing = await fetchVariantPricing(shopper.admin, gids, currency);

    let subtotal = 0;
    for (const item of cart!.items) {
      const p = pricing.get(`gid://shopify/ProductVariant/${item.variantId}`);
      if (!p) return null;
      const tier = pickTierPrice(p.tiers, item.quantity);
      subtotal += Math.round((tier != null && tier < p.price ? tier : p.price) * 100) * item.quantity;
    }
    return subtotal;
  }

  if (body.intent === "request_order_approval") {
    // The order as it stands now; the approval covers exactly this cart.
    const total = await cartSubtotalMinor();
    if (total === null) return json({ code: "PRICE_UNAVAILABLE", message: "Couldn't work out the current price" }, 422);
    return send({ type: "ORDER_APPROVAL", baseline: { amount: total, currency }, proposed: { amount: total, currency } });
  }

  if (body.intent === "request_address") {
    const a = body.address ?? {};
    return send({
      type: "ADDRESS",
      address: {
        company: a.company, address1: a.address1, address2: a.address2, city: a.city,
        provinceCode: a.provinceCode, zip: a.zip, countryCode: a.countryCode, phone: a.phone,
      },
      baseline: { amount: 0, currency },
      proposed: { amount: 0, currency },
    });
  }

  if (body.intent === "request_credit") {
    const session = await getAgentSession(shopper.shop, shopper.loggedInCustomerId);
    const customerId = session.customer?.shopifyCustomerId?.split("/").pop() ?? null;
    if (!customerId) return json({ code: "CONTEXT_REQUIRED", message: "Sign in again" }, 401);

    const info = await getCreditInfo(shopper.admin, shopper.shop, customerId);
    if (info.creditLimit == null) return json({ code: "NO_RULE", message: "This customer has no credit limit to go past" }, 422);

    const total = await cartSubtotalMinor();
    if (total === null) return json({ code: "PRICE_UNAVAILABLE", message: "Couldn't work out the current price" }, 422);

    const available = Math.max(Math.round((info.creditLimit - info.balance) * 100), 0);
    if (total <= available) return json({ code: "NOT_NEEDED", message: "This order fits inside the customer's available credit" }, 422);

    return send({ type: "CREDIT_LIMIT", baseline: { amount: available, currency }, proposed: { amount: total, currency } });
  }

  if (body.intent === "request_increment") {
    const session = await getAgentSession(shopper.shop, shopper.loggedInCustomerId);
    const customerId = session.customer?.shopifyCustomerId?.split("/").pop() ?? null;
    const increment = (await getOrderLimits(shopper.shop, customerId)).quantity.increment;
    const total = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    if (!increment) return json({ code: "NO_RULE", message: "This customer has no pack size to relax" }, 422);
    if (total % increment === 0) return json({ code: "NO_RULE", message: "This order is already in whole packs" }, 422);

    return send({
      type: "QUANTITY_RULE",
      rule: "INCREMENT",
      lineVariantId: cart.items[0].variantId,
      baseline: { amount: increment, currency: "QTY" },
      proposed: { amount: total, currency: "QTY" },
    });
  }

  if (body.intent === "request_custom") {
    const price = toMinorUnits(body.price);
    const quantity = String(body.quantity ?? "").trim() === "" ? 1 : Number(body.quantity);
    if (price === null || price <= 0) return json({ code: "INVALID_AMOUNT", message: "Enter the price for one unit, for example 50.00" }, 400);
    return send({
      type: "CUSTOM_LINE",
      custom: {
        title: String(body.title ?? "").trim(),
        quantity,
        taxable: body.taxable !== false && body.taxable !== "false",
        taxCode: body.taxCode,
        accountingCode: body.accountingCode,
      },
      baseline: { amount: 0, currency },
      proposed: { amount: price, currency },
    });
  }

  if (body.intent === "request_moq") {
    const session = await getAgentSession(shopper.shop, shopper.loggedInCustomerId);
    const customerId = session.customer?.shopifyCustomerId?.split("/").pop() ?? null;
    const minimum = (await getOrderLimits(shopper.shop, customerId)).quantity.min;
    const total = cart.items.reduce((sum, item) => sum + item.quantity, 0);
    if (minimum == null) return json({ code: "NO_RULE", message: "This customer has no minimum order quantity to relax" }, 422);
    if (total >= minimum) return json({ code: "NO_RULE", message: "This order already meets the minimum quantity" }, 422);

    return send({
      type: "QUANTITY_RULE",
      lineVariantId: cart.items[0].variantId,
      baseline: { amount: minimum, currency: "QTY" },
      proposed: { amount: total, currency: "QTY" },
    });
  }

  if (body.intent === "request_discount") {
    const subtotal = await cartSubtotalMinor();
    if (subtotal === null) return json({ code: "PRICE_UNAVAILABLE", message: "Couldn't work out the current price" }, 422);

    const percent = Number(body.percent);
    const amount = body.amount !== undefined && String(body.amount).trim() !== "" ? toMinorUnits(body.amount) : null;
    let off: number | null = null;
    if (amount !== null) off = amount;
    else if (Number.isFinite(percent) && percent > 0 && percent < 100) off = Math.round((subtotal * percent) / 100);
    if (off === null || off <= 0 || off >= subtotal) {
      return json({ code: "INVALID_AMOUNT", message: "Enter a discount percent (like 5) or an amount that is less than the order total" }, 400);
    }

    return send({
      type: "ORDER_DISCOUNT",
      baseline: { amount: subtotal, currency },
      proposed: { amount: subtotal - off, currency },
    });
  }

  // request_shipping
  const proposed = toMinorUnits(body.price);
  if (proposed === null) return json({ code: "INVALID_AMOUNT", message: "Enter the shipping price you want, for example 0 for free" }, 400);

  const session = await getAgentSession(shopper.shop, shopper.loggedInCustomerId);
  if (!session.customer?.shopifyCustomerId) return json({ code: "CONTEXT_REQUIRED", message: "Sign in again" }, 401);

  const addressBody = (await (await shopper.admin.graphql(CUSTOMER_ADDRESS, { variables: { id: session.customer.shopifyCustomerId } })).json()) as any;
  const a = addressBody.data?.customer?.defaultAddress;
  const line = a?.address1 && a.countryCodeV2
    ? await calculateShippingLine(
        shopper.admin,
        shopper.shop,
        cart.items.map((i) => ({ variantId: `gid://shopify/ProductVariant/${i.variantId}`, quantity: i.quantity })),
        {
          address1: a.address1, address2: a.address2 ?? undefined, city: a.city, provinceCode: a.provinceCode ?? undefined,
          zip: a.zip, countryCode: a.countryCodeV2, firstName: a.firstName ?? undefined, lastName: a.lastName ?? undefined,
          phone: a.phone ?? undefined,
        },
      )
    : null;
  if (!line) return json({ code: "RATE_UNAVAILABLE", message: "Couldn't work out the shipping rate. The customer needs a default address." }, 422);

  return send({
    type: "SHIPPING_PRICE",
    baseline: { amount: Math.round(Number(line.price) * 100), currency },
    proposed: { amount: proposed, currency },
  });
}
