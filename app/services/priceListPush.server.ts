import prisma from "../db.server";
import { unauthenticated } from "../shopify.server";

const WHOLESALE_PRICE_NAMESPACE = "sparklayer";
const WHOLESALE_PRICE_KEY = "wholesale_price";

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

const SEGMENT_CREATE = `#graphql
  mutation SegmentCreate($name: String!, $query: String!) {
    segmentCreate(name: $name, query: $query) {
      segment { id }
      userErrors { field message }
    }
  }
`;

const DISCOUNT_CREATE = `#graphql
  mutation DiscountAutomaticBasicCreate($automaticBasicDiscount: DiscountAutomaticBasicInput!) {
    discountAutomaticBasicCreate(automaticBasicDiscount: $automaticBasicDiscount) {
      automaticDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

const DISCOUNT_UPDATE = `#graphql
  mutation DiscountAutomaticBasicUpdate($id: ID!, $automaticBasicDiscount: DiscountAutomaticBasicInput!) {
    discountAutomaticBasicUpdate(id: $id, automaticBasicDiscount: $automaticBasicDiscount) {
      automaticDiscountNode { id }
      userErrors { field message code }
    }
  }
`;

const DISCOUNT_DELETE = `#graphql
  mutation DiscountAutomaticDelete($id: ID!) {
    discountAutomaticDelete(id: $id) {
      userErrors { field message }
    }
  }
`;

const VARIANT_PRICES_QUERY = `#graphql
  query VariantPrices($ids: [ID!]!) {
    nodes(ids: $ids) {
      ... on ProductVariant {
        id
        contextualPricing(context: { country: US }) { price { amount } }
      }
    }
  }
`;

export interface PushPriceListInput {
  priceListName: string;
  currency: string;
  tag: string;
  prices: Array<{ variantId: string; amount: string }>;
  previousVariantIds?: string[];
  addCustomerIds: string[];
  removeCustomerIds: string[];
  shopifySegmentId?: string | null;
  discountItems: Array<{
    variantId: string;
    productTitle: string;
    discountAmount: number;
    shopifyDiscountId?: string | null;
  }>;
  removedDiscountIds?: string[];
}

export interface PushPriceListResult {
  success?: boolean;
  updatedCount?: number;
  shopifySegmentId?: string;
  itemDiscountIds?: Array<{ variantId: string; shopifyDiscountId: string }>;
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
          metafields: batch.map((ownerId) => ({
            ownerId,
            namespace: WHOLESALE_PRICE_NAMESPACE,
            key: WHOLESALE_PRICE_KEY,
          })),
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
  for (const batch of chunk(input.prices, 25)) {
    const setRes = await admin.graphql(METAFIELDS_SET, {
      variables: {
        metafields: batch.map((p) => ({
          ownerId: p.variantId,
          namespace: WHOLESALE_PRICE_NAMESPACE,
          key: WHOLESALE_PRICE_KEY,
          type: "number_decimal",
          value: p.amount,
        })),
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
): Promise<void> {
  for (const customerId of addCustomerIds) {
    const res = await admin.graphql(TAGS_ADD, { variables: { id: customerId, tags: [tag] } });
    const body = await res.json();
    const errors = body.data?.tagsAdd?.userErrors;
    if (errors?.length) {
      console.error("[priceListPush] failed to tag customer", customerId, errors);
    }
  }

  for (const customerId of removeCustomerIds) {
    const res = await admin.graphql(TAGS_REMOVE, { variables: { id: customerId, tags: [tag] } });
    const body = await res.json();
    const errors = body.data?.tagsRemove?.userErrors;
    if (errors?.length) {
      console.error("[priceListPush] failed to untag customer", customerId, errors);
    }
  }
}

async function ensureSegment(
  admin: Awaited<ReturnType<typeof getAdminForFirstShop>>,
  priceListName: string,
  tag: string,
  existingSegmentId?: string | null,
): Promise<{ segmentId?: string; error?: string }> {
  if (existingSegmentId) {
    return { segmentId: existingSegmentId };
  }

  const res = await admin.graphql(SEGMENT_CREATE, {
    variables: {
      name: `SparkLayer — ${priceListName}`,
      query: `customer_tags CONTAINS '${tag}'`,
    },
  });
  const body = await res.json();
  const errors = body.data?.segmentCreate?.userErrors;
  if (errors?.length) {
    return { error: errors.map((e: { message: string }) => e.message).join("; ") };
  }
  const segmentId = body.data?.segmentCreate?.segment?.id;
  if (!segmentId) return { error: "Shopify did not return a segment id" };
  return { segmentId };
}

async function fetchLiveVariantPrices(
  admin: Awaited<ReturnType<typeof getAdminForFirstShop>>,
  variantIds: string[],
): Promise<Map<string, number>> {
  const prices = new Map<string, number>();
  for (const batch of chunk(variantIds, 100)) {
    const res = await admin.graphql(VARIANT_PRICES_QUERY, { variables: { ids: batch } });
    const body = await res.json();
    for (const node of body.data?.nodes || []) {
      const amount = node?.contextualPricing?.price?.amount;
      if (node?.id && amount != null) prices.set(node.id, Number(amount));
    }
  }
  return prices;
}

async function syncDiscounts(
  admin: Awaited<ReturnType<typeof getAdminForFirstShop>>,
  input: PushPriceListInput,
  segmentId: string,
): Promise<{ itemDiscountIds: Array<{ variantId: string; shopifyDiscountId: string }>; error?: string }> {
  const itemDiscountIds: Array<{ variantId: string; shopifyDiscountId: string }> = [];

  // discountAmount must be relative to Shopify's live variant price, not the
  // caller-supplied value, otherwise a stale price on the caller's side
  // silently over/under-discounts the item at checkout.
  const wholesaleByVariant = new Map(input.prices.map((p) => [p.variantId, Number(p.amount)]));
  const livePrices = await fetchLiveVariantPrices(
    admin,
    input.discountItems.map((item) => item.variantId),
  );

  for (const rawItem of input.discountItems) {
    const livePrice = livePrices.get(rawItem.variantId);
    const wholesalePrice = wholesaleByVariant.get(rawItem.variantId);
    const item =
      livePrice != null && wholesalePrice != null
        ? { ...rawItem, discountAmount: Number((livePrice - wholesalePrice).toFixed(2)) }
        : rawItem;

    if (item.discountAmount <= 0) {
      if (item.shopifyDiscountId) {
        const res = await admin.graphql(DISCOUNT_DELETE, { variables: { id: item.shopifyDiscountId } });
        const body = await res.json();
        const errors = body.data?.discountAutomaticDelete?.userErrors;
        if (errors?.length) {
          console.error("[priceListPush] failed to delete zero-discount item", errors);
        }
      }
      continue;
    }

    const discountInput = {
      title: `${input.priceListName} — ${item.productTitle} (${item.variantId})`,
      startsAt: new Date().toISOString(),
      context: { customerSegments: { add: [segmentId] } },
      customerGets: {
        value: {
          discountAmount: {
            amount: item.discountAmount.toFixed(2),
            appliesOnEachItem: true,
          },
        },
        items: { products: { productVariantsToAdd: [item.variantId] } },
      },
    };

    if (item.shopifyDiscountId) {
      const res = await admin.graphql(DISCOUNT_UPDATE, {
        variables: { id: item.shopifyDiscountId, automaticBasicDiscount: discountInput },
      });
      const body = await res.json();
      const errors = body.data?.discountAutomaticBasicUpdate?.userErrors;
      if (errors?.length) {
        return { itemDiscountIds, error: errors.map((e: { message: string }) => e.message).join("; ") };
      }
      itemDiscountIds.push({ variantId: item.variantId, shopifyDiscountId: item.shopifyDiscountId });
    } else {
      const res = await admin.graphql(DISCOUNT_CREATE, {
        variables: { automaticBasicDiscount: discountInput },
      });
      const body = await res.json();
      const errors = body.data?.discountAutomaticBasicCreate?.userErrors;
      if (errors?.length) {
        return { itemDiscountIds, error: errors.map((e: { message: string }) => e.message).join("; ") };
      }
      const newId = body.data?.discountAutomaticBasicCreate?.automaticDiscountNode?.id;
      if (newId) itemDiscountIds.push({ variantId: item.variantId, shopifyDiscountId: newId });
    }
  }

  for (const discountId of input.removedDiscountIds || []) {
    const res = await admin.graphql(DISCOUNT_DELETE, { variables: { id: discountId } });
    const body = await res.json();
    const errors = body.data?.discountAutomaticDelete?.userErrors;
    if (errors?.length) {
      console.error("[priceListPush] failed to delete removed discount", errors);
    }
  }

  return { itemDiscountIds };
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

    await syncCustomerTags(admin, input.tag, input.addCustomerIds, input.removeCustomerIds);

    const segmentResult = await ensureSegment(
      admin,
      input.priceListName,
      input.tag,
      input.shopifySegmentId,
    );
    if (segmentResult.error || !segmentResult.segmentId) {
      return { error: segmentResult.error || "Could not create customer segment" };
    }

    const discountResult = await syncDiscounts(admin, input, segmentResult.segmentId);
    if (discountResult.error) {
      return { error: discountResult.error };
    }

    return {
      success: true,
      updatedCount: metafieldResult.updatedCount,
      shopifySegmentId: segmentResult.segmentId,
      itemDiscountIds: discountResult.itemDiscountIds,
    };
  } catch (err) {
    console.error("[priceListPush] failed to push price list to Shopify", err);
    return { error: err instanceof Error ? err.message : "Unknown error pushing to Shopify" };
  }
}
