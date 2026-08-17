import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

const VARIANTS_SEARCH = `#graphql
  query VariantsSearch($query: String!) {
    productVariants(first: 10, query: $query) {
      nodes {
        id
        title
        sku
        price
        image { url }
        product { title }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.public.appProxy(request);

  const url = new URL(request.url);
  const q = url.searchParams.get("q")?.trim();

  if (!admin || !q) {
    return new Response(JSON.stringify({ variants: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  const escaped = q.replace(/"/g, '\\"');
  const response = await admin.graphql(VARIANTS_SEARCH, {
    variables: { query: `sku:*${escaped}* OR barcode:*${escaped}*` },
  });
  const body = await response.json();
  const nodes = body.data?.productVariants?.nodes || [];

  const variants = nodes.map((node: any) => ({
    id: node.id.split("/").pop(),
    sku: node.sku,
    price: node.price,
    image: node.image?.url || null,
    productTitle: node.product?.title,
    variantTitle: node.title,
  }));

  return new Response(JSON.stringify({ variants }), {
    headers: { "Content-Type": "application/json" },
  });
};
