import type { ActionFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { checkNewCustomer, getAgentContext, recordNewCustomer } from "../services/agentContext.server";

const CUSTOMER_CREATE = `#graphql
  mutation AgentCustomerCreate($input: CustomerInput!) {
    customerCreate(input: $input) {
      customer {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// POST { customer, confirmNotDuplicate } — a privileged agent creates a
// provisional customer (spec §3.4). The backend checks permission, step-up,
// mandatory fields, consent and duplicates first; only then is the account
// created in Shopify, and the backend records it. Creating the account does
// not open it: starting an order for it is a separate step.
export const action = async ({ request }: ActionFunctionArgs) => {
  try {
    const { admin, session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
    if (!admin || !session || !loggedInCustomerId) return json({ message: "Not authorized" }, 403);

    const agent = await getAgentContext(session.shop, loggedInCustomerId);
    if (!agent.isAgent) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const customer = (body.customer ?? {}) as Record<string, any>;
    const confirm = body.confirmNotDuplicate === true;

    const checked = await checkNewCustomer(session.shop, loggedInCustomerId, customer, confirm);
    if (checked.status !== 200) return json(checked.body ?? { message: "Could not create the customer" }, checked.status || 502);

    const a = customer.address ?? {};
    const input: Record<string, unknown> = {
      email: String(customer.email).trim().toLowerCase(),
      firstName: String(customer.firstName).trim(),
      lastName: String(customer.lastName).trim(),
      phone: customer.phone ? String(customer.phone).trim() : undefined,
      tags: checked.body.tags,
      note: "Created by a sales agent. Pending approval.",
      addresses: [
        {
          firstName: String(customer.firstName).trim(),
          lastName: String(customer.lastName).trim(),
          company: String(customer.companyName).trim(),
          address1: String(a.address1).trim(),
          address2: a.address2 ? String(a.address2).trim() : undefined,
          city: String(a.city).trim(),
          zip: String(a.zip).trim(),
          provinceCode: a.provinceCode ? String(a.provinceCode).trim() : undefined,
          countryCode: String(a.countryCode).trim().toUpperCase(),
          phone: customer.phone ? String(customer.phone).trim() : undefined,
        },
      ],
    };
    if (customer.marketingConsent === true) {
      input.emailMarketingConsent = { marketingState: "SUBSCRIBED", marketingOptInLevel: "SINGLE_OPT_IN" };
    }

    const created = (await (await admin.graphql(CUSTOMER_CREATE, { variables: { input } })).json()) as any;
    const result = created.data?.customerCreate;

    if (!result?.customer || result.userErrors?.length) {
      if (!result?.userErrors?.length) console.error("agent-new-customer: Shopify returned no customer", JSON.stringify(created.errors ?? created));
      const message = result?.userErrors?.[0]?.message || created.errors?.[0]?.message || "Could not create the customer";
      const taken = /taken|already/i.test(message);
      return json({ code: taken ? "DUPLICATE_EMAIL" : "SHOPIFY_REJECTED", message }, taken ? 409 : 422);
    }

    const recorded = await recordNewCustomer(
      session.shop,
      loggedInCustomerId,
      result.customer.id,
      customer,
      checked.body.duplicatesConfirmed === true,
    );
    if (recorded.status !== 201) {
      // The account exists in Shopify and will sync through the webhook, but
      // our own record (access, audit) is missing: say so rather than hide it.
      return json({ code: "RECORD_FAILED", message: "The customer was created, but could not be added to your accounts yet. Try again in a moment." }, 502);
    }

    return json({
      id: recorded.body.id,
      name: `${customer.firstName} ${customer.lastName}`.trim(),
      company: customer.companyName,
      provisional: true,
    }, 201);
  } catch (error: any) {
    console.error("agent-new-customer proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
