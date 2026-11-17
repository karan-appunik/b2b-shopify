import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  enterAgentSession,
  exitAgentSession,
  getAgentContext,
  getAgentSession,
  getMfaStatus,
  refreshAgentSession,
  startMfaEnrollment,
  verifyMfaCode,
} from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Resolves the shopper from Shopify's signed app-proxy request and confirms
// they are an agent. Never trusts anything the browser sends about who the
// agent is or which customer they represent.
async function resolveAgent(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");

  if (!session || !loggedInCustomerId) return null;

  const agentContext = await getAgentContext(session.shop, loggedInCustomerId);
  if (!agentContext.isAgent) return null;

  return { shop: session.shop, loggedInCustomerId };
}

// GET: the agent's current "acting for customer" context, if any.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ active: false });

    return json(await getAgentSession(agent.shop, agent.loggedInCustomerId));
  } catch (error: any) {
    console.error("agent-session proxy error:", error);
    return json({ active: false, error: error.message || String(error) }, 500);
  }
};

// POST: { intent: "enter", customerId } or { intent: "exit", contextId }.
// App proxies only pass GET/POST through, so exit is a POST intent rather
// than a DELETE.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const agent = await resolveAgent(request);
    if (!agent) return json({ active: false, code: "CUSTOMER_ACCESS_DENIED" }, 403);

    const body = await request.json().catch(() => ({}));

    if (body.intent === "enter") {
      const result = await enterAgentSession(agent.shop, agent.loggedInCustomerId, String(body.customerId || ""), {
        clientIp: request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || undefined,
        userAgent: request.headers.get("user-agent") || undefined,
      });

      if (!result.ok) return json({ active: false, code: result.code ?? "CUSTOMER_ACCESS_DENIED" }, 403);
      return json(result.session);
    }

    // Authenticator-app check (sales roles that require MFA).
    if (body.intent === "mfa_status") {
      const status = await getMfaStatus(agent.shop, agent.loggedInCustomerId);
      return json(status ?? { required: false, enrolled: false, verified: false, locked: false });
    }

    if (body.intent === "mfa_enroll") {
      const result = await startMfaEnrollment(agent.shop, agent.loggedInCustomerId);
      return json(result.body ?? {}, result.status);
    }

    if (body.intent === "mfa_verify") {
      const result = await verifyMfaCode(
        agent.shop,
        agent.loggedInCustomerId,
        String(body.code ?? ""),
        body.purpose === "step_up" ? "step_up" : "session",
      );
      return json(result.body ?? {}, result.status);
    }

    if (body.intent === "refresh") {
      const result = await refreshAgentSession(agent.shop, agent.loggedInCustomerId, String(body.contextId ?? ""));
      return json(result.body ?? {}, result.status);
    }

    if (body.intent === "exit") {
      await exitAgentSession(agent.shop, agent.loggedInCustomerId, String(body.contextId || ""));
      return json({ active: false });
    }

    return json({ message: "Unknown intent" }, 400);
  } catch (error: any) {
    console.error("agent-session proxy error:", error);
    return json({ active: false, error: error.message || String(error) }, 500);
  }
};
