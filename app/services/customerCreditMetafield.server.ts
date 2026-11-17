import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

// Mirrors SparkLayer's real "Payment on account" customer metafield
// (docs.sparklayer.io/metafields — namespace "sparklayer", key
// "payment on account", JSON value with credit_limit/balance/net_terms).
// Shopify's metafield key validation doesn't allow spaces, so we use
// "payment_on_account" — same namespace, same JSON shape, same idea.
export const CREDIT_METAFIELD_NAMESPACE = "sparklayer";
export const CREDIT_METAFIELD_KEY = "payment_on_account";

export interface CreditMetafieldValue {
  credit_limit?: number | null;
  balance?: number;
  net_terms?: string | null;
  currency?: string | null;
}

const METAFIELD_DEFINITION_CREATE = `#graphql
  mutation EnsurePaymentOnAccountDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition { id }
      userErrors { field message code }
    }
  }
`;

// Registers the metafield definition on install so merchants can find and
// edit it under Shopify Admin > Customer > Metafields — same as SparkLayer's
// own "automatically add this to your shopify store" setup step. Safe to
// call repeatedly: a "TAKEN" userError just means it already exists.
export async function ensurePaymentOnAccountMetafieldDefinition(
  admin: AdminApiContext,
): Promise<void> {
  try {
    const response = await admin.graphql(METAFIELD_DEFINITION_CREATE, {
      variables: {
        definition: {
          name: "Payment on account",
          namespace: CREDIT_METAFIELD_NAMESPACE,
          key: CREDIT_METAFIELD_KEY,
          type: "json",
          ownerType: "CUSTOMER",
        },
      },
    });
    const body = await response.json();
    const userErrors = body.data?.metafieldDefinitionCreate?.userErrors || [];
    const alreadyExists = userErrors.some((e: any) => e.code === "TAKEN");
    if (userErrors.length && !alreadyExists) {
      console.error("[creditMetafield] failed to create definition", userErrors);
    }
  } catch (err) {
    console.error("[creditMetafield] failed to create metafield definition", err);
  }
}

const CUSTOMER_CREDIT_METAFIELD_QUERY = `#graphql
  query CustomerCreditMetafield($id: ID!) {
    customer(id: $id) {
      metafield(namespace: "${CREDIT_METAFIELD_NAMESPACE}", key: "${CREDIT_METAFIELD_KEY}") {
        value
      }
    }
  }
`;

export async function readCreditMetafield(
  admin: AdminApiContext,
  shopifyCustomerId: string,
): Promise<CreditMetafieldValue | null> {
  const response = await admin.graphql(CUSTOMER_CREDIT_METAFIELD_QUERY, {
    variables: { id: shopifyCustomerId },
  });
  const body = await response.json();
  const raw = body.data?.customer?.metafield?.value;
  if (!raw) return null;

  try {
    return JSON.parse(raw) as CreditMetafieldValue;
  } catch {
    return null;
  }
}

const METAFIELDS_SET = `#graphql
  mutation SetCreditMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors { field message }
    }
  }
`;

export async function writeCreditMetafield(
  admin: AdminApiContext,
  shopifyCustomerId: string,
  value: CreditMetafieldValue,
): Promise<void> {
  const response = await admin.graphql(METAFIELDS_SET, {
    variables: {
      metafields: [
        {
          ownerId: shopifyCustomerId,
          namespace: CREDIT_METAFIELD_NAMESPACE,
          key: CREDIT_METAFIELD_KEY,
          type: "json",
          value: JSON.stringify(value),
        },
      ],
    },
  });
  const body = await response.json();
  const userErrors = body.data?.metafieldsSet?.userErrors || [];
  if (userErrors.length) {
    console.error("[creditMetafield] failed to write metafield", userErrors);
  }
}
