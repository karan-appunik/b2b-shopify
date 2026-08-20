import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";

const CUSTOMER_PAYMENT_TERMS = `#graphql
  query CustomerPaymentTerms($customerId: ID!) {
    customer(id: $customerId) {
      companyContactProfiles {
        company {
          locations(first: 10) {
            edges {
              node {
                buyerExperienceConfiguration {
                  paymentTermsTemplate {
                    name
                    paymentTermsType
                    dueInDays
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { admin } = await authenticate.public.appProxy(request);

    const url = new URL(request.url);
    const loggedInCustomerId = url.searchParams.get("logged_in_customer_id");

    if (!admin || !loggedInCustomerId) {
      return new Response(JSON.stringify({ eligibleTerms: [] }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const response = await admin.graphql(CUSTOMER_PAYMENT_TERMS, {
      variables: { customerId: `gid://shopify/Customer/${loggedInCustomerId}` },
    });
    const body = await response.json();
    const profiles = body.data?.customer?.companyContactProfiles || [];

    // TEMP DEBUG: collect the raw templates we actually found so we can see
    // real field values instead of guessing at enum spelling.
    const debugTemplates: unknown[] = [];

    const eligible = new Set<string>();
    let netTermsDueInDays: number | null = null;
    for (const profile of profiles) {
      const edges = profile.company?.locations?.edges || [];
      for (const edge of edges) {
        const template = edge.node?.buyerExperienceConfiguration?.paymentTermsTemplate;
        debugTemplates.push(template);
        if (!template) continue;

        if (template.paymentTermsType === "NET") {
          eligible.add("net30");
          eligible.add("advance"); // Net terms customers can also pay in advance!
          netTermsDueInDays = template.dueInDays ?? netTermsDueInDays;
        } else if (
          template.paymentTermsType === "FULFILLMENT" ||
          template.paymentTermsType === "RECEIPT" ||
          template.paymentTermsType === "FIXED"
        ) {
          eligible.add("advance");
        }
      }
    }

    return new Response(
      JSON.stringify({
        eligibleTerms: Array.from(eligible),
        netTermsDueInDays: netTermsDueInDays,
        debugTemplates: debugTemplates,
        debugGraphqlErrors: (body as any).errors || null,
      }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("payment-terms proxy error:", error);
    // Fail safe: if we can't determine eligibility, show nothing as eligible
    // rather than error out the drawer.
    return new Response(JSON.stringify({ eligibleTerms: [] }), {
      headers: { "Content-Type": "application/json" },
    });
  }
};
