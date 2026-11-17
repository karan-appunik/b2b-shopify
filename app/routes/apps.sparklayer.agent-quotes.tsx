import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  agentMay,
  agentQuoteAction,
  createAgentQuote,
  getAgentCart,
  getAgentOverrides,
  getAgentQuote,
  listAgentQuotes,
  createPaymentLink,
  revokeAgentPaymentLink,
} from "../services/agentContext.server";
import { overridesForCheckout, type AgentOverride } from "../services/agentOverrides.server";
import { fetchVariantPricing, pickTierPrice } from "../services/variantPricing.server";
import { checkOrderLimits, getOrderLimits } from "../services/orderLimits.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

const VARIANT_INFO = `#graphql
  query QuoteVariants($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        sku
        availableForSale
        product {
          title
        }
      }
    }
  }
`;

const CUSTOMER_ADDRESS = `#graphql
  query QuoteCustomerAddress($id: ID!) {
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

const DRAFT_ORDER_CREATE = `#graphql
  mutation QuoteDraftOrderCreate($input: DraftOrderInput!) {
    draftOrderCreate(input: $input) {
      draftOrder {
        id
        invoiceUrl
        totalPriceSet {
          shopMoney {
            amount
            currencyCode
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

const DRAFT_ORDER_STAMP = `#graphql
  mutation QuoteDraftOrderStamp($id: ID!, $input: DraftOrderInput!) {
    draftOrderUpdate(id: $id, input: $input) {
      draftOrder {
        id
      }
      userErrors {
        message
      }
    }
  }
`;

const DRAFT_ORDER_DELETE = `#graphql
  mutation QuoteDraftOrderDelete($input: DraftOrderDeleteInput!) {
    draftOrderDelete(input: $input) {
      deletedId
    }
  }
`;

async function resolveAgent(request: Request) {
  const { admin, session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  if (!session || !loggedInCustomerId) return null;

  return { admin, shop: session.shop, loggedInCustomerId };
}

type Agent = NonNullable<Awaited<ReturnType<typeof resolveAgent>>>;

// GET: the quotes this agent owns.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ quotes: [], enabled: false });

    const enabled = await agentMay(agent.shop, agent.loggedInCustomerId, "quote.create");
    return json({ enabled, quotes: await listAgentQuotes(agent.shop, agent.loggedInCustomerId) });
  } catch (error: any) {
    console.error("agent-quotes proxy error:", error);
    return json({ quotes: [], enabled: false }, 500);
  }
};

// Builds a quote from the cart saved for the customer the agent is ordering
// for. Titles, SKUs and prices all come from Shopify here, never from the
// browser: the baseline is the customer's wholesale price at that quantity,
// and the quoted price is an agreed exception where one is approved.
async function createFromCart(agent: Agent, body: any) {
  const cart = await getAgentCart(agent.shop, agent.loggedInCustomerId);
  if (!cart || cart.items.length === 0) {
    return json({ code: "CART_EMPTY", message: "The customer's cart is empty" }, 400);
  }

  const currency = (cart.currency || "USD").toUpperCase();
  const gids = cart.items.map((line) => `gid://shopify/ProductVariant/${line.variantId}`);

  const pricing = await fetchVariantPricing(agent.admin, gids, currency);
  const infoResponse = await agent.admin.graphql(VARIANT_INFO, { variables: { ids: gids } });
  const info = new Map<string, any>();
  for (const node of ((await infoResponse.json()) as any).data?.nodes || []) {
    if (node?.id) info.set(node.id, node);
  }

  const agreed = overridesForCheckout(
    (await getAgentOverrides(agent.shop, agent.loggedInCustomerId)) as AgentOverride[],
    cart.items,
    currency,
  );

  const items: Record<string, unknown>[] = [];
  for (const line of cart.items) {
    const gid = `gid://shopify/ProductVariant/${line.variantId}`;
    const price = pricing.get(gid);
    const variant = info.get(gid);
    if (!price || !variant) {
      return json({ code: "PRICE_UNAVAILABLE", message: "Couldn't work out the current price of an item" }, 422);
    }

    const tier = pickTierPrice(price.tiers, line.quantity);
    const baselineUnit = Math.round((tier != null && tier < price.price ? tier : price.price) * 100);
    const override = agreed.get(gid);

    items.push({
      variantId: line.variantId,
      title: [variant.product?.title, variant.title && variant.title !== "Default Title" ? variant.title : null]
        .filter(Boolean)
        .join(" — "),
      sku: variant.sku || "",
      quantity: line.quantity,
      baselineUnit,
      unitPrice: override ? Math.round(override.unitPrice * 100) : baselineUnit,
      overrideId: override?.id,
    });
  }

  const result = await createAgentQuote(agent.shop, agent.loggedInCustomerId, {
    items,
    currency,
    validDays: body.validDays ? Number(body.validDays) : undefined,
    notes: body.notes,
    internalNotes: body.internalNotes,
  });

  return json(result.body ?? {}, result.status);
}

// Turns an accepted quote into a Shopify draft order at the quoted prices.
// Before anything is created the order is checked again (spec §3.3: inventory,
// limits, permission) — acceptance doesn't switch those checks off.
async function convertToOrder(agent: Agent, id: string) {
  if (!(await agentMay(agent.shop, agent.loggedInCustomerId, "order.submit"))) {
    return json({ code: "PERMISSION_DENIED", message: "Your role can't place orders" }, 403);
  }
  // The customer pays through a secure link, never on the agent's screen.
  if (!(await agentMay(agent.shop, agent.loggedInCustomerId, "payment_link.send"))) {
    return json({ code: "PERMISSION_DENIED", message: "Your role can't send payment links" }, 403);
  }

  const found = await getAgentQuote(agent.shop, agent.loggedInCustomerId, id);
  const quote = found.body;
  if (found.status !== 200 || !quote) return json({ code: "NOT_FOUND", message: "Quote not found" }, 404);
  if (quote.status !== "ACCEPTED") {
    return json({ code: "NOT_ACCEPTED", message: "Only an accepted quote can become an order" }, 409);
  }
  if (!quote.customerShopifyId) {
    return json({ code: "ACCOUNT_NOT_ELIGIBLE", message: "This customer can't be ordered for" }, 422);
  }

  const gids = quote.items.map((i: any) => `gid://shopify/ProductVariant/${i.variantId}`);
  const infoResponse = await agent.admin.graphql(VARIANT_INFO, { variables: { ids: gids } });
  const unavailable = (((await infoResponse.json()) as any).data?.nodes || [])
    .filter((n: any) => !n || n.availableForSale === false)
    .length;
  if (unavailable > 0) {
    return json(
      { code: "INVENTORY_UNAVAILABLE", message: "Some items on this quote are no longer available. Revise the quote." },
      422,
    );
  }

  const totalQuantity = quote.items.reduce((sum: number, i: any) => sum + i.quantity, 0);
  const totalValue = quote.totals.subtotal / 100;
  const numericCustomerId = String(quote.customerShopifyId).split("/").pop() as string;
  const violation = checkOrderLimits(await getOrderLimits(agent.shop, numericCustomerId), totalQuantity, totalValue, quote.currency);
  if (violation) return json({ code: "ORDER_LIMIT", message: violation }, 422);

  const addressResponse = await agent.admin.graphql(CUSTOMER_ADDRESS, { variables: { id: quote.customerShopifyId } });
  const address = ((await addressResponse.json()) as any).data?.customer?.defaultAddress;

  const input: Record<string, unknown> = {
    customerId: quote.customerShopifyId,
    note: `From quote ${quote.number}`,
    lineItems: quote.items.map((i: any) => ({
      variantId: `gid://shopify/ProductVariant/${i.variantId}`,
      quantity: i.quantity,
      priceOverride: { amount: (i.unitPrice / 100).toFixed(2), currencyCode: quote.currency },
    })),
    customAttributes: [
      { key: "_sparklayer_agent_id", value: `gid://shopify/Customer/${agent.loggedInCustomerId}` },
      { key: "_sparklayer_quote_id", value: String(quote.id) },
      { key: "_sparklayer_quote_number", value: String(quote.number) },
    ],
  };

  if (address?.address1 && address.countryCodeV2) {
    input.shippingAddress = {
      firstName: address.firstName,
      lastName: address.lastName,
      company: address.company,
      address1: address.address1,
      address2: address.address2,
      city: address.city,
      provinceCode: address.provinceCode,
      zip: address.zip,
      countryCode: address.countryCodeV2,
      phone: address.phone,
    };
  }

  const created = ((await (await agent.admin.graphql(DRAFT_ORDER_CREATE, { variables: { input } })).json()) as any).data
    ?.draftOrderCreate;
  if (!created?.draftOrder || created.userErrors?.length) {
    return json({ code: "ORDER_FAILED", message: created?.userErrors?.[0]?.message || "Could not create the order" }, 422);
  }

  const money = created.draftOrder.totalPriceSet?.shopMoney;
  const link = await createPaymentLink(agent.shop, agent.loggedInCustomerId, {
    customerShopifyId: quote.customerShopifyId,
    draftOrderId: created.draftOrder.id,
    invoiceUrl: created.draftOrder.invoiceUrl,
    amount: Math.round(Number(money?.amount ?? 0) * 100),
    currency: money?.currencyCode || quote.currency,
    quoteId: String(quote.id),
  });
  if (link.status !== 201) {
    await agent.admin.graphql(DRAFT_ORDER_DELETE, { variables: { input: { id: created.draftOrder.id } } });
    return json({ code: link.body?.code, message: link.body?.message || "Could not send the payment link" }, link.status === 500 ? 502 : link.status);
  }

  const marked = await agentQuoteAction(agent.shop, agent.loggedInCustomerId, id, "converted", {
    orderId: created.draftOrder.id,
  });

  if (marked.status !== 200) {
    // The quote couldn't be marked (someone converted it first): don't leave a
    // second order, or a way to pay for it, behind.
    await revokeAgentPaymentLink(agent.shop, agent.loggedInCustomerId, link.body.id);
    await agent.admin.graphql(DRAFT_ORDER_DELETE, { variables: { input: { id: created.draftOrder.id } } });
    return json(marked.body ?? { message: "Could not convert this quote" }, marked.status);
  }

  // The link's token rides on the order created once it is paid, which is how
  // the payment is matched back to the link.
  try {
    await agent.admin.graphql(DRAFT_ORDER_STAMP, {
      variables: {
        id: created.draftOrder.id,
        input: {
          customAttributes: [
            ...(input.customAttributes as Array<{ key: string; value: string }>),
            { key: "_sparklayer_payment_link", value: link.body.token },
          ],
        },
      },
    });
  } catch (err) {
    console.error("[agent-quotes] could not stamp payment link on the draft order", err);
  }

  return json({
    quote: marked.body,
    draftOrderId: created.draftOrder.id,
    paymentLinkSent: { id: link.body.id, sentTo: link.body.emailMasked, amount: link.body.amount, currency: link.body.currency },
  });
}

const SIMPLE_ACTIONS = ["send", "submit", "withdraw", "revise", "duplicate"];

// POST { intent: "create", notes?, validDays? } | { intent: "convert", id } |
//      { intent: "send" | "submit" | "withdraw" | "revise" | "duplicate", id }
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ code: "CONTEXT_REQUIRED", message: "Sign in again" }, 401);

    const body = await request.json().catch(() => ({}));
    const id = String(body.id ?? "");

    if (body.intent === "create") return await createFromCart(agent, body);
    if (body.intent === "convert") return await convertToOrder(agent, id);

    if (SIMPLE_ACTIONS.includes(body.intent)) {
      const result = await agentQuoteAction(agent.shop, agent.loggedInCustomerId, id, body.intent);
      return json(result.body ?? {}, result.status);
    }

    return json({ message: "Unknown intent" }, 400);
  } catch (error: any) {
    console.error("agent-quotes proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
