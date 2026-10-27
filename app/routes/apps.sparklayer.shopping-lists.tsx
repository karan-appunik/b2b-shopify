import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { createShoppingList, deleteShoppingList, listShoppingLists } from "../services/agentContext.server";

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveShopper(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  return session && loggedInCustomerId ? { shop: session.shop, loggedInCustomerId } : null;
}

// GET: the signed-in customer's saved lists, or — while an agent is ordering
// for a customer — that customer's. The backend decides who may see what.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return json({ lists: [] });

    return json({ lists: await listShoppingLists(shopper.shop, shopper.loggedInCustomerId) });
  } catch (error) {
    console.error("shopping-lists proxy error:", error);
    return json({ lists: [] }, 500);
  }
};

// POST { intent: "create", name, items } | { intent: "delete", id }
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return json({ message: "Sign in again" }, 401);

    const body = await request.json().catch(() => ({}));

    if (body.intent === "delete") {
      const result = await deleteShoppingList(shopper.shop, shopper.loggedInCustomerId, String(body.id ?? ""));
      return json(result.body ?? {}, result.status);
    }

    if (body.intent === "create") {
      const items = Array.isArray(body.items)
        ? body.items.map((i: any) => ({
            variantId: String(i.variantId ?? ""),
            quantity: Number(i.quantity),
            title: i.title,
            sku: i.sku,
          }))
        : [];
      const result = await createShoppingList(shopper.shop, shopper.loggedInCustomerId, String(body.name ?? ""), items);
      return json(result.body ?? {}, result.status);
    }

    return json({ message: "Unknown intent" }, 400);
  } catch (error) {
    console.error("shopping-lists proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
