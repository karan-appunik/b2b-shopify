import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { reportIfPaidViaLink } from "../services/paymentLinkReport.server";
import {
  syncOrderFromWebhookPayload,
  type ShopifyOrderWebhookPayload,
} from "../services/orderSync.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const orderPayload = payload as ShopifyOrderWebhookPayload;
  await syncOrderFromWebhookPayload(shop, orderPayload);

  // An order paid through a payment link: tell the backend so the link is
  // closed and checked against the amount it asked for.
  await reportIfPaidViaLink(shop, orderPayload);

  return new Response();
};
