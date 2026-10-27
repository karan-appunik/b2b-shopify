import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createAgentDelegation, getAgentContext, listAgentDelegations, revokeAgentDelegation } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveAgent(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  if (!session || !loggedInCustomerId) return null;

  const agent = await getAgentContext(session.shop, loggedInCustomerId);
  return agent.isAgent ? { shop: session.shop, loggedInCustomerId } : null;
}

// GET: the delegations this agent gave or received, and the colleagues they can
// choose from.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ delegations: [], agents: [] });

    return json(await listAgentDelegations(agent.shop, agent.loggedInCustomerId));
  } catch (error: any) {
    console.error("agent-delegations proxy error:", error);
    return json({ delegations: [], agents: [] }, 500);
  }
};

// POST { intent: "create", delegateId, endsAt, reason, coverAccess, includeQuotes }
// or   { intent: "revoke", id }. It is always the signed-in agent's own authority.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));

    if (body.intent === "revoke") {
      const result = await revokeAgentDelegation(agent.shop, agent.loggedInCustomerId, String(body.id ?? ""));
      return json(result.body ?? {}, result.status || 502);
    }

    const result = await createAgentDelegation(agent.shop, agent.loggedInCustomerId, {
      delegateId: String(body.delegateId ?? ""),
      endsAt: String(body.endsAt ?? ""),
      reason: String(body.reason ?? ""),
      coverAccess: body.coverAccess === true,
      includeQuotes: body.includeQuotes !== false,
    });
    return json(result.body ?? { message: "Could not create the delegation" }, result.status || 502);
  } catch (error: any) {
    console.error("agent-delegations proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
