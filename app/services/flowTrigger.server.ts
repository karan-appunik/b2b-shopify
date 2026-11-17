import { unauthenticated } from "../shopify.server";

// docs.sparklayer.io/discounts "Data Tracking" — lets a merchant build their
// own Shopify Flow automation (tag the customer, post to Slack, log a
// spreadsheet row, …) off the back of a discount actually being redeemed.
// We only ever emit the event; what happens next is entirely up to whatever
// Flow the merchant builds in the Flow editor against this trigger.
const FLOW_TRIGGER_MUTATION = `#graphql
  mutation SparkLayerDiscountRedeemedTrigger($handle: String!, $payload: JSON!) {
    flowTriggerReceive(handle: $handle, payload: $payload) {
      userErrors {
        field
        message
      }
    }
  }
`;

export interface DiscountRedeemedFlowInput {
  customer: {
    id?: string;
    email?: string | null;
    firstName?: string | null;
    lastName?: string | null;
  } | null;
  order: { id: string; name: string };
  discountCodes: string[];
  amountSaved: number;
  currency: string;
  companyName: string | null;
  redeemedAt: string;
}

export async function fireDiscountRedeemedFlowTrigger(
  shop: string,
  input: DiscountRedeemedFlowInput,
): Promise<void> {
  try {
    const { admin } = await unauthenticated.admin(shop);
    const response = await admin.graphql(FLOW_TRIGGER_MUTATION, {
      variables: {
        handle: "discount-redeemed",
        payload: {
          order_id: input.order.id,
          order_name: input.order.name,
          customer_id: input.customer?.id || "",
          customer_email: input.customer?.email || "",
          customer_name: [input.customer?.firstName, input.customer?.lastName].filter(Boolean).join(" "),
          company_name: input.companyName || "",
          coupon_codes: input.discountCodes.join(", "),
          total_savings: input.amountSaved,
          currency: input.currency,
          redeemed_at: input.redeemedAt,
        },
      },
    });
    const body = await response.json();
    const userErrors = body?.data?.flowTriggerReceive?.userErrors;
    if (userErrors?.length) {
      console.error("[flowTrigger] discount-redeemed trigger rejected", userErrors);
    }
  } catch (err) {
    // Best-effort — a merchant who hasn't built a Flow against this trigger
    // yet shouldn't ever see this fail the order webhook itself.
    console.error("[flowTrigger] failed to send discount-redeemed trigger", err);
  }
}
