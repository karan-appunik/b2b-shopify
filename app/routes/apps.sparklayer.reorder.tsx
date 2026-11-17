import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { authorizeOnBehalf, resolveEffectiveCustomerId } from "../services/agentContext.server";
import { applySubstitutes, evaluateReorder, type PastLine, type Substitute, type SubstituteVariant } from "../services/reorder.server";
import { getModuleSettings } from "../services/agentContext.server";
import { fetchVariantPricing, pickTierPrice } from "../services/variantPricing.server";

const REORDER_QUERY = `#graphql
  query ReorderOrder($id: ID!) {
    order(id: $id) {
      id
      name
      customer {
        id
      }
      lineItems(first: 100) {
        nodes {
          title
          sku
          quantity
          variant {
            id
            title
            availableForSale
            inventoryPolicy
            inventoryQuantity
            product {
              title
              status
            }
          }
        }
      }
    }
  }
`;

const SUBSTITUTE_QUERY = `#graphql
  query ReorderSubstitute($query: String!) {
    productVariants(first: 5, query: $query) {
      nodes {
        id
        sku
        title
        availableForSale
        inventoryPolicy
        inventoryQuantity
        product {
          title
          status
        }
      }
    }
  }
`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// POST { orderId } — what the lines of an earlier order would be today
// (spec §3.5). Nothing is added here: the agent sees each line's outcome and
// today's price, then confirms. Old prices, tax and promises are never copied.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
    if (!admin || !session || !loggedInCustomerId) return json({ error: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const orderId = String(body.orderId ?? "");
    if (!/^gid:\/\/shopify\/Order\/\d+$/.test(orderId)) return json({ error: "Order not found" }, 404);

    // Ordering for a customer needs the right to change their cart.
    const permission = await authorizeOnBehalf(session.shop, loggedInCustomerId, "cart.write");
    if (permission.onBehalf && !permission.allowed) return json({ error: "Your role can't change this customer's cart." }, 403);

    const response = await admin.graphql(REORDER_QUERY, { variables: { id: orderId } });
    const order = ((await response.json()) as any).data?.order;
    if (!order) return json({ error: "Order not found" }, 404);

    // Only the customer's own orders (the one being ordered for, for an agent).
    const effective = await resolveEffectiveCustomerId(session.shop, loggedInCustomerId);
    if (String(order.customer?.id ?? "").split("/").pop() !== effective) return json({ error: "Not authorized" }, 403);

    const lines: PastLine[] = (order.lineItems?.nodes ?? []).map((n: any) => ({
      title: n.title,
      sku: n.sku,
      quantity: n.quantity,
      variant: n.variant
        ? {
            id: n.variant.id,
            title: n.variant.title,
            availableForSale: n.variant.availableForSale === true,
            inventoryPolicy: n.variant.inventoryPolicy,
            inventoryQuantity: n.variant.inventoryQuantity,
            product: n.variant.product ? { title: n.variant.product.title, status: n.variant.product.status } : null,
          }
        : null,
    }));

    let rows = evaluateReorder(lines);

    // Items that can't be added may have a replacement the merchant set up. It
    // is offered, not added: the agent has to accept it.
    if (permission.onBehalf) {
      const settings = await getModuleSettings(session.shop);
      const configured = new Map<string, Substitute>(settings.substitutes.map((s) => [s.fromSku.toLowerCase(), { toSku: s.toSku, note: s.note ?? undefined }]));
      const wanted = [...new Set(rows.filter((r) => (r.status === "UNAVAILABLE" || r.status === "RESTRICTED") && r.sku && configured.has(r.sku.toLowerCase())).map((r) => configured.get(r.sku!.toLowerCase())!.toSku))];
      const found = new Map<string, SubstituteVariant>();
      for (const sku of wanted) {
        const res = await admin.graphql(SUBSTITUTE_QUERY, { variables: { query: `sku:${JSON.stringify(sku)}` } });
        const node = (((await res.json()) as any).data?.productVariants?.nodes ?? []).find((n: any) => String(n.sku || "").toLowerCase() === sku.toLowerCase());
        if (node) {
          found.set(sku.toLowerCase(), {
            id: node.id,
            sku: node.sku,
            title: [node.product?.title, node.title !== "Default Title" ? node.title : null].filter(Boolean).join(" - "),
            availableForSale: node.availableForSale === true,
            inventoryPolicy: node.inventoryPolicy,
            inventoryQuantity: node.inventoryQuantity,
            productStatus: node.product?.status ?? null,
          });
        }
      }
      rows = applySubstitutes(rows, configured, found);
    }

    // Today's price for what can be added (the customer's own wholesale price).
    const currency = String(body.currency || "USD").toUpperCase();
    const gids = rows.filter((r) => r.variantId && r.quantity > 0).map((r) => `gid://shopify/ProductVariant/${r.variantId}`);
    const pricing = gids.length ? await fetchVariantPricing(admin, gids, currency) : new Map();

    return json({
      orderName: order.name,
      rows: rows.map((r) => {
        const p = r.variantId ? pricing.get(`gid://shopify/ProductVariant/${r.variantId}`) : null;
        const tier = p ? pickTierPrice(p.tiers, r.quantity) : null;
        const unit = p ? (tier != null && tier < p.price ? tier : p.price) : null;
        return { ...r, unitPrice: unit };
      }),
    });
  } catch (error) {
    console.error("reorder proxy error:", error);
    return json({ error: "Something went wrong" }, 500);
  }
};
