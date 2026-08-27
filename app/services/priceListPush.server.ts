import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";

const WHOLESALE_PRICE_NAMESPACE = "sparklayer";
const WHOLESALE_PRICE_KEY = "wholesale_price";
const WHOLESALE_PRICE_TIERS_KEY = "wholesale_price_tiers";

const METAFIELDS_SET = `#graphql
  mutation MetafieldsSet($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      metafields { id }
      userErrors { field message code }
    }
  }
`;

const METAFIELDS_DELETE = `#graphql
  mutation MetafieldsDelete($metafields: [MetafieldIdentifierInput!]!) {
    metafieldsDelete(metafields: $metafields) {
      deletedMetafields { key }
      userErrors { field message }
    }
  }
`;

const TAGS_ADD = `#graphql
  mutation TagsAdd($id: ID!, $tags: [String!]!) {
    tagsAdd(id: $id, tags: $tags) {
      userErrors { field message }
    }
  }
`;

const TAGS_REMOVE = `#graphql
  mutation TagsRemove($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) {
      userErrors { field message }
    }
  }
`;

export interface PushPriceListInput {
  priceListName: string;
  currency: string;
  tag: string;
  prices: Array<{
    variantId: string;
    amount: string;
    tiers: Array<{ minQuantity: number; price: number }>;
  }>;
  previousVariantIds?: string[];
  addCustomerIds: string[];
  removeCustomerIds: string[];
}

export interface PushPriceListResult {
  success?: boolean;
  updatedCount?: number;
  failedTagCustomerIds?: string[];
  error?: string;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function getAdminForFirstShop() {
  const session = await prisma.session.findFirst({ orderBy: { expires: "desc" } });
  if (!session) {
    throw new Error("No Shopify session found — open the admin app at least once first");
  }
  const { admin } = await unauthenticated.admin(session.shop);
  return admin;
}

async function syncMetafields(
  admin: Awaited<ReturnType<typeof getAdminForFirstShop>>,
  input: PushPriceListInput,
): Promise<{ updatedCount: number; error?: string }> {
  const currentVariantIds = new Set(input.prices.map((p) => p.variantId));
  const removedVariantIds = (input.previousVariantIds || []).filter(
    (id) => !currentVariantIds.has(id),
  );

  if (removedVariantIds.length > 0) {
    for (const batch of chunk(removedVariantIds, 25)) {
      const deleteRes = await admin.graphql(METAFIELDS_DELETE, {
        variables: {
          metafields: batch.flatMap((ownerId) => [
            { ownerId, namespace: WHOLESALE_PRICE_NAMESPACE, key: WHOLESALE_PRICE_KEY },
            { ownerId, namespace: WHOLESALE_PRICE_NAMESPACE, key: WHOLESALE_PRICE_TIERS_KEY },
          ]),
        },
      });
      const deleteBody = await deleteRes.json();
      const deleteErrors = deleteBody.data?.metafieldsDelete?.userErrors;
      if (deleteErrors?.length) {
        console.error("[priceListPush] failed to delete removed metafields", deleteErrors);
      }
    }
  }

  let updatedCount = 0;
  // Batch of 12 prices -> 24 metafield writes per call, staying under the
  // same ~25-per-request budget the delete loop above uses.
  for (const batch of chunk(input.prices, 12)) {
    const setRes = await admin.graphql(METAFIELDS_SET, {
      variables: {
        metafields: batch.flatMap((p) => [
          {
            ownerId: p.variantId,
            namespace: WHOLESALE_PRICE_NAMESPACE,
            key: WHOLESALE_PRICE_KEY,
            type: "number_decimal",
            value: p.amount,
          },
          {
            ownerId: p.variantId,
            namespace: WHOLESALE_PRICE_NAMESPACE,
            key: WHOLESALE_PRICE_TIERS_KEY,
            // Plain text (not Shopify's "json" metafield type) so Liquid's
            // `metafield.value` is always guaranteed to be the raw string —
            // `| parse_json` in Liquid then decodes the tier list.
            type: "multi_line_text_field",
            value: JSON.stringify(p.tiers),
          },
        ]),
      },
    });
    const setBody = await setRes.json();
    const setErrors = setBody.data?.metafieldsSet?.userErrors;
    if (setErrors?.length) {
      return { updatedCount, error: setErrors.map((e: { message: string }) => e.message).join("; ") };
    }
    updatedCount += setBody.data?.metafieldsSet?.metafields?.length || 0;
  }

  return { updatedCount };
}

async function syncCustomerTags(
  admin: Awaited<ReturnType<typeof getAdminForFirstShop>>,
  tag: string,
  addCustomerIds: string[],
  removeCustomerIds: string[],
): Promise<{ failedCustomerIds: string[] }> {
  const failedCustomerIds: string[] = [];

  for (const customerId of addCustomerIds) {
    const res = await admin.graphql(TAGS_ADD, { variables: { id: customerId, tags: [tag] } });
    const body = await res.json();
    const errors = body.data?.tagsAdd?.userErrors;
    if (errors?.length) {
      console.error("[priceListPush] failed to tag customer", customerId, errors);
      failedCustomerIds.push(customerId);
    }
  }

  for (const customerId of removeCustomerIds) {
    const res = await admin.graphql(TAGS_REMOVE, { variables: { id: customerId, tags: [tag] } });
    const body = await res.json();
    const errors = body.data?.tagsRemove?.userErrors;
    if (errors?.length) {
      console.error("[priceListPush] failed to untag customer", customerId, errors);
      failedCustomerIds.push(customerId);
    }
  }

  return { failedCustomerIds };
}

export async function pushPriceListToShopify(
  input: PushPriceListInput,
): Promise<PushPriceListResult> {
  if (input.prices.length === 0) {
    return { error: "Price list has no priced products" };
  }

  const admin = await getAdminForFirstShop();

  try {
    const metafieldResult = await syncMetafields(admin, input);
    if (metafieldResult.error) {
      return { error: metafieldResult.error };
    }

    // Tags are pure group-membership identifiers now (matching SparkLayer's
    // model: a fixed base tag + one group-specific tag) — no Shopify Segment
    // or Automatic Discount is created here anymore. Actual wholesale price
    // enforcement happens in apps.sparklayer.checkout.tsx, which looks up
    // each line item's sparklayer.wholesale_price metafield directly instead
    // of depending on a Shopify-side discount having already applied.
    const tagResult = await syncCustomerTags(
      admin,
      input.tag,
      input.addCustomerIds,
      input.removeCustomerIds,
    );

    return {
      success: true,
      updatedCount: metafieldResult.updatedCount,
      failedTagCustomerIds: tagResult.failedCustomerIds,
    };
  } catch (err) {
    console.error("[priceListPush] failed to push price list to Shopify", err);
    return { error: err instanceof Error ? err.message : "Unknown error pushing to Shopify" };
  }
}
