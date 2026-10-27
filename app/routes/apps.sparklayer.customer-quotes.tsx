import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { listBuyerQuotes, respondToBuyerQuote } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveShopper(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  if (!session || !loggedInCustomerId) return null;

  return { shop: session.shop, loggedInCustomerId };
}

// GET: quotes that have been sent to the signed-in customer. The customer is
// the shopper Shopify itself identified, so a shopper can only ever see
// quotes addressed to them, and the backend leaves out anything internal.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return json({ quotes: [] });

    return json({ quotes: await listBuyerQuotes(shopper.shop, shopper.loggedInCustomerId) });
  } catch (error: any) {
    console.error("customer-quotes proxy error:", error);
    return json({ quotes: [] }, 500);
  }
};

// POST { id, action: "accept" | "decline" | "changes", comment }
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return json({ code: "NOT_FOUND", message: "Please sign in" }, 401);

    const body = await request.json().catch(() => ({}));
    const result = await respondToBuyerQuote(
      shopper.shop,
      shopper.loggedInCustomerId,
      String(body.id ?? ""),
      String(body.action ?? ""),
      String(body.comment ?? ""),
    );

    return json(result.body ?? {}, result.status);
  } catch (error: any) {
    console.error("customer-quotes proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
