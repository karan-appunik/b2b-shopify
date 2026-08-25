import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { fetchVariantPricing } from "../services/variantPricing.server";

// Lets the storefront cart drawer show the wholesale price for lines already
// in the cart, without relying on a Shopify-side cart discount (removed —
// see priceListPush.server.ts). Takes raw numeric variant ids (as cart.js
// returns them), same source of truth apps.sparklayer.checkout.tsx uses.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids") || "";
    const variantIds = idsParam
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);

    if (!admin || variantIds.length === 0) {
      return new Response(JSON.stringify({ variants: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const gids = variantIds.map((id) => `gid://shopify/ProductVariant/${id}`);
    const pricing = await fetchVariantPricing(admin, gids);

    const variants = variantIds.map((id) => {
      const entry = pricing.get(`gid://shopify/ProductVariant/${id}`);
      return {
        variantId: id,
        price: entry?.price ?? null,
        wholesalePrice: entry?.wholesalePrice ?? null,
        tiers: entry?.tiers ?? [],
      };
    });

    return new Response(JSON.stringify({ variants }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("variant-pricing proxy error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
