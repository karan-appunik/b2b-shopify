import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentCustomerSummary } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// GET: the summary of the customer the agent is ordering for (spec §4.3):
// terms, credit left, open orders and quotes, the last order. The customer is
// the one the server holds in the agent's live context, never one the browser names.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
    if (!session || !loggedInCustomerId) return json({ summary: null });

    return json({ summary: await getAgentCustomerSummary(session.shop, loggedInCustomerId) });
  } catch (error) {
    console.error("agent-summary proxy error:", error);
    return json({ summary: null }, 500);
  }
};
