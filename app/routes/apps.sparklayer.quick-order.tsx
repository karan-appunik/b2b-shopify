import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentContext } from "../services/agentContext.server";
import { matchRows, parseQuickOrderText, type FoundVariant } from "../services/quickOrder.server";

const VARIANTS_BY_CODE = `#graphql
  query QuickOrderVariants($query: String!) {
    productVariants(first: 250, query: $query) {
      nodes {
        id
        sku
        barcode
        title
        availableForSale
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

// POST { text } — a pasted list ("SKU,5" per line), or a single scanned code.
// Every row is looked up on its own and answered on its own (spec §4.5): the
// browser adds the good rows and shows the reason for each bad one.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
    if (!admin || !session || !loggedInCustomerId) return json({ message: "Not authorized" }, 403);

    const agent = await getAgentContext(session.shop, loggedInCustomerId);
    if (!agent.isAgent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const parsed = parseQuickOrderText(String(body.text ?? ""));

    if (parsed.rows.length === 0) return json({ code: "EMPTY", message: "Paste at least one line" }, 400);
    if (parsed.tooMany) return json({ code: "TOO_MANY", message: "Add up to 200 lines at a time" }, 400);

    const codes = [...new Set(parsed.rows.filter((r) => !r.error).map((r) => r.code))];
    const found: FoundVariant[] = [];

    // 20 codes per search keeps each query small.
    for (let i = 0; i < codes.length; i += 20) {
      const chunk = codes.slice(i, i + 20);
      const query = chunk.map((c) => `sku:"${c}" OR barcode:"${c}"`).join(" OR ");
      const response = await admin.graphql(VARIANTS_BY_CODE, { variables: { query } });
      const data = (await response.json()) as any;

      for (const node of data.data?.productVariants?.nodes ?? []) {
        found.push({
          id: String(node.id).split("/").pop() as string,
          sku: node.sku,
          barcode: node.barcode,
          title: [node.product?.title, node.title !== "Default Title" ? node.title : null].filter(Boolean).join(" - "),
          availableForSale: node.availableForSale === true,
          active: node.product?.status === "ACTIVE",
        });
      }
    }

    return json({ rows: matchRows(parsed.rows, found) });
  } catch (error: any) {
    console.error("quick-order proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
