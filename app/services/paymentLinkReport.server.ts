import { reportPaymentLinkPaid } from "./agentContext.server";
import type { ShopifyOrderWebhookPayload } from "./orderSync.server";

// When an order that came from a payment link shows as paid, tell the backend
// so the link is closed and its amount is checked against what was paid. The
// checkout proxy stamps the link's token on the draft order, and Shopify
// carries it onto the order. Safe to call for every order update: the backend
// ignores a payment it has already recorded.
export async function reportIfPaidViaLink(shop: string, payload: ShopifyOrderWebhookPayload) {
  const token = payload.note_attributes?.find((attr) => attr.name === "_sparklayer_payment_link")?.value;
  if (!token) return;

  const status = String(payload.financial_status ?? "").toLowerCase();
  if (status !== "paid" && status !== "partially_paid") return;

  try {
    await reportPaymentLinkPaid(
      shop,
      token,
      payload.admin_graphql_api_id,
      Math.round(Number(payload.total_price) * 100),
      payload.currency,
      {
        shipping: Math.round(Number(payload.total_shipping_price_set?.shop_money?.amount ?? 0) * 100) || 0,
        tax: Math.round(Number(payload.total_tax ?? 0) * 100) || 0,
      },
    );
  } catch (err) {
    console.error("[paymentLink] could not report payment", err);
  }
}
