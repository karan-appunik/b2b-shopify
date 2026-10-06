import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { syncProductsToBackend } from "../services/productSync.server";
import { syncCustomersToBackend } from "../services/customerSync.server";
import { syncOrdersToBackend } from "../services/orderSync.server";
import { ensurePaymentOnAccountMetafieldDefinition } from "../services/customerCreditMetafield.server";

// Mirrors how the real SparkLayer app auto-logs the store owner into its own
// dashboard from Shopify admin — no separate merchant-panel email/password.
// protectInternal on the backend trusts this because it's a server-to-server
// call carrying BACKEND_INTERNAL_API_KEY, never exposed to the browser.
async function getMerchantPanelSsoToken(shop: string): Promise<string | null> {
  const backendUrl = process.env.BACKEND_API_URL;
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;
  if (!backendUrl || !internalKey) return null;

  const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/internal/auth/sso`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-api-key": internalKey },
    body: JSON.stringify({ shop }),
  });
  if (!res.ok) return null;

  const data = await res.json();
  return data.token ?? null;
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  // afterAuth only fires on install/re-auth, not on every page load — this is
  // the same no-reinstall backfill trick used for the product/customer/order
  // syncs below, so the metafield definition appears even on an app that was
  // already installed before this feature existed.
  await ensurePaymentOnAccountMetafieldDefinition(admin);

  // Automatically sync store products, customers and orders to the local MongoDB database
  await syncProductsToBackend(admin, session.shop);
  await syncCustomersToBackend(admin, session.shop);
  await syncOrdersToBackend(admin, session.shop);

  const merchantPanelUrl = process.env.MERCHANT_PANEL_URL || "";
  const ssoToken = merchantPanelUrl ? await getMerchantPanelSsoToken(session.shop) : null;
  const merchantPanelOpenUrl =
    merchantPanelUrl && ssoToken
      ? `${merchantPanelUrl.replace(/\/$/, "")}/sso?token=${encodeURIComponent(ssoToken)}`
      : merchantPanelUrl;

  return { merchantPanelUrl, merchantPanelOpenUrl };
};

export default function Index() {
  const { merchantPanelUrl, merchantPanelOpenUrl } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Admin Frontend — Setup Verification">
      <s-section heading="Merchant Panel">
        <s-paragraph>
          Open the merchant-facing panel in a new tab — you&apos;ll be signed in automatically.
        </s-paragraph>
        <s-button
          href={merchantPanelOpenUrl}
          target="_blank"
          variant="primary"
          disabled={!merchantPanelUrl}
        >
          Open Merchant Panel
        </s-button>
        {!merchantPanelUrl && (
          <s-paragraph tone="critical">
            MERCHANT_PANEL_URL is not set in .env.
          </s-paragraph>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
