import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentCart, saveAgentCart, type AgentCartLine } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveShopper(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");

  if (!session || !loggedInCustomerId) return null;
  return { shop: session.shop, loggedInCustomerId };
}

// GET: the cart saved for the customer the agent is ordering for.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return json({ items: [] });

    const cart = await getAgentCart(shopper.shop, shopper.loggedInCustomerId);
    return json(cart ?? { items: [], currency: null, version: 0 });
  } catch (error: any) {
    console.error("agent-cart proxy error:", error);
    return json({ items: [] }, 500);
  }
};

// POST: { items: [{ variantId, quantity }], currency } — saves the cart the
// agent is building. Ignored unless the server holds a live customer context.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return json({ saved: false }, 401);

    const body = await request.json().catch(() => ({}));
    const rawItems = Array.isArray(body.items) ? body.items : [];

    const items: AgentCartLine[] = rawItems
      .map((item: any) => ({
        variantId: String(item?.variantId ?? "").trim(),
        quantity: Number(item?.quantity),
      }))
      .filter((item: AgentCartLine) => item.variantId && Number.isInteger(item.quantity) && item.quantity > 0);

    const cart = await saveAgentCart(
      shopper.shop,
      shopper.loggedInCustomerId,
      items,
      typeof body.currency === "string" ? body.currency : null,
      Number.isInteger(body.expectedVersion) ? body.expectedVersion : null,
    );

    if (cart?.conflict) {
      return json({ saved: false, conflict: true, items: cart.items, currency: cart.currency, version: cart.version }, 409);
    }
    return json({ saved: !!cart, version: cart ? cart.version : null });
  } catch (error: any) {
    console.error("agent-cart proxy error:", error);
    return json({ saved: false }, 500);
  }
};
