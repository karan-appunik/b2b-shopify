import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getCreditInfo } from "../services/creditLimit.server";

// Feeds the cart drawer's "My Details" panel (Credit limit / Available
// credit) — same source of truth the checkout proxy enforces against.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    if (!session || !loggedInCustomerId) {
      return new Response(
        JSON.stringify({ creditLimit: null, balance: 0, enforced: false, onAccountEnabled: false }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const info = await getCreditInfo(admin ?? null, session.shop, loggedInCustomerId);

    return new Response(JSON.stringify(info), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("credit-info proxy error:", error);
    return new Response(
      JSON.stringify({ creditLimit: null, balance: 0, enforced: false, onAccountEnabled: false }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }
};
