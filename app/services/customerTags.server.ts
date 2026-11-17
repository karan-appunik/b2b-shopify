import { unauthenticated } from "../shopify.server";

const TAGS_REMOVE = `#graphql
  mutation TagsRemove($id: ID!, $tags: [String!]!) {
    tagsRemove(id: $id, tags: $tags) {
      userErrors { field message }
    }
  }
`;

export interface RemoveCustomerTagsInput {
  shop: string;
  shopifyCustomerId: string;
  tags: string[];
}

export interface RemoveCustomerTagsResult {
  error?: string;
}

// Takes tags off one Shopify customer, e.g. the provisional tag once the
// merchant approves a new account.
export async function removeCustomerTags(input: RemoveCustomerTagsInput): Promise<RemoveCustomerTagsResult> {
  const { shop, shopifyCustomerId, tags } = input;
  if (!shop || !shopifyCustomerId || !tags?.length) {
    return { error: "shop, shopifyCustomerId and tags are required" };
  }

  const { admin } = await unauthenticated.admin(shop);
  const res = await admin.graphql(TAGS_REMOVE, { variables: { id: shopifyCustomerId, tags } });
  const body = await res.json();
  const errors = body.data?.tagsRemove?.userErrors;
  if (errors?.length) {
    console.error("[customerTags] failed to remove tags", shopifyCustomerId, errors);
    return { error: errors.map((e: { message: string }) => e.message).join("; ") };
  }
  return {};
}
