import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

// Provisions a public Storefront API access token and stores it on a shop
// metafield (storefront: public_read) so the wholesale-pricing-embed script
// can read it straight from Liquid (`shop.metafields.sparklayer.storefront_token`)
// without any authenticated backend round-trip at page-render time.
//
// There's no Admin GraphQL query to list a shop's existing storefront access
// tokens (only storefrontAccessTokenCreate exists — querying
// `storefrontAccessTokens` throws "doesn't exist on type 'QueryRoot'"), so
// the only reliable way to check for one we already made is to read back
// our own metafield rather than asking Shopify for the token list.

const TOKEN_TITLE = "SparkLayer Wholesale Pricing Embed";

const SHOP_TOKEN_METAFIELD_QUERY = `#graphql
  query ShopStorefrontTokenMetafield {
    shop {
      id
      metafield(namespace: "sparklayer", key: "storefront_token") {
        value
      }
    }
  }
`;

const CREATE_TOKEN_MUTATION = `#graphql
  mutation CreateStorefrontAccessToken($input: StorefrontAccessTokenInput!) {
    storefrontAccessTokenCreate(input: $input) {
      storefrontAccessToken {
        accessToken
        title
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const SET_METAFIELD_MUTATION = `#graphql
  mutation SetStorefrontTokenMetafield($metafields: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafields) {
      userErrors {
        field
        message
      }
    }
  }
`;

async function createAndStoreToken(admin: AdminApiContext, shopId: string): Promise<string | undefined> {
  const createRes = await admin.graphql(CREATE_TOKEN_MUTATION, {
    variables: { input: { title: TOKEN_TITLE } },
  });
  const createBody = await createRes.json();
  const errors = createBody.data?.storefrontAccessTokenCreate?.userErrors;
  if (errors?.length) {
    console.error("storefrontAccessTokenCreate errors:", errors);
    return undefined;
  }

  const accessToken = createBody.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;
  if (!accessToken) return undefined;

  const setRes = await admin.graphql(SET_METAFIELD_MUTATION, {
    variables: {
      metafields: [
        {
          ownerId: shopId,
          namespace: "sparklayer",
          key: "storefront_token",
          type: "single_line_text_field",
          value: accessToken,
        },
      ],
    },
  });
  const setBody = await setRes.json();
  const setErrors = setBody.data?.metafieldsSet?.userErrors;
  if (setErrors?.length) {
    console.error("metafieldsSet (storefront_token) errors:", setErrors);
  }

  return accessToken;
}

// Reads the token from our own shop metafield, creating and storing one on
// the spot if this shop doesn't have one yet (e.g. the afterAuth hook ran
// before this metafield existed).
export async function getStorefrontAccessToken(admin: AdminApiContext): Promise<string | undefined> {
  try {
    const shopRes = await admin.graphql(SHOP_TOKEN_METAFIELD_QUERY);
    const shopBody = await shopRes.json();
    const shopId = shopBody.data?.shop?.id;
    const existingValue = shopBody.data?.shop?.metafield?.value;
    if (existingValue) return existingValue;
    if (!shopId) return undefined;

    return await createAndStoreToken(admin, shopId);
  } catch (error) {
    console.error("getStorefrontAccessToken failed:", error);
    return undefined;
  }
}

export async function ensureStorefrontAccessToken(admin: AdminApiContext) {
  try {
    const shopRes = await admin.graphql(SHOP_TOKEN_METAFIELD_QUERY);
    const shopBody = await shopRes.json();
    const shopId = shopBody.data?.shop?.id;
    const existingValue = shopBody.data?.shop?.metafield?.value;
    if (existingValue || !shopId) return;

    await createAndStoreToken(admin, shopId);
  } catch (error) {
    console.error("ensureStorefrontAccessToken failed:", error);
  }
}
