import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { decideAgentQuote, getAgentContext, listQuoteApprovals } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveAgent(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  if (!session || !loggedInCustomerId) return null;

  const agent = await getAgentContext(session.shop, loggedInCustomerId);
  return agent.isAgent ? { shop: session.shop, loggedInCustomerId } : null;
}

// GET: quotes waiting for a manager's approval that this agent may decide
// (never their own).
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ quotes: [], needsStepUp: false });

    return json(await listQuoteApprovals(agent.shop, agent.loggedInCustomerId));
  } catch (error: any) {
    console.error("agent-quote-approvals proxy error:", error);
    return json({ quotes: [], needsStepUp: false }, 500);
  }
};

// POST { id, decision: "approve" | "reject", comment }
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const result = await decideAgentQuote(
      agent.shop,
      agent.loggedInCustomerId,
      String(body.id ?? ""),
      String(body.decision ?? ""),
      String(body.comment ?? ""),
    );

    return json(result.body ?? {}, result.status);
  } catch (error: any) {
    console.error("agent-quote-approvals proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
