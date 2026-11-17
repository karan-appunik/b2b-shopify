import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentContext, listAgentNotifications, markAgentNotificationsRead } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveAgent(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  if (!session || !loggedInCustomerId) return null;

  const agent = await getAgentContext(session.shop, loggedInCustomerId);
  return agent.isAgent ? { shop: session.shop, loggedInCustomerId } : null;
}

// GET: this agent's alerts (approvals waiting, quotes expiring, the daily
// summary …) and how many are unread.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ notifications: [], unread: 0 });

    return json(await listAgentNotifications(agent.shop, agent.loggedInCustomerId));
  } catch (error) {
    console.error("agent-notifications proxy error:", error);
    return json({ notifications: [], unread: 0 }, 500);
  }
};

// POST { ids? } — mark some, or (no ids) all, as read.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const result = await markAgentNotificationsRead(
      agent.shop,
      agent.loggedInCustomerId,
      Array.isArray(body.ids) ? body.ids.map(String) : [],
    );
    return json(result.body ?? {}, result.status);
  } catch (error) {
    console.error("agent-notifications proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
