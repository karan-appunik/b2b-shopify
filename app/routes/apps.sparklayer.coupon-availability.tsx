import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getActiveDiscounts } from "../services/discountLookup.server";

// Lets the cart drawer decide whether to render the coupon-code input at all
// — docs.sparklayer.io/discounts: "The coupon code box will only show for
// your customers if there is an 'active' discount code that is 'enabled'".
// No specific code or customer is needed here, just whether the shop has any
// active coupon-type discount right now.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);

    if (!session) {
      return new Response(JSON.stringify({ hasCoupons: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const activeDiscounts = await getActiveDiscounts(session.shop);

    return new Response(JSON.stringify({ hasCoupons: activeDiscounts.hasCoupons }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("coupon-availability proxy error:", error);
    return new Response(JSON.stringify({ hasCoupons: false }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
};
