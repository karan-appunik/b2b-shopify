import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentContext, searchB2bCustomers } from "../services/agentContext.server";

// Lets a sales agent search for the B2B customer they want to place an
// order on behalf of. Re-checks agent status server-side on every request
// (never trusts the client) so a non-agent shopper can't enumerate other
// customers' names/emails by calling this proxy directly.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");
    const q = url.searchParams.get("q") || "";

    if (!session) {
      return new Response(JSON.stringify({ customers: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const agentContext = await getAgentContext(session.shop, loggedInCustomerId);
    if (!agentContext.isAgent) {
      return new Response(JSON.stringify({ customers: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const customers = await searchB2bCustomers(session.shop, q);

    return new Response(JSON.stringify({ customers }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("agent-search proxy error:", error);
    return new Response(JSON.stringify({ customers: [], error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
