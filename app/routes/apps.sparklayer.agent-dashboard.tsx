import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { agentCan, getAgentContext, getAgentDashboard } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// The accounts a signed-in sales agent may act for, plus their month's
// orders and revenue — what the Sales Agent section of the cart drawer's
// My Account tab shows. Re-checks on the server that the shopper is an agent
// and returns only what the backend scopes to them.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");

    if (!session || !loggedInCustomerId) return json({ accounts: [] });

    const agentContext = await getAgentContext(session.shop, loggedInCustomerId);
    if (!agentContext.isAgent) return json({ accounts: [] });

    const dashboard = await getAgentDashboard(session.shop, loggedInCustomerId);

    // Whether to offer "New customer": the role has it, even if a fresh
    // authenticator code is still needed.
    const create = await agentCan(session.shop, loggedInCustomerId, "customer.create");
    const canCreateCustomer = create.allowed || create.needsStepUp;

    return json({ ...(dashboard ?? { accounts: [] }), canCreateCustomer });
  } catch (error: any) {
    console.error("agent-dashboard proxy error:", error);
    return json({ accounts: [] }, 500);
  }
};
