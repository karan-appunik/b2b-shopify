import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { syncProductsToBackend } from "../services/productSync.server";
import { syncCustomersToBackend } from "../services/customerSync.server";
import { syncOrdersToBackend } from "../services/orderSync.server";
import { ensurePaymentOnAccountMetafieldDefinition } from "../services/customerCreditMetafield.server";

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

  return { merchantPanelUrl };
};

export default function Index() {
  const { merchantPanelUrl } = useLoaderData<typeof loader>();

  return (
    <s-page heading="Admin Frontend — Setup Verification">
      <s-section heading="Merchant Panel">
        <s-paragraph>
          Open the merchant-facing panel in a new tab.
        </s-paragraph>
        <s-button
          href={merchantPanelUrl}
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
