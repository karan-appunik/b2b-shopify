import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { apiVersion } from "../shopify.server";
import { getStorefrontAccessToken } from "./storefrontToken.server";

const CART_DELIVERY_OPTIONS_MUTATION = `#graphql
  mutation CartCreateForShipping($input: CartInput!) {
    cartCreate(input: $input) {
      cart {
        deliveryGroups(first: 5) {
          nodes {
            deliveryOptions {
              handle
              title
              estimatedCost {
                amount
                currencyCode
              }
            }
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
`;

interface ShippingAddressInput {
  address1?: string;
  address2?: string;
  city?: string;
  company?: string;
  countryCode?: string;
  provinceCode?: string;
  zip?: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface ShippingLine {
  title: string;
  price: string;
}

// "Advance before shipping" and "Payment on Account" complete the draft
// order directly (see apps.sparklayer.checkout.tsx) so the buyer never
// visits Shopify's hosted checkout — nothing ever calculates a shipping
// cost for them, and the draft order silently ships for $0. This asks the
// Storefront API for the same delivery rates hosted checkout would have
// shown (via the Storefront token already provisioned for the wholesale
// pricing embed) and returns the cheapest one to charge instead.
export async function calculateShippingLine(
  admin: AdminApiContext,
  shop: string,
  variantLines: Array<{ variantId: string; quantity: number }>,
  shippingAddress: ShippingAddressInput | undefined,
): Promise<ShippingLine | null> {
  if (!shippingAddress || !variantLines.length) {
    console.error("[shippingRate] missing shippingAddress or variantLines:", {
      hasShippingAddress: Boolean(shippingAddress),
      lineCount: variantLines.length,
    });
    return null;
  }

  const token = await getStorefrontAccessToken(admin);
  if (!token) {
    console.error("[shippingRate] no storefront access token available");
    return null;
  }

  const countryName = shippingAddress.countryCode
    ? new Intl.DisplayNames(["en"], { type: "region" }).of(shippingAddress.countryCode) ||
      shippingAddress.countryCode
    : undefined;

  const input = {
    lines: variantLines.map((line) => ({
      merchandiseId: line.variantId,
      quantity: line.quantity,
    })),
    buyerIdentity: {
      countryCode: shippingAddress.countryCode || undefined,
      // NOTE: this prices the cart at plain retail, not this B2B customer's
      // negotiated/wholesale rate — buyerIdentity.companyLocationId would
      // fix that, but Shopify rejects it without an accompanying
      // customerAccessToken ("The customer access token is required when
      // setting a company location"), and this app has no way to mint one
      // server-side (that needs the customer's password or a Customer
      // Account API OAuth token — app proxy's logged_in_customer_id gives
      // us neither). So a cart can occasionally cross a different
      // free-shipping threshold here than the customer's real order value
      // would. Left as a known gap rather than worked around.
      deliveryAddressPreferences: [
        {
          deliveryAddress: {
            address1: shippingAddress.address1,
            address2: shippingAddress.address2,
            city: shippingAddress.city,
            company: shippingAddress.company,
            country: countryName,
            province: shippingAddress.provinceCode,
            zip: shippingAddress.zip,
            firstName: shippingAddress.firstName,
            lastName: shippingAddress.lastName,
            phone: shippingAddress.phone,
          },
        },
      ],
    },
  };

  try {
    const response = await fetch(`https://${shop}/api/${apiVersion}/graphql.json`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query: CART_DELIVERY_OPTIONS_MUTATION, variables: { input } }),
    });

    const body = await response.json();

    // Top-level `errors` means the query itself was rejected (bad field,
    // wrong type, etc.) — distinct from `userErrors`, which means the query
    // ran fine but the cart/address input was invalid. Logging both is the
    // only way to tell which one we're looking at from the server logs.
    if (body.errors?.length) {
      console.error("[shippingRate] GraphQL errors:", JSON.stringify(body.errors));
      return null;
    }

    const errors = body.data?.cartCreate?.userErrors;
    if (errors?.length) {
      console.error("[shippingRate] cartCreate userErrors:", errors);
      return null;
    }

    type DeliveryOption = { title: string; estimatedCost: { amount: string } };
    const groups: Array<{ deliveryOptions?: DeliveryOption[] }> = body.data?.cartCreate?.cart?.deliveryGroups?.nodes || [];
    const options: DeliveryOption[] = groups.flatMap((g) => g.deliveryOptions || []);
    if (!options.length) {
      console.error("[shippingRate] no delivery options returned:", JSON.stringify(body.data?.cartCreate?.cart));
      return null;
    }

    const cheapest = options.reduce((min, opt) =>
      Number(opt.estimatedCost.amount) < Number(min.estimatedCost.amount) ? opt : min,
    );

    return { title: cheapest.title || "Standard", price: cheapest.estimatedCost.amount };
  } catch (error) {
    console.error("[shippingRate] calculateShippingLine failed:", error);
    return null;
  }
}
