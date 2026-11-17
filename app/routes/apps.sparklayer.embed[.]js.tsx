import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getEmbedScript } from "../services/embedScript.server";

// The one shared JS file every SparkLayer Forms embed snippet loads
// (`<script src="/apps/sparklayer/embed.js">`). Its content is identical for
// every shop/form, but it still goes through the app proxy (rather than
// being served as a plain static asset) so it's only ever requested via a
// legitimate Shopify storefront, consistent with the other proxy routes.
//
// Cache-Control: no-store is intentional — this script is what previously
// forced merchants to re-copy-paste their embed snippet every time we
// improved it. Serving it fresh on every load is what fixes that: a snippet
// pasted once keeps picking up future improvements automatically.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);

    if (!session) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(getEmbedScript(), {
      headers: { "Content-Type": "application/javascript; charset=utf-8", "Cache-Control": "no-store" },
    });
  } catch (error: any) {
    console.error("embed.js proxy loader error:", error);
    return new Response("", { status: 500, headers: { "Content-Type": "application/javascript" } });
  }
};
