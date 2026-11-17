import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentContext, listOfflineCaptures, resolveOfflineCapture, sendOfflineCaptures } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveAgent(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  if (!session || !loggedInCustomerId) return null;

  const agent = await getAgentContext(session.shop, loggedInCustomerId);
  return agent.isAgent ? { shop: session.shop, loggedInCustomerId } : null;
}

// GET: what an offline device sent earlier and the agent has not yet reviewed.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ enabled: false, captures: [] });

    const result = await listOfflineCaptures(agent.shop, agent.loggedInCustomerId);
    return json(result.body ?? { enabled: false, captures: [] }, result.status || 502);
  } catch (error: any) {
    console.error("agent-offline proxy error:", error);
    return json({ enabled: false, captures: [] }, 500);
  }
};

// POST { intent: "send", captures: [...] } from a device that was offline, or
// { intent: "resolve", id, outcome: "ADDED" | "DISCARDED" }.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));

    if (body.intent === "resolve") {
      const result = await resolveOfflineCapture(agent.shop, agent.loggedInCustomerId, String(body.id ?? ""), String(body.outcome ?? ""));
      return json(result.body ?? {}, result.status || 502);
    }

    const result = await sendOfflineCaptures(agent.shop, agent.loggedInCustomerId, Array.isArray(body.captures) ? body.captures.slice(0, 50) : []);
    return json(result.body ?? { message: "Could not send" }, result.status || 502);
  } catch (error: any) {
    console.error("agent-offline proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
