import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

const CUSTOMER_ADDRESS_CREATE = `#graphql
  mutation CustomerAddressCreate($customerId: ID!, $address: MailingAddressInput!) {
    customerAddressCreate(customerId: $customerId, address: $address) {
      address {
        id
        firstName
        lastName
        company
        address1
        address2
        city
        province
        provinceCode
        zip
        country
        countryCodeV2
        phone
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const CUSTOMER_UPDATE_DEFAULT_ADDRESS = `#graphql
  mutation CustomerUpdateDefaultAddress($customerId: ID!, $addressId: ID!) {
    customerUpdateDefaultAddress(customerId: $customerId, addressId: $addressId) {
      userErrors {
        field
        message
      }
    }
  }
`;

export const action = async ({ request }: ActionFunctionArgs) => {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const { admin } = await authenticate.public.appProxy(request);

    // Shopify appends this automatically to app proxy requests when the
    // storefront visitor has an active customer session — never trust a
    // customer id supplied by the request body instead.
    const url = new URL(request.url);
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    if (!admin || !loggedInCustomerId) {
      return new Response(JSON.stringify({ error: "Not logged in" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const payload = await request.json();

    if (!payload.firstName || !payload.lastName || !payload.address1 || !payload.city) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await admin.graphql(CUSTOMER_ADDRESS_CREATE, {
      variables: {
        customerId: `gid://shopify/Customer/${loggedInCustomerId}`,
        address: {
          firstName: payload.firstName,
          lastName: payload.lastName,
          company: payload.company || null,
          address1: payload.address1,
          address2: payload.address2 || null,
          city: payload.city,
          zip: payload.zip || null,
          provinceCode: payload.provinceCode || null,
          countryCode: payload.countryCode || null,
          phone: payload.phone || null,
        },
      },
    });

    const body = await response.json();
    const result = body.data?.customerAddressCreate;

    if (!result || result.userErrors?.length) {
      return new Response(
        JSON.stringify({ error: result?.userErrors?.[0]?.message || "Could not save address" }),
        { status: 422, headers: { "Content-Type": "application/json" } }
      );
    }

    const address = result.address;

    if (payload.setDefault) {
      const defaultResponse = await admin.graphql(CUSTOMER_UPDATE_DEFAULT_ADDRESS, {
        variables: {
          customerId: `gid://shopify/Customer/${loggedInCustomerId}`,
          addressId: address.id,
        },
      });
      const defaultBody = await defaultResponse.json();
      const defaultErrors = defaultBody.data?.customerUpdateDefaultAddress?.userErrors;
      if (defaultErrors?.length) {
        console.error("customer-address set-default error:", defaultErrors);
      }
    }

    return new Response(
      JSON.stringify({
        address: {
          id: address.id.split("/").pop(),
          firstName: address.firstName,
          lastName: address.lastName,
          company: address.company,
          address1: address.address1,
          address2: address.address2,
          city: address.city,
          province: address.province,
          province_code: address.provinceCode,
          zip: address.zip,
          country: address.country,
          country_code: address.countryCodeV2,
          phone: address.phone,
        },
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("customer-address proxy error:", error);
    return new Response(JSON.stringify({ error: error.message || String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
