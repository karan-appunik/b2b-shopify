import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { fetchVariantPricing, pickTierPrice } from "../services/variantPricing.server";
import { getOrderLimits, checkOrderLimits } from "../services/orderLimits.server";
import { getCreditInfo, checkCreditLimit, chargeCredit } from "../services/creditLimit.server";
import { getActiveDiscounts, resolveDiscount, resolveShippingDiscount, resolveFreeProductDiscount, resolveLineItemDiscount, resolveAdvancedRewards, validateAndSplitCoupons, lineMatchesCondition, discountAmount, resolveFreeProductAward, resolveAdvancedFreeProductGroups, resolveFreeProductGroupAward, type Discount } from "../services/discountLookup.server";
import { syncOrderRows, type OrderRow } from "../services/orderSync.server";
import { calculateShippingLine } from "../services/shippingRate.server";
import {
  resolveOrderActor,
  authorizeOnBehalf,
  getAgentOverrides,
  markOverridesApplied,
  createPaymentLink,
  getModuleSettings,
  reportOrderFailure,
} from "../services/agentContext.server";
import { checkStock, describeIssues, type StockVariant } from "../services/stockCheck.server";
import { comparePrices, describeChanges } from "../services/priceChange.server";
import {
  overridesForCheckout,
  orderExceptionsForCheckout,
  appliedExceptionIds,
  relaxedMinQuantity,
  type OrderExceptions,
  pendingOverrides,
  effectiveUnitPrice,
  type AgentOverride,
  type AppliedOverride,
} from "../services/agentOverrides.server";
import { beginOperation, completeOperation, releaseOperation } from "../services/idempotency.server";

const DRAFT_ORDER_CREATE = `#graphql
  mutation DraftOrderCreate($input: DraftOrderInput!) {
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
  mutation DraftOrderStamp($id: ID!, $input: DraftOrderInput!) {
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

const STOCK_QUERY = `#graphql
  query StockCheck($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        title
        sku
        inventoryQuantity
        inventoryPolicy
        product {
          title
        }
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

const handleCheckout = async ({ request }: ActionFunctionArgs) => {
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

    // A sales agent can order for a customer they've entered a context for.
    // Everything below that is customer-specific (order limits, credit,
    // discounts, payment terms, the draft order's owner) uses the customer
    // the order is really for; the agent stays on record as the actor.
    const actor = await resolveOrderActor(session?.shop ?? "", loggedInCustomerId, payload.agentContextId);
    if (actor.kind === "error") {
      return new Response(JSON.stringify({ error: actor.message, code: actor.code }), {
        status: 409,
        headers: { "Content-Type": "application/json" },
      });
    }
    const orderCustomerId = actor.kind === "on_behalf" ? actor.customerId : loggedInCustomerId;

    // Placing an order for a customer needs the order.submit permission on
    // the agent's role (a quote-only role, for instance, doesn't have it).
    if (actor.kind === "on_behalf" && loggedInCustomerId) {
      const permission = await authorizeOnBehalf(session?.shop ?? "", loggedInCustomerId, "order.submit");
      if (!permission.allowed) {
        const pending = permission.reason === "ACCOUNT_PENDING_APPROVAL";
        if (permission.reason === "CONTEXT_STALE") {
          return new Response(
            JSON.stringify({
              error: "Your access changed since you started this order. Use Refresh in the Agent Mode bar, then try again.",
              code: "CONTEXT_STALE",
            }),
            { status: 409, headers: { "Content-Type": "application/json" } },
          );
        }
        return new Response(
          JSON.stringify({
            error: pending
              ? "This new customer is waiting for approval. Orders can be placed once the account is approved."
              : "Your role does not allow placing orders for customers.",
            code: pending ? "ACCOUNT_PENDING_APPROVAL" : "PERMISSION_DENIED",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // An agent never takes a card: orders paid online go to the customer as a
    // secure payment link, which needs its own permission.
    const paysOnline = payload.paymentMethod !== "advance" && payload.paymentMethod !== "account";
    if (actor.kind === "on_behalf" && loggedInCustomerId && paysOnline) {
      const permission = await authorizeOnBehalf(session?.shop ?? "", loggedInCustomerId, "payment_link.send");
      if (!permission.allowed && permission.unavailable) {
        return new Response(
          JSON.stringify({ error: "We couldn't check your permissions just now. Please try again in a moment.", code: "TEMPORARILY_UNAVAILABLE" }),
          { status: 503, headers: { "Content-Type": "application/json" } },
        );
      }
      if (!permission.allowed) {
        return new Response(
          JSON.stringify({
            error: "Your role can't send payment links, so this order can't be paid online. Choose another payment method or ask a manager.",
            code: "PERMISSION_DENIED",
          }),
          { status: 403, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // An approval-first role can't place an order until a manager has agreed
    // to this exact order (checked below, once the total is known).
    let needsOrderApproval = false;
    if (actor.kind === "on_behalf" && loggedInCustomerId) {
      const mode = await authorizeOnBehalf(session?.shop ?? "", loggedInCustomerId, "order.submit");
      needsOrderApproval = mode.allowed && mode.constraints?.mode === "approval_first";
    }

    const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems : [];
    const currency = payload.currency || "USD";

    if (!lineItems.length) {
      return new Response(JSON.stringify({ error: "Cart is empty" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Exceptions (agreed price changes) the agent has for this customer's
    // order. Checkout is held while one is still waiting for approval; the
    // approved ones replace the line's price below.
    let appliedOverrides = new Map<string, AppliedOverride>();
    let orderExceptions: OrderExceptions = { discount: null, shipping: null, acceptedMinQuantity: null, incrementWaived: null, address: null, credit: null, orderApproval: null, customLines: [] };
    if (actor.kind === "on_behalf" && loggedInCustomerId) {
      const agentOverrides = (await getAgentOverrides(session?.shop ?? "", loggedInCustomerId)) as AgentOverride[];

      if (pendingOverrides(agentOverrides).length > 0) {
        return new Response(
          JSON.stringify({
            error: "Something is still waiting for approval. It has to be approved or withdrawn before checkout.",
            code: "APPROVAL_REQUIRED",
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        );
      }

      appliedOverrides = overridesForCheckout(agentOverrides, lineItems, currency);
      orderExceptions = orderExceptionsForCheckout(agentOverrides, currency);
    }

    // Wholesale pricing is looked up fresh here rather than trusted from the
    // cart drawer's payload — it no longer depends on a Shopify Segment /
    // Automatic Discount having already applied to the cart (see
    // priceListPush.server.ts), so this is the single source of truth for
    // what the buyer actually pays.
    const variantGids = lineItems.map(
      (item: any) => `gid://shopify/ProductVariant/${item.variantId}`,
    );
    const pricing = await fetchVariantPricing(admin, variantGids, currency);

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
      const unitPrice = effectiveUnitPrice(
        variantId,
        tierPrice != null && tierPrice < variantPricing.price ? tierPrice : variantPricing.price,
        appliedOverrides,
      );
      return sum + unitPrice * Number(item.quantity || 0);
    }, 0);

    if (needsOrderApproval) {
      const approved = orderExceptions.orderApproval && Math.round(totalValue * 100) <= Math.round(orderExceptions.orderApproval.total * 100) + 1;
      if (!approved) {
        return new Response(
          JSON.stringify({
            error: "A manager has to approve this order before it can be placed. Ask for approval, then come back here.",
            code: "ORDER_APPROVAL_REQUIRED",
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    const orderLimits = await getOrderLimits(session?.shop ?? "", orderCustomerId);
    // An approved quantity-rule exception lowers the minimum for this order.
    const effectiveLimits = {
      ...orderLimits,
      quantity: { ...orderLimits.quantity, min: relaxedMinQuantity(orderLimits.quantity.min, orderExceptions) ?? null },
    };
    const limitViolation = checkOrderLimits(effectiveLimits, totalQuantity, totalValue, currency, {
      waiveIncrement: !!orderExceptions.incrementWaived,
    });
    if (limitViolation) {
      return new Response(JSON.stringify({ error: limitViolation }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Stock (spec §9.5, AC11) is checked again for an agent's order. Not enough
    // of something that can't be sold past zero blocks it; an item that can be
    // backordered goes ahead only once the agent has said they know.
    if (actor.kind === "on_behalf") {
      const stockResponse = await admin.graphql(STOCK_QUERY, { variables: { ids: variantGids } });
      const nodes = (((await stockResponse.json()) as any).data?.nodes ?? []).filter(Boolean);
      const variants: StockVariant[] = nodes.map((n: any) => ({
        id: n.id,
        title: [n.product?.title, n.title !== "Default Title" ? n.title : null].filter(Boolean).join(" - "),
        sku: n.sku ?? null,
        inventoryQuantity: n.inventoryQuantity ?? null,
        inventoryPolicy: n.inventoryPolicy ?? null,
      }));
      const stock = checkStock(lineItems, variants);

      if (stock.unavailable.length) {
        return new Response(
          JSON.stringify({
            error: `Not enough stock: ${describeIssues(stock.unavailable)}. Lower the quantity or remove the item.`,
            code: "INVENTORY_UNAVAILABLE",
            lines: stock.unavailable,
          }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        );
      }
      if (stock.backordered.length && payload.confirmBackorder !== true) {
        return new Response(
          JSON.stringify({
            error: `Some items are not all in stock and would be backordered: ${describeIssues(stock.backordered)}.`,
            code: "BACKORDER_CONFIRM",
            lines: stock.backordered,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    // Up to 4 discounts stack per order, up to 3 of them customer-entered
    // coupon codes (Pricing > Discounts in the merchant panel) — every
    // requested code must actually qualify, or checkout fails with a clear
    // error; automatic discounts fill any remaining slots. A discount's
    // reward can target either the order subtotal or the shipping cost, so
    // validated coupons are split by that before resolving each separately.
    const itemInfo = {
      totalQuantity,
      uniqueItemCount: lineItems.length,
      lines: lineItems.map((item: any) => {
        const variantId = `gid://shopify/ProductVariant/${item.variantId}`;
        const variantPricing = pricing.get(variantId);
        // price/quantity are only read for an "Advanced requirements and
        // rewards" cart_lines reward's own amount (see
        // resolveAdvancedRewards) — every other eligibility/matching check
        // only needs sku/tags/vendor.
        const tierPrice = variantPricing ? pickTierPrice(variantPricing.tiers, item.quantity) : null;
        const unitPrice = variantPricing
          ? effectiveUnitPrice(
              variantId,
              tierPrice != null && tierPrice < variantPricing.price ? tierPrice : variantPricing.price,
              appliedOverrides,
            )
          : 0;
        return {
          sku: variantPricing?.sku ?? null,
          tags: variantPricing?.tags ?? [],
          vendor: variantPricing?.vendor ?? null,
          price: unitPrice,
          quantity: Number(item.quantity || 0),
        };
      }),
    };
    // The price the agent saw is checked against the price now (spec §7.5
    // PRICE_CHANGED). If a line moved, the old and new totals are shown and the
    // agent has to confirm before the order goes ahead.
    if (actor.kind === "on_behalf" && payload.confirmPriceChange !== true) {
      const check = comparePrices(
        lineItems.map((l: any) => ({ variantId: l.variantId, quantity: l.quantity, expectedUnit: l.expectedUnit })),
        lineItems.map((l: any, i: number) => {
          const vp = pricing.get(`gid://shopify/ProductVariant/${l.variantId}`);
          return { variantId: l.variantId, title: String(l.title || vp?.sku || `Variant ${l.variantId}`), sku: vp?.sku ?? null, unit: vp ? itemInfo.lines[i].price : null };
        }),
      );
      if (check.changes.length) {
        return new Response(
          JSON.stringify({
            error: `The price changed since you added these items: ${describeChanges(check, currency)}.`,
            code: "PRICE_CHANGED",
            changes: check.changes,
            oldTotal: check.oldTotal,
            newTotal: check.newTotal,
          }),
          { status: 409, headers: { "Content-Type": "application/json" } },
        );
      }
    }

    const couponCodes: string[] = Array.isArray(payload.couponCodes) ? payload.couponCodes : [];
    const shopifyCustomerGid = orderCustomerId ? `gid://shopify/Customer/${orderCustomerId}` : null;
    const activeDiscounts = await getActiveDiscounts(session?.shop ?? "", couponCodes, shopifyCustomerGid);
    const splitCoupons = validateAndSplitCoupons(activeDiscounts, couponCodes, totalValue, currency, itemInfo);
    if ("error" in splitCoupons) {
      return new Response(JSON.stringify({ error: splitCoupons.error }), {
        status: 422,
        headers: { "Content-Type": "application/json" },
      });
    }
    // docs.sparklayer.io/discounts "Advanced Requirements and Rewards" —
    // resolved once up front (shippingAmount unknown yet, so shipping
    // rewards get a placeholder 0 here — real shipping candidates are
    // re-resolved below once the shipping cost is known, see the
    // advance/account block) so its subtotal/cart_lines rewards can be fed
    // into the existing simple-discount resolvers as extra candidates.
    const advancedRewards = resolveAdvancedRewards(
      activeDiscounts,
      splitCoupons.advancedCoupons,
      totalValue,
      0,
      currency,
      itemInfo,
    );
    const resolvedDiscount = resolveDiscount(
      activeDiscounts,
      splitCoupons.orderCoupons,
      totalValue,
      currency,
      itemInfo,
      advancedRewards.subtotalCandidates,
    );
    const resolvedFreeProduct = resolveFreeProductDiscount(
      activeDiscounts,
      splitCoupons.freeProductCoupons,
      totalValue,
      currency,
      itemInfo,
    );
    // docs.sparklayer.io/discounts "Advanced Free Products" — independent of
    // the simple free_product reward above (mutually exclusive discount
    // modes, so at most one of the two ever actually awards anything).
    const resolvedAdvancedFreeProductGroup = resolveAdvancedFreeProductGroups(
      activeDiscounts,
      splitCoupons.advancedFreeProductCoupons,
      totalValue,
      currency,
      itemInfo,
    );
    const resolvedLineItemDiscount = resolveLineItemDiscount(
      activeDiscounts,
      splitCoupons.lineItemCoupons,
      totalValue,
      currency,
      itemInfo,
      advancedRewards.cartLinesCandidates,
    );

    // "account" is SparkLayer's real "Payment on Account" option — its own
    // payment method, independent of Shopify's native Net Terms (Terms
    // Net 30/60 is a separate option and never credit-checked). Enforce the
    // customer's credit limit (real Shopify metafield, Customer Groups >
    // Credit settings for the enforcement toggle) before letting them buy on
    // credit, same as SparkLayer blocking "Payment on Account" once a
    // shopper is over their limit.
    if (payload.paymentMethod === "account") {
      const creditInfo = await getCreditInfo(admin, session?.shop ?? "", orderCustomerId);
      if (!creditInfo.onAccountEnabled) {
        return new Response(
          JSON.stringify({ error: "Payment on Account is not available for your account." }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        );
      }
      // An approved credit exception lets this order go as far as it was approved for.
      const creditApproved = orderExceptions.credit && totalValue <= orderExceptions.credit.exposure + 0.005;
      const creditViolation = creditApproved ? null : checkCreditLimit(creditInfo, totalValue);
      if (creditViolation) {
        return new Response(JSON.stringify({ error: creditViolation, code: "CREDIT_LIMIT_EXCEEDED" }), {
          status: 422,
          headers: { "Content-Type": "application/json" },
        });
      }
    }

    // docs.sparklayer.io/discounts "Give a Percentage Off Products" (simple
    // mode, matched against a flat lineItemSkus list) and "Advanced
    // Requirements and Rewards" cart_lines reward (matched via lineItemMatch,
    // an attribute/operator condition against sku/tag/vendor) — independent
    // of the order/shipping/free-product discounts resolved above.
    // eslint-disable-next-line no-inner-declarations
    function matchesResolvedLineItemDiscount(discount: Discount, variantPricing: { sku: string | null; tags: string[]; vendor: string | null } | undefined): boolean {
      if (discount.lineItemMatch) {
        return lineMatchesCondition(discount.lineItemMatch, {
          sku: variantPricing?.sku ?? null,
          tags: variantPricing?.tags ?? [],
          vendor: variantPricing?.vendor ?? null,
          price: 0,
          quantity: 0,
        });
      }
      const skus = new Set((discount.lineItemSkus || []).map((s) => s.toLowerCase()));
      return !!variantPricing?.sku && skus.has(variantPricing.sku.toLowerCase());
    }

    const orderLineItems: Record<string, unknown>[] = lineItems.map((item: any) => {
      const variantId = `gid://shopify/ProductVariant/${item.variantId}`;
      const line: Record<string, unknown> = {
        variantId,
        quantity: item.quantity,
      };

      const variantPricing = pricing.get(variantId);
      if (!variantPricing) return line;

      // Which quantity-break tier applies is decided by the quantity this
      // line is actually ordering, not just the base "1+" price.
      const tierPrice = pickTierPrice(variantPricing.tiers, item.quantity);
      let unitPrice =
        tierPrice != null && tierPrice < variantPricing.price ? tierPrice : variantPricing.price;

      // The percentage/fixed-off-products reward comes off whatever this
      // line already charges (wholesale tier price included). Simple mode is
      // always "percentage" (docs.sparklayer.io/discounts "Give a Percentage
      // Off Products"); an advanced cart_lines reward can also be "fixed" —
      // applied against this line's own total, same convention as the
      // order-level "Give an amount off an order" reward.
      if (resolvedLineItemDiscount && matchesResolvedLineItemDiscount(resolvedLineItemDiscount.discount, variantPricing)) {
        const reward = resolvedLineItemDiscount.discount;
        if (reward.valueType === "fixed") {
          const lineTotal = unitPrice * item.quantity;
          const discountedLineTotal = Math.max(lineTotal - reward.value, 0);
          unitPrice = item.quantity > 0 ? discountedLineTotal / item.quantity : unitPrice;
        } else {
          unitPrice = unitPrice * (1 - reward.value / 100);
        }
      }

      // An agreed exception replaces the computed price outright.
      const agentOverride = appliedOverrides.get(variantId);
      if (agentOverride) unitPrice = agentOverride.unitPrice;

      // originalUnitPrice + a line appliedDiscount used to be how this set
      // the wholesale price, but originalUnitPrice is a dead field for
      // variant-based lines on Admin API 2025-10 (confirmed via schema
      // introspection — it no longer even appears on
      // DraftOrderLineItemInput for these, so Shopify silently ignored it
      // while still applying the discount, undercharging the line).
      // priceOverride is the current mechanism: it sets the actual charged
      // unit price directly, so the buyer is billed exactly the tier price
      // with no drift from what totalValue (below) assumes.
      if (unitPrice < variantPricing.price || agentOverride) {
        line.priceOverride = { amount: unitPrice.toFixed(2), currencyCode: currency };
      }

      // A line-level appliedDiscount alongside priceOverride was tried to
      // show a discount label, but confirmed live that Shopify applies it
      // as a SECOND reduction on top of priceOverride (e.g. $50 ->
      // priceOverride $40 -> appliedDiscount takes another 20% off that,
      // landing on $32) — an undercharge bug, not cosmetic. Do not
      // reintroduce appliedDiscount here without a different mechanism
      // (e.g. reducing priceOverride further to net out the exact intended
      // final price, or finding a genuinely display-only field).

      return line;
    });

    // docs.sparklayer.io/discounts "Advanced Free Products" — the giveaway
    // is added as its own line, priced to $0 with priceOverride, rather than
    // as a discount on an existing line (the free item may not even be in
    // the buyer's cart).
    if (resolvedFreeProduct) {
      const freeProduct = resolvedFreeProduct.discount.freeProduct;
      if (freeProduct) {
        // freeProduct.shopifyVariantId is already a full GID (cached as-is
        // from Product.shopifyVariantId, which is synced from Shopify in
        // that form) — unlike the numeric ids in the cart payload elsewhere
        // in this file, it must not be re-prefixed.
        orderLineItems.push({
          variantId: freeProduct.shopifyVariantId,
          quantity: resolveFreeProductAward(resolvedFreeProduct.discount, itemInfo),
          priceOverride: { amount: "0.00", currencyCode: currency },
        });
      }
    }

    // docs.sparklayer.io/discounts "Advanced Free Products" — same $0
    // giveaway-line treatment as the simple reward above, but potentially
    // several products at once (BOGO-style) from a single matched group.
    if (resolvedAdvancedFreeProductGroup) {
      const awards = resolveFreeProductGroupAward(
        resolvedAdvancedFreeProductGroup.discount,
        resolvedAdvancedFreeProductGroup.group,
        itemInfo,
      );
      for (const award of awards) {
        orderLineItems.push({
          variantId: award.shopifyVariantId,
          quantity: award.quantity,
          priceOverride: { amount: "0.00", currencyCode: currency },
        });
      }
    }

    // Custom lines the agent was approved to add (spec §8.2).
    for (const line of orderExceptions.customLines) {
      orderLineItems.push({
        title: line.title,
        quantity: line.quantity,
        originalUnitPriceWithCurrency: { amount: line.unitPrice.toFixed(2), currencyCode: currency },
        requiresShipping: false,
        taxable: line.taxable,
        customAttributes: [
          ...(line.taxCode ? [{ key: "Tax code", value: line.taxCode }] : []),
          ...(line.accountingCode ? [{ key: "Accounting code", value: line.accountingCode }] : []),
        ],
      });
    }

    const input: Record<string, unknown> = {
      lineItems: orderLineItems,
    };

    if (resolvedDiscount && "discounts" in resolvedDiscount && resolvedDiscount.amount > 0) {
      const { discounts, amount } = resolvedDiscount;
      // Shopify's draft order API only accepts one order-level discount, so
      // stacked discounts are combined into a single fixed-amount line whose
      // title names every discount that contributed to it.
      const title = discounts.map((d) => d.publicName || d.name).join(" + ");
      input.appliedDiscount = {
        title,
        valueType: "FIXED_AMOUNT",
        value: Number(amount.toFixed(2)),
      };
    }

    // An approved order discount comes off as one fixed amount. Shopify takes a
    // single order-level discount, so it is added to any the rules gave.
    if (orderExceptions.discount) {
      const existing = input.appliedDiscount as { title: string; value: number } | undefined;
      const extra = Math.min(orderExceptions.discount.amount, Math.max(totalValue - (existing?.value ?? 0), 0));
      if (extra > 0) {
        input.appliedDiscount = {
          title: existing ? existing.title + " + Agreed discount" : "Agreed discount",
          valueType: "FIXED_AMOUNT",
          value: Number(((existing?.value ?? 0) + extra).toFixed(2)),
        };
      }
    }

    if (payload.note) {
      input.note = payload.note;
    }

    if (orderCustomerId) {
      input.customerId = `gid://shopify/Customer/${orderCustomerId}`;
    }

    // An approved one-off address replaces the chosen one for this order only;
    // nothing is added to the customer's address book.
    if (orderExceptions.address) {
      const o = orderExceptions.address.address;
      payload.shippingAddress = {
        ...(payload.shippingAddress ?? {}),
        company: o.company || undefined,
        address1: o.address1,
        address2: o.address2 || undefined,
        city: o.city,
        provinceCode: o.provinceCode || undefined,
        zip: o.zip,
        countryCode: o.countryCode,
        phone: o.phone || undefined,
      };
    }

    if (payload.shippingAddress) {
      const a = payload.shippingAddress;
      const addr: Record<string, string> = {};
      if (a.firstName) addr.firstName = a.firstName;
      if (a.lastName) addr.lastName = a.lastName;
      if (a.company) addr.company = a.company;
      if (a.address1) addr.address1 = a.address1;
      if (a.address2) addr.address2 = a.address2;
      if (a.city) addr.city = a.city;
      if (a.provinceCode) addr.provinceCode = a.provinceCode;
      if (a.zip) addr.zip = a.zip;
      if (a.countryCode) addr.countryCode = a.countryCode;
      if (a.phone) addr.phone = a.phone;
      if (Object.keys(addr).length > 0) {
        input.shippingAddress = addr;
      }
    }

    // Tracked so a successful order can record its redemption for
    // usage-limit counting further down, after the shipping-discount block
    // (which only runs for advance/account) goes out of scope.
    let appliedShippingDiscountId: string | null = null;
    // Tracked alongside the id above (also needed after this scope closes)
    // purely for redemption analytics — see recordDiscountRedemptions meta.
    let appliedShippingDiscountAmount: number | null = null;

    // "advance"/"account" complete the draft order directly further down,
    // with no hosted-checkout step to ever calculate a shipping cost — ask
    // the Storefront API for the same delivery rate hosted checkout would
    // have shown, and charge that instead of letting these orders ship free.
    if (payload.paymentMethod === "advance" || payload.paymentMethod === "account") {
      const variantLines = lineItems.map((item: any) => ({
        variantId: `gid://shopify/ProductVariant/${item.variantId}`,
        quantity: item.quantity,
      }));
      const shippingLine = await calculateShippingLine(
        admin,
        session?.shop ?? "",
        variantLines,
        payload.shippingAddress,
      );
      if (!shippingLine) {
        return new Response(
          JSON.stringify({ error: "Could not calculate shipping for this address. Please try again or choose a different payment method." }),
          { status: 422, headers: { "Content-Type": "application/json" } },
        );
      }
      // Shipping-reward discounts only apply here — "advance"/"account" are
      // the only payment methods where we compute the shipping line
      // ourselves. For "net30"/"pay_now" the buyer picks and pays shipping
      // on Shopify's own hosted checkout, which this app doesn't control.
      //
      // Re-resolved (rather than reusing advancedRewards above) now that the
      // real shipping cost is known, so an advanced discount's own
      // rewardApplication "highest"/"lowest" pick correctly compares its
      // shipping reward against its other rewards using the actual amount —
      // note this means a "highest"/"lowest" discount that also contributed
      // a subtotal/cart_lines reward above (resolved with shippingAmount 0)
      // could, in the rare case its true best reward is actually the
      // shipping one, apply both; an acceptable edge case rather than
      // reordering this function's whole draft-order-building flow.
      const advancedShippingRewards = resolveAdvancedRewards(
        activeDiscounts,
        splitCoupons.advancedCoupons,
        totalValue,
        Number(shippingLine.price),
        currency,
        itemInfo,
      ).shippingCandidates;
      const resolvedShippingDiscount = resolveShippingDiscount(
        activeDiscounts,
        splitCoupons.shippingCoupons,
        totalValue,
        Number(shippingLine.price),
        currency,
        itemInfo,
        advancedShippingRewards,
      );
      if (resolvedShippingDiscount) {
        const discountedPrice = Math.max(Number(shippingLine.price) - resolvedShippingDiscount.amount, 0);
        const rewardName = resolvedShippingDiscount.discount.publicName || resolvedShippingDiscount.discount.name;
        shippingLine.price = discountedPrice.toFixed(2);
        shippingLine.title = `${shippingLine.title} (${rewardName})`;
        appliedShippingDiscountId = resolvedShippingDiscount.discount._id;
        appliedShippingDiscountAmount = resolvedShippingDiscount.amount;
      }
      input.shippingLine = shippingLine;
    }

    // An approved shipping price replaces the calculated one, for every payment
    // method (the customer's hosted checkout uses the draft order's line).
    if (orderExceptions.shipping) {
      input.shippingLine = { title: "Shipping (agreed)", price: orderExceptions.shipping.price.toFixed(2) };
    }

    // "account" (Payment on Account) is completed directly below without a
    // Shopify payment-terms template — it doesn't depend on the company
    // location's Net Terms setting at all, only on the customer group's own
    // "Payment on account" toggle + credit limit checked above.
    if (
      payload.paymentMethod &&
      payload.paymentMethod !== "pay_now" &&
      payload.paymentMethod !== "account" &&
      orderCustomerId
    ) {
      const templateId = await findPaymentTermsTemplateId(admin, orderCustomerId, payload.paymentMethod);
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

    // Stashed on the draft order (Shopify carries customAttributes over onto
    // the real order's note_attributes on completion) instead of recording
    // the redemption here — a draft order isn't a paid order yet: "pay_now"/
    // "net30" hand the buyer an invoiceUrl to pay later on Shopify's hosted
    // checkout, and recording usage before that would burn a shopper's
    // usageLimitPerCustomer on a checkout they may never finish. The
    // orders/create webhook reads this back and records the redemption only
    // once Shopify has actually created the order.
    const appliedDiscountIds = [
      ...(resolvedDiscount && "discounts" in resolvedDiscount ? resolvedDiscount.discounts.map((d) => d._id) : []),
      ...(appliedShippingDiscountId ? [appliedShippingDiscountId] : []),
      ...(resolvedFreeProduct ? [resolvedFreeProduct.discount._id] : []),
      ...(resolvedLineItemDiscount ? [resolvedLineItemDiscount.discount._id] : []),
      ...(resolvedAdvancedFreeProductGroup ? [resolvedAdvancedFreeProductGroup.discount._id] : []),
    ];
    if (appliedDiscountIds.length > 0) {
      // docs.sparklayer.io/discounts "Data Tracking" — best-effort per-
      // discount dollar amounts for the orders/create webhook to forward to
      // recordDiscountRedemptions; only order/shipping rewards have a
      // well-defined single dollar amount (free_product/line_item ids are
      // simply left out of this map, savingsAmount stays null for them).
      const savings: Record<string, number> = {};
      if (resolvedDiscount && "discounts" in resolvedDiscount) {
        for (const d of resolvedDiscount.discounts) {
          savings[String(d._id)] = discountAmount(d, totalValue);
        }
      }
      if (appliedShippingDiscountId && appliedShippingDiscountAmount != null) {
        savings[String(appliedShippingDiscountId)] = appliedShippingDiscountAmount;
      }

      input.customAttributes = [
        { key: "_sparklayer_discount_ids", value: JSON.stringify(appliedDiscountIds) },
        {
          key: "_sparklayer_discount_meta",
          value: JSON.stringify({ preDiscountTotal: totalValue, currency, savings }),
        },
      ];
    }

    // Stamped on the draft order (carried onto the real order's note
    // attributes) so the orders/create webhook and backend-api can attribute
    // the order to the agent. The backend re-verifies the context before
    // trusting these, so they're a claim, not proof.
    if (actor.kind === "on_behalf" && loggedInCustomerId) {
      input.customAttributes = [
        ...((input.customAttributes as Array<{ key: string; value: string }> | undefined) ?? []),
        { key: "_sparklayer_agent_id", value: `gid://shopify/Customer/${loggedInCustomerId}` },
        { key: "_sparklayer_context_id", value: actor.contextId },
      ];
    }

    // The buyer's purchase order number and the delivery date they asked for
    // (spec §3.2 step 8). The date is carried on the order as a visible note.
    const poNumber = String(payload.poNumber ?? "").trim();
    if (poNumber) {
      if (poNumber.length > 64) {
        return new Response(JSON.stringify({ error: "The PO reference can be up to 64 characters." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      input.poNumber = poNumber;
    }

    const deliveryDate = String(payload.requestedDeliveryDate ?? "").trim();
    if (deliveryDate) {
      const parsed = /^\d{4}-\d{2}-\d{2}$/.test(deliveryDate) ? new Date(deliveryDate + "T00:00:00Z") : null;
      const today = new Date(new Date().toISOString().slice(0, 10) + "T00:00:00Z");
      const latest = new Date(today.getTime() + 365 * 24 * 60 * 60 * 1000);
      if (!parsed || Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== deliveryDate || parsed < today || parsed > latest) {
        return new Response(JSON.stringify({ error: "Choose a delivery date from today up to a year ahead." }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }
      input.customAttributes = [
        ...((input.customAttributes as Array<{ key: string; value: string }> | undefined) ?? []),
        { key: "Requested delivery date", value: deliveryDate },
      ];
    }

    // A note for the team, kept off anything the customer can read: it travels
    // as a hidden attribute (leading underscore) and on our own order record.
    const internalNote = actor.kind === "on_behalf" ? String(payload.internalNote ?? "").trim().slice(0, 500) : "";
    if (internalNote) {
      input.customAttributes = [
        ...((input.customAttributes as Array<{ key: string; value: string }> | undefined) ?? []),
        { key: "_sparklayer_internal_note", value: internalNote },
      ];
    }

    const spentExceptionIds = appliedExceptionIds(appliedOverrides, orderExceptions);
    if (spentExceptionIds.length > 0) {
      input.customAttributes = [
        ...((input.customAttributes as Array<{ key: string; value: string }> | undefined) ?? []),
        {
          key: "_sparklayer_override_ids",
          value: JSON.stringify(spentExceptionIds),
        },
      ];
    }

    console.log("[checkout] DraftOrderCreate input:", JSON.stringify(input, null, 2));
    const response = await admin.graphql(DRAFT_ORDER_CREATE, { variables: { input } });
    const body = (await response.json()) as any;
    console.log("[checkout] DraftOrderCreate response:", JSON.stringify(body, null, 2));

    const result = body.data?.draftOrderCreate;

    if (!result || result.userErrors?.length || body.errors?.length) {
      const errorMsg =
        result?.userErrors?.[0]?.message ||
        body.errors?.[0]?.message ||
        "Could not start checkout";
      console.error("[checkout] DraftOrderCreate failed:", errorMsg, {
        userErrors: result?.userErrors,
        errors: body.errors,
      });
      if (actor.kind === "on_behalf" && loggedInCustomerId) {
        await reportOrderFailure(session?.shop ?? "", loggedInCustomerId, orderCustomerId ?? null, String(payload.idempotencyKey || ""), "DRAFT_ORDER_FAILED", errorMsg);
      }
      return new Response(
        JSON.stringify({ error: errorMsg }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    // The agreed exceptions are now spent on this order; they can't be used
    // on another.
    if (spentExceptionIds.length > 0 && loggedInCustomerId) {
      await markOverridesApplied(session?.shop ?? "", loggedInCustomerId, spentExceptionIds, result.draftOrder.id);
    }

    if (payload.paymentMethod === "account") {
      await chargeCredit(admin, session?.shop ?? "", orderCustomerId, totalValue);
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
        if (actor.kind === "on_behalf" && loggedInCustomerId) {
          await reportOrderFailure(session?.shop ?? "", loggedInCustomerId, orderCustomerId ?? null, String(payload.idempotencyKey || ""), "ORDER_COMPLETE_FAILED", completeResult?.userErrors?.[0]?.message || "Could not complete order");
        }
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
        placedByAgent:
          actor.kind === "on_behalf" && loggedInCustomerId
            ? {
                agentShopifyCustomerId: `gid://shopify/Customer/${loggedInCustomerId}`,
                contextId: actor.contextId,
                overrideIds: spentExceptionIds,
              }
            : undefined,
      };
      row.poNumber = poNumber || undefined;
      row.requestedDeliveryDate = deliveryDate || undefined;
      row.internalNote = internalNote || undefined;
      await syncOrderRows([row], session?.shop ?? "");

      return new Response(
        JSON.stringify({ order: { id: order.id, name: order.name, statusUrl: order.statusPageUrl } }),
        { headers: { "Content-Type": "application/json" } }
      );
    }

    // On behalf of a customer the hosted payment page is not opened for the
    // agent. A secure link goes to the customer's own email instead.
    if (actor.kind === "on_behalf" && loggedInCustomerId) {
      // If the shop holds stock for orders waiting on payment, hold it until
      // the link runs out (a quote never does).
      const moduleSettings = await getModuleSettings(session?.shop ?? "");
      if (moduleSettings.inventoryMode === "reserve_orders") {
        try {
          await admin.graphql(DRAFT_ORDER_STAMP, {
            variables: {
              id: result.draftOrder.id,
              input: { reserveInventoryUntil: new Date(Date.now() + moduleSettings.paymentLinkValidHours * 3600 * 1000).toISOString() },
            },
          });
        } catch (err) {
          console.error("[checkout] could not reserve stock for the draft order", err);
        }
      }

      const money = result.draftOrder.totalPriceSet?.shopMoney;
      const link = await createPaymentLink(session?.shop ?? "", loggedInCustomerId, {
        customerShopifyId: `gid://shopify/Customer/${orderCustomerId}`,
        draftOrderId: result.draftOrder.id,
        invoiceUrl: result.draftOrder.invoiceUrl,
        amount: Math.round(Number(money?.amount ?? 0) * 100),
        currency: money?.currencyCode || currency,
        shipTo: {
          zip: payload.shippingAddress?.zip,
          countryCode: payload.shippingAddress?.countryCode,
          provinceCode: payload.shippingAddress?.provinceCode,
        },
      });

      if (link.status !== 201) {
        return new Response(
          JSON.stringify({ error: link.body?.message || "Could not send the payment link", code: link.body?.code }),
          { status: link.status === 500 ? 502 : link.status, headers: { "Content-Type": "application/json" } },
        );
      }

      // The link's token rides on the order Shopify creates once it is paid,
      // which is how the payment gets matched back to the link.
      try {
        await admin.graphql(DRAFT_ORDER_STAMP, {
          variables: {
            id: result.draftOrder.id,
            input: {
              customAttributes: [
                ...((input.customAttributes as Array<{ key: string; value: string }> | undefined) ?? []),
                { key: "_sparklayer_payment_link", value: link.body.token },
              ],
            },
          },
        });
      } catch (err) {
        console.error("[checkout] could not stamp payment link on the draft order", err);
      }

      return new Response(
        JSON.stringify({
          paymentLinkSent: {
            id: link.body.id,
            sentTo: link.body.emailMasked,
            amount: link.body.amount,
            currency: link.body.currency,
            expiresAt: link.body.expiresAt,
          },
        }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ invoiceUrl: result.draftOrder.invoiceUrl }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("checkout proxy error:", error);
    let errorMessage = "Could not start checkout";
    let status = 500;
    if (error instanceof Response) {
      status = error.status;
      errorMessage = error.statusText || `Request failed with status ${error.status}`;
    } else if (error && error.message) {
      errorMessage = error.message;
    } else if (error) {
      errorMessage = String(error);
    }
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: status,
      headers: { "Content-Type": "application/json" },
    });
  }
};

const jsonResponse = (body: unknown, status: number, extraHeaders: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...extraHeaders },
  });

// Makes checkout safe to retry (spec §7.1, §12): a double click, a slow
// network or a "did it go through?" retry carries the same idempotency key,
// so it gets the first attempt's answer instead of creating a second draft
// order. Requests without a key (older storefront scripts) run as before.
// If the idempotency store can't be reached the checkout still proceeds,
// unprotected, rather than blocking every order on a bookkeeping outage.
export const action = async (args: ActionFunctionArgs) => {
  const { request } = args;
  if (request.method !== "POST") return handleCheckout(args);

  const payload = await request.clone().json().catch(() => null);
  const key = typeof payload?.idempotencyKey === "string" ? payload.idempotencyKey.trim() : "";
  if (!key) return handleCheckout(args);

  const { session } = await authenticate.public.appProxy(request.clone());
  if (!session) return handleCheckout(args);

  const shopper = new URL(request.url).searchParams.get("logged_in_customer_id") ?? "guest";
  const claim = { shop: session.shop, scope: `checkout:${shopper}`, key };
  // The key itself isn't part of what makes two requests "the same".
  const content = { ...payload };
  delete content.idempotencyKey;

  const begun = await beginOperation(claim, content);
  if (!begun) return handleCheckout(args);

  if (begun.state === "replay") {
    return jsonResponse(begun.response.body, begun.response.status, { "Idempotent-Replayed": "true" });
  }
  if (begun.state === "in_progress") {
    return jsonResponse(
      { error: "This checkout is already being processed. Please wait a moment.", code: "IDEMPOTENCY_IN_PROGRESS" },
      409,
    );
  }
  if (begun.state === "conflict") {
    return jsonResponse(
      { error: "This checkout was already started with different details. Please try again.", code: "IDEMPOTENCY_CONFLICT" },
      409,
    );
  }

  let response: Response;
  try {
    response = await handleCheckout(args);
  } catch (error) {
    await releaseOperation(claim);
    throw error;
  }

  if (response.ok) {
    const body = await response.clone().json().catch(() => null);
    await completeOperation(claim, { status: response.status, body });
  } else {
    await releaseOperation(claim);
  }

  return response;
};
