import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  syncOrderFromWebhookPayload,
  type ShopifyOrderWebhookPayload,
} from "../services/orderSync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  await syncOrderFromWebhookPayload(shop, payload as ShopifyOrderWebhookPayload);

  return new Response();
};
