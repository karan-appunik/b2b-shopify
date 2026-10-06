import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { fetchVariantPricing, pickTierPrice } from "../services/variantPricing.server";
import { getActiveDiscounts, validateAndSplitCoupons } from "../services/discountLookup.server";

// Lets the cart drawer check a coupon code the moment the buyer clicks
// Apply, instead of only finding out it's invalid/used-up when the full
// checkout proxy (apps.sparklayer.checkout.tsx) runs its own validation.
// Reuses the exact same eligibility logic (subtotal, schedule, customer
// group, usage limit) so the two never disagree.
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
      return new Response(JSON.stringify({ valid: false, error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const url = new URL(request.url);
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    const payload = await request.json();
    const couponCode: string = String(payload.couponCode || "").trim();
    const lineItems = Array.isArray(payload.lineItems) ? payload.lineItems : [];
    const currency = payload.currency || "USD";

    if (!couponCode) {
      return new Response(JSON.stringify({ valid: false, error: "Coupon code is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const variantGids = lineItems.map(
      (item: any) => `gid://shopify/ProductVariant/${item.variantId}`,
    );
    const pricing = await fetchVariantPricing(admin, variantGids);
    const totalValue = lineItems.reduce((sum: number, item: any) => {
      const variantId = `gid://shopify/ProductVariant/${item.variantId}`;
      const variantPricing = pricing.get(variantId);
      if (!variantPricing) return sum;
      const tierPrice = pickTierPrice(variantPricing.tiers, item.quantity);
      const unitPrice =
        tierPrice != null && tierPrice < variantPricing.price ? tierPrice : variantPricing.price;
      return sum + unitPrice * Number(item.quantity || 0);
    }, 0);
    const totalQuantity = lineItems.reduce((sum: number, item: any) => sum + Number(item.quantity || 0), 0);
    const itemInfo = {
      totalQuantity,
      uniqueItemCount: lineItems.length,
      lines: lineItems.map((item: any) => {
        const variantId = `gid://shopify/ProductVariant/${item.variantId}`;
        const variantPricing = pricing.get(variantId);
        return {
          sku: variantPricing?.sku ?? null,
          tags: variantPricing?.tags ?? [],
          vendor: variantPricing?.vendor ?? null,
        };
      }),
    };

    const shopifyCustomerGid = loggedInCustomerId ? `gid://shopify/Customer/${loggedInCustomerId}` : null;
    const activeDiscounts = await getActiveDiscounts(session?.shop ?? "", [couponCode], shopifyCustomerGid);
    const result = validateAndSplitCoupons(activeDiscounts, [couponCode], totalValue, currency, itemInfo);

    if ("error" in result) {
      return new Response(JSON.stringify({ valid: false, error: result.error }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ valid: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("validate-coupon proxy error:", error);
    return new Response(
      JSON.stringify({ valid: false, error: "Could not validate coupon code. Please try again." }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
};
