import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";

// Provisions a public Storefront API access token and stores it on a shop
// metafield (storefront: public_read) so the wholesale-pricing-embed script
// can read it straight from Liquid (`shop.metafields.sparklayer.storefront_token`)
// without any authenticated backend round-trip at page-render time.

const TOKEN_TITLE = "SparkLayer Wholesale Pricing Embed";

const EXISTING_TOKENS_QUERY = `#graphql
  query ExistingStorefrontAccessTokens {
    storefrontAccessTokens(first: 10) {
      nodes {
        accessToken
        title
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

const SHOP_ID_QUERY = `#graphql
  query ShopId {
    shop {
      id
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

export async function ensureStorefrontAccessToken(admin: AdminApiContext) {
  try {
    const existingRes = await admin.graphql(EXISTING_TOKENS_QUERY);
    const existingBody = await existingRes.json();
    const existing = (existingBody.data?.storefrontAccessTokens?.nodes || []).find(
      (t: { title: string }) => t.title === TOKEN_TITLE
    );

    let accessToken: string | undefined = existing?.accessToken;

    if (!accessToken) {
      const createRes = await admin.graphql(CREATE_TOKEN_MUTATION, {
        variables: { input: { title: TOKEN_TITLE } },
      });
      const createBody = await createRes.json();
      const errors = createBody.data?.storefrontAccessTokenCreate?.userErrors;
      if (errors?.length) {
        console.error("storefrontAccessTokenCreate errors:", errors);
        return;
      }
      accessToken = createBody.data?.storefrontAccessTokenCreate?.storefrontAccessToken?.accessToken;
    }

    if (!accessToken) return;

    const shopRes = await admin.graphql(SHOP_ID_QUERY);
    const shopBody = await shopRes.json();
    const shopId = shopBody.data?.shop?.id;
    if (!shopId) return;

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
  } catch (error) {
    console.error("ensureStorefrontAccessToken failed:", error);
  }
}
