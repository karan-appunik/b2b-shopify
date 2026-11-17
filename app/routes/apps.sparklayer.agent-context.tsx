import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentContext } from "../services/agentContext.server";

// Tells the storefront whether the logged-in shopper is a sales agent, so
// the "act on behalf of a customer" search UI only shows for them.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    if (!session) {
      return new Response(JSON.stringify({ isAgent: false }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const context = await getAgentContext(session.shop, loggedInCustomerId);

    return new Response(JSON.stringify(context), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("agent-context proxy error:", error);
    return new Response(JSON.stringify({ isAgent: false, error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
