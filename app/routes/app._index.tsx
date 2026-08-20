import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { syncProductsToBackend } from "../services/productSync.server";
import { syncCustomersToBackend } from "../services/customerSync.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Automatically sync store products and customers to the local MongoDB database
  await syncProductsToBackend(admin);
  await syncCustomersToBackend(admin);

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
