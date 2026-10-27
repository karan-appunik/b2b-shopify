import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { getAgentSession } from "../services/agentContext.server";

const CUSTOMER_ADDRESSES = `#graphql
  query CustomerAddresses($customerId: ID!) {
    customer(id: $customerId) {
      defaultAddress {
        id
      }
      addresses {
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
    }
  }
`;

// Mailing address ids look like "gid://shopify/MailingAddress/123?model_name=..."
function shortId(gid: string): string {
  return gid.split("/").pop()!.split("?")[0];
}

const json = (body: unknown) =>
  new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });

// While a sales agent is ordering for a customer, the cart drawer needs that
// customer's addresses (not the agent's own) for shipping. Only returned
// when the server holds a live context for the agent — never for a plain
// shopper, and never for a customer id supplied by the browser.
export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");

    if (!admin || !session || !loggedInCustomerId) return json({ active: false });

    const agentSession = await getAgentSession(session.shop, loggedInCustomerId);
    if (!agentSession.active || !agentSession.customer?.shopifyCustomerId) return json({ active: false });

    const response = await admin.graphql(CUSTOMER_ADDRESSES, {
      variables: { customerId: agentSession.customer.shopifyCustomerId },
    });
    const body = (await response.json()) as any;
    const customer = body.data?.customer;
    if (!customer) return json({ active: false });

    // Same snake_case shape the theme's Liquid `customer.addresses` produces,
    // so the cart drawer can use them interchangeably.
    const addresses = (customer.addresses || []).map((a: any) => ({
      id: shortId(a.id),
      first_name: a.firstName,
      last_name: a.lastName,
      company: a.company,
      address1: a.address1,
      address2: a.address2,
      city: a.city,
      province: a.province,
      province_code: a.provinceCode,
      zip: a.zip,
      country: a.country,
      country_code: a.countryCodeV2,
      phone: a.phone,
    }));

    return json({
      active: true,
      addresses,
      defaultAddressId: customer.defaultAddress ? shortId(customer.defaultAddress.id) : null,
    });
  } catch (error: any) {
    console.error("agent-addresses proxy error:", error);
    return json({ active: false });
  }
};
