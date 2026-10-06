import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { fetchVariantPricing, pickTierPrice } from "../services/variantPricing.server";
import { getOrderLimits, checkOrderLimits } from "../services/orderLimits.server";
import { getCreditInfo, checkCreditLimit, chargeCredit } from "../services/creditLimit.server";
import { getActiveDiscounts, resolveDiscount, resolveShippingDiscount, resolveFreeProductDiscount, resolveLineItemDiscount, resolveAdvancedRewards, validateAndSplitCoupons, lineMatchesCondition, discountAmount, resolveFreeProductAward, resolveAdvancedFreeProductGroups, resolveFreeProductGroupAward, type Discount } from "../services/discountLookup.server";
import { syncOrderRows, type OrderRow } from "../services/orderSync.server";
import { calculateShippingLine } from "../services/shippingRate.server";

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
          ? (tierPrice != null && tierPrice < variantPricing.price ? tierPrice : variantPricing.price)
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
    const couponCodes: string[] = Array.isArray(payload.couponCodes) ? payload.couponCodes : [];
    const shopifyCustomerGid = loggedInCustomerId ? `gid://shopify/Customer/${loggedInCustomerId}` : null;
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

    // docs.sparklayer.io/discounts "Give a Percentage Off Products" (simple
    // mode, matched against a flat lineItemSkus list) and "Advanced
    // Requirements and Rewards" cart_lines reward (matched via lineItemMatch,
    // an attribute/operator condition against sku/tag/vendor) — independent
    // of the order/shipping/free-product discounts resolved above.
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

      // originalUnitPrice + a line appliedDiscount used to be how this set
      // the wholesale price, but originalUnitPrice is a dead field for
      // variant-based lines on Admin API 2025-10 (confirmed via schema
      // introspection — it no longer even appears on
      // DraftOrderLineItemInput for these, so Shopify silently ignored it
      // while still applying the discount, undercharging the line).
      // priceOverride is the current mechanism: it sets the actual charged
      // unit price directly, so the buyer is billed exactly the tier price
      // with no drift from what totalValue (below) assumes.
      if (unitPrice < variantPricing.price) {
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

    if (payload.note) {
      input.note = payload.note;
    }

    if (loggedInCustomerId) {
      input.customerId = `gid://shopify/Customer/${loggedInCustomerId}`;
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
      return new Response(
        JSON.stringify({ error: errorMsg }),
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
