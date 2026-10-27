import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { decideAgentApproval, getAgentContext, listAgentApprovals } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveAgent(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  if (!session || !loggedInCustomerId) return null;

  const agent = await getAgentContext(session.shop, loggedInCustomerId);
  return agent.isAgent ? { shop: session.shop, loggedInCustomerId } : null;
}

// GET: exceptions waiting for a decision that this agent is allowed to make.
// The backend decides which ones (their approval limit, the routing rules, and
// never their own).
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ approvals: [], needsStepUp: false });

    return json(await listAgentApprovals(agent.shop, agent.loggedInCustomerId));
  } catch (error: any) {
    console.error("agent-approvals proxy error:", error);
    return json({ approvals: [] }, 500);
  }
};

// POST { id, decision: "approve" | "reject", comment }
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const result = await decideAgentApproval(
      agent.shop,
      agent.loggedInCustomerId,
      String(body.id ?? ""),
      String(body.decision ?? ""),
      String(body.comment ?? ""),
    );

    return json(result.body ?? {}, result.status);
  } catch (error: any) {
    console.error("agent-approvals proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
