import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentContext, listAgentPaymentLinks, revokeAgentPaymentLink } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveAgent(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  if (!session || !loggedInCustomerId) return null;

  const agent = await getAgentContext(session.shop, loggedInCustomerId);
  return agent.isAgent ? { shop: session.shop, loggedInCustomerId } : null;
}

// GET: the payment links this agent has sent. The backend never returns the
// link's secret or the hosted checkout address.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ links: [] });

    return json({ links: await listAgentPaymentLinks(agent.shop, agent.loggedInCustomerId) });
  } catch (error: any) {
    console.error("agent-payment-links proxy error:", error);
    return json({ links: [] }, 500);
  }
};

// POST { id } — withdraw one of the agent's own links.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const result = await revokeAgentPaymentLink(agent.shop, agent.loggedInCustomerId, String(body.id ?? ""));

    return json(result.body ?? {}, result.status);
  } catch (error: any) {
    console.error("agent-payment-links proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
