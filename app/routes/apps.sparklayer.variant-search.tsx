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
        product { title featuredImage { url } }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const q = url.searchParams.get("q")?.trim();

    if (!admin || !q) {
      return new Response(JSON.stringify({ variants: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // Shopify's search query language treats `field:value` as a single field
    // filter, so a scoped, multi-word phrase (e.g. a product title containing
    // spaces or a colon) doesn't parse the way a single-field match does. An
    // unscoped, per-word prefix search (Shopify's default full-text index)
    // matches title, SKU, barcode, vendor, etc. without that fragility.
    const words = q.replace(/["\\]/g, "").split(/[\s:]+/).filter(Boolean);

    if (words.length === 0) {
      return new Response(JSON.stringify({ variants: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const query = words.map((word) => `${word}*`).join(" ");
    const response = await admin.graphql(VARIANTS_SEARCH, {
      variables: { query },
    });
    const body = await response.json();
    const nodes = body.data?.productVariants?.nodes || [];

    const variants = nodes.map((node: any) => ({
      id: node.id.split("/").pop(),
      sku: node.sku,
      price: node.price,
      image: node.image?.url || node.product?.featuredImage?.url || null,
      productTitle: node.product?.title,
      variantTitle: node.title,
    }));

    return new Response(JSON.stringify({ variants }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Proxy error:", error);
    return new Response(
      JSON.stringify({
        error: error.message || String(error),
        stack: error.stack || null,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
};
