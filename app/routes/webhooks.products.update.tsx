import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  syncProductFromWebhookPayload,
  type ShopifyProductWebhookPayload,
} from "../services/productSync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await syncProductFromWebhookPayload(payload as ShopifyProductWebhookPayload);

  return new Response();
};
