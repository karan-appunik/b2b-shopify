import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  syncOrderFromWebhookPayload,
  type ShopifyOrderWebhookPayload,
} from "../services/orderSync.server";
import { recordDiscountRedemptions } from "../services/discountLookup.server";
import { fireDiscountRedeemedFlowTrigger } from "../services/flowTrigger.server";

export const action = async ({ request }: ActionFunctionArgs) => {
  const { shop, topic, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop}`);

  const orderPayload = payload as ShopifyOrderWebhookPayload;

  await syncOrderFromWebhookPayload(shop, orderPayload);

  // The checkout proxy stashes which discounts it applied as a custom
  // attribute on the draft order rather than recording the redemption
  // itself, since a draft order isn't a paid order yet ("pay_now"/"net30"
  // buyers pay later on Shopify's hosted checkout, and may never finish).
  // This webhook only fires once Shopify has actually created the order, so
  // it's the single point where usage-limit redemptions get recorded.
  const discountIdsAttr = orderPayload.note_attributes?.find(
    (attr) => attr.name === "_sparklayer_discount_ids",
  );
  if (discountIdsAttr) {
    try {
      const discountIds = JSON.parse(discountIdsAttr.value);
      if (Array.isArray(discountIds) && discountIds.length > 0) {
        // docs.sparklayer.io/discounts "Data Tracking" — the checkout proxy
        // stashes pre-discount total/currency/per-discount savings alongside
        // the ids the same way; absent (e.g. an older order) is fine,
        // recordDiscountRedemptions treats meta as fully optional.
        const discountMetaAttr = orderPayload.note_attributes?.find(
          (attr) => attr.name === "_sparklayer_discount_meta",
        );
        let meta;
        if (discountMetaAttr) {
          try {
            meta = JSON.parse(discountMetaAttr.value);
          } catch (err) {
            console.error("[orders/create webhook] failed to parse discount meta", err);
          }
        }

        await recordDiscountRedemptions(
          shop,
          orderPayload.customer?.admin_graphql_api_id,
          discountIds,
          orderPayload.admin_graphql_api_id,
          meta,
        );

        // docs.sparklayer.io/discounts "Automations & Shopify Flow Integration"
        // Fire custom Flow trigger so merchants can automate downstream actions
        // (customer tagging, internal sales notifications, CRM/ERP updates).
        let totalSavings = 0;
        if (meta?.savings && typeof meta.savings === "object") {
          totalSavings = Object.values(meta.savings as Record<string, number>).reduce(
            (acc, s) => acc + (Number(s) || 0),
            0,
          );
        }

        const discountCodesList =
          orderPayload.discount_codes?.map((d: any) => d.code).filter(Boolean) || [];

        await fireDiscountRedeemedFlowTrigger(shop, {
          customer: orderPayload.customer
            ? {
                id: orderPayload.customer.admin_graphql_api_id,
                email: orderPayload.customer.email,
                firstName: orderPayload.customer.first_name,
                lastName: orderPayload.customer.last_name,
              }
            : null,
          order: {
            id: orderPayload.admin_graphql_api_id,
            name: orderPayload.name,
          },
          discountCodes: discountCodesList,
          amountSaved: totalSavings,
          currency: meta?.currency || orderPayload.currency || "USD",
          companyName: (orderPayload as any).company?.name || null,
          redeemedAt: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error("[orders/create webhook] failed to process discount flow & redemptions", err);
    }
  }

  return new Response();
};

