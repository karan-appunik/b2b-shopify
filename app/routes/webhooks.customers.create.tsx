import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  syncCustomerFromWebhookPayload,
  type ShopifyCustomerWebhookPayload,
} from "../services/customerSync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await syncCustomerFromWebhookPayload(shop, payload as ShopifyCustomerWebhookPayload);

  return new Response();
};
