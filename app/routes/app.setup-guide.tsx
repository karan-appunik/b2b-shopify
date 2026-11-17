import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { syncProductsToBackend } from "../services/productSync.server";
import { syncCustomersToBackend } from "../services/customerSync.server";
import { syncOrdersToBackend } from "../services/orderSync.server";
import { ensurePaymentOnAccountMetafieldDefinition } from "../services/customerCreditMetafield.server";

async function getMerchantPanelSsoToken(shop: string): Promise<string | null> {
  const backendUrl = process.env.BACKEND_API_URL;
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;
  if (!backendUrl || !internalKey) return null;

  try {
    const res = await fetch(`${backendUrl.replace(/\/$/, "")}/api/internal/auth/sso`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-api-key": internalKey },
      body: JSON.stringify({ shop }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.token ?? null;
  } catch {
    return null;
  }
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);

  await ensurePaymentOnAccountMetafieldDefinition(admin);

  // Auto-sync products, customers and orders to backend
  await syncProductsToBackend(admin, session.shop);
  await syncCustomersToBackend(admin, session.shop);
  await syncOrdersToBackend(admin, session.shop);

  const merchantPanelUrl = process.env.MERCHANT_PANEL_URL || "";
  const ssoToken = merchantPanelUrl ? await getMerchantPanelSsoToken(session.shop) : null;
  const merchantPanelOpenUrl =
    merchantPanelUrl && ssoToken
      ? `${merchantPanelUrl.replace(/\/$/, "")}/sso?token=${encodeURIComponent(ssoToken)}`
      : merchantPanelUrl;

  const shopDomain = session.shop;
  const themeEditorUrl = `https://${shopDomain}/admin/themes/current/editor?context=apps`;
  const storefrontUrl = `https://${shopDomain}`;

  return {
    shopDomain,
    merchantPanelUrl,
    merchantPanelOpenUrl,
    themeEditorUrl,
    storefrontUrl,
  };
};

export default function SetupGuidePage() {
  const {
    merchantPanelUrl,
    merchantPanelOpenUrl,
    themeEditorUrl,
    storefrontUrl,
  } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Setup Guide">
      {/* 1. Merchant Panel Card */}
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

      {/* 2. Setup Checklist: Enable Cart Drawer in Theme */}
      <s-section heading="Setup Checklist: Enable Cart Drawer in Theme">
        <s-badge tone="warning">Action Required</s-badge>
        <s-paragraph>
          Enable the <strong>SparkLayer Cart Drawer</strong> app embed on your active Shopify theme so wholesale customers can view tier pricing, use Net 30 payment terms, and place B2B orders.
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            Click <strong>Open Theme Editor</strong> below to go directly to your active theme&apos;s App Embeds.
          </s-list-item>
          <s-list-item>
            Turn the toggle <strong>ON</strong> next to <strong>SparkLayer Cart Drawer</strong>.
          </s-list-item>
          <s-list-item>
            Click <strong>Save</strong> in the top-right corner of the Shopify Theme Editor.
          </s-list-item>
          <s-list-item>
            In the Theme Editor, open <strong>Theme settings → Cart</strong> and set <strong>Cart type</strong> to <strong>Drawer</strong>. With <em>Page</em> or <em>Popup notification</em>, your theme has no cart drawer and SparkLayer cannot show in it.
          </s-list-item>
        </s-unordered-list>
        <s-button-group>
          <s-button
            href={themeEditorUrl}
            target="_blank"
            variant="primary"
          >
            Open Theme Editor (App Embeds)
          </s-button>
          <s-button
            href={storefrontUrl}
            target="_blank"
            variant="secondary"
          >
            Preview Storefront
          </s-button>
        </s-button-group>
      </s-section>

      {/* 3. Store Setup Guide */}
      <s-section heading="Store Setup Guide">
        <s-paragraph>
          Follow these steps to complete your wholesale B2B store configuration:
        </s-paragraph>
        <s-unordered-list>
          <s-list-item>
            <strong>Step 1 — Products &amp; Inventory Sync:</strong> Your Shopify catalog syncs automatically with the B2B pricing engine.
          </s-list-item>
          <s-list-item>
            <strong>Step 2 — Wholesale Price Lists:</strong> Create tiered pricing, percentage discounts, or fixed trade prices in the Merchant Panel.
          </s-list-item>
          <s-list-item>
            <strong>Step 3 — Customer Payment Terms:</strong> Tag B2B customers and assign Net 30 payment terms or custom credit limits.
          </s-list-item>
          <s-list-item>
            <strong>Step 4 — Sales Reps &amp; Approvals:</strong> Assign sales agents who can build draft orders and request price overrides in the drawer.
          </s-list-item>
        </s-unordered-list>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

