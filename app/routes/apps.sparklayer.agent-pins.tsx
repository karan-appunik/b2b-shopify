import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentContext, pinAgentAccount } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// POST { customerId, pinned } — keep an account at the top of the agent's
// dashboard, or let it go. The backend checks the agent may act for it.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
    if (!session || !loggedInCustomerId) return json({ message: "Not authorized" }, 403);

    const agent = await getAgentContext(session.shop, loggedInCustomerId);
    if (!agent.isAgent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const result = await pinAgentAccount(session.shop, loggedInCustomerId, String(body.customerId ?? ""), body.pinned !== false);
    return json(result.body ?? {}, result.status);
  } catch (error) {
    console.error("agent-pins proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
