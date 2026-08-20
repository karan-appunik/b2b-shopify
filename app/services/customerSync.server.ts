import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { unauthenticated } from "../shopify.server";

const CUSTOMERS_QUERY = `#graphql
  query SyncCustomers($cursor: String) {
    customers(first: 100, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          firstName
          lastName
          email
          tags
          defaultAddress {
            company
          }
          companyContactProfiles {
            company {
              id
              name
              locations(first: 1) {
                edges {
                  node {
                    id
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

const CUSTOMER_COMPANY_QUERY = `#graphql
  query CustomerCompany($id: ID!) {
    customer(id: $id) {
      companyContactProfiles {
        company {
          id
          name
          locations(first: 1) {
            edges {
              node {
                id
              }
            }
          }
        }
      }
    }
  }
`;

type CustomerRow = {
  email: string;
  name: string;
  company?: string;
  tags?: string[];
  shopifyCustomerId: string;
  shopifyCompanyId?: string;
  shopifyCompanyLocationId?: string;
  shopifyCompanyName?: string;
};

type CompanyContactProfile = {
  company: {
    id: string;
    name: string;
    locations: { edges: Array<{ node: { id: string } }> };
  } | null;
};

function firstCompanyInfo(profiles: CompanyContactProfile[] | null | undefined): {
  shopifyCompanyId?: string;
  shopifyCompanyLocationId?: string;
  shopifyCompanyName?: string;
} {
  const company = profiles?.[0]?.company;
  if (!company) return {};

  const locationId = company.locations.edges[0]?.node.id;
  return {
    shopifyCompanyId: company.id,
    shopifyCompanyLocationId: locationId,
    shopifyCompanyName: company.name,
  };
}

interface CustomersQueryResponse {
  data: {
    customers: {
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
      edges: Array<{
        node: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string | null;
          tags: string[];
          defaultAddress: { company: string | null } | null;
          companyContactProfiles: CompanyContactProfile[];
        };
      }>;
    };
  };
}

interface CustomerCompanyQueryResponse {
  data: {
    customer: { companyContactProfiles: CompanyContactProfile[] } | null;
  };
}

export interface ShopifyCustomerWebhookPayload {
  id: number | string;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  tags?: string | null;
  default_address?: { company?: string | null } | null;
}

function customerName(
  firstName: string | null | undefined,
  lastName: string | null | undefined,
  email: string | null | undefined,
): string {
  const full = [firstName, lastName].filter(Boolean).join(" ").trim();
  return full || email || "Unnamed customer";
}

async function fetchAllCustomerRows(admin: AdminApiContext): Promise<CustomerRow[]> {
  const rows: CustomerRow[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const response = await admin.graphql(CUSTOMERS_QUERY, { variables: { cursor } });
    const body = (await response.json()) as CustomersQueryResponse;
    const customersConnection = body.data.customers;

    for (const { node: customer } of customersConnection.edges) {
      if (!customer.email) continue;
      rows.push({
        email: customer.email,
        name: customerName(customer.firstName, customer.lastName, customer.email),
        company: customer.defaultAddress?.company || undefined,
        tags: customer.tags || [],
        shopifyCustomerId: customer.id,
        ...firstCompanyInfo(customer.companyContactProfiles),
      });
    }

    hasNextPage = customersConnection.pageInfo.hasNextPage;
    cursor = customersConnection.pageInfo.endCursor;
  }

  return rows;
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

function getBackendConfig(): { backendUrl: string; internalKey: string } | null {
  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_API_URL;
  // eslint-disable-next-line no-undef
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  if (!backendUrl || !internalKey) {
    console.error(
      "[customerSync] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set — skipping customer sync",
    );
    return null;
  }

  return { backendUrl, internalKey };
}

async function syncCustomerRows(rows: CustomerRow[]): Promise<void> {
  if (rows.length === 0) return;

  const config = getBackendConfig();
  if (!config) return;

  for (const batch of chunk(rows, 500)) {
    const res = await fetch(`${config.backendUrl}/api/internal/customers/sync`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": config.internalKey,
      },
      body: JSON.stringify({ customers: batch }),
    });

    if (!res.ok) {
      console.error("[customerSync] backend sync batch failed", res.status, await res.text());
    }
  }
}

async function cleanupRemovedCustomersOnBackend(activeCustomerIds: string[]): Promise<void> {
  const config = getBackendConfig();
  if (!config) return;

  const res = await fetch(`${config.backendUrl}/api/internal/customers/cleanup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": config.internalKey,
    },
    body: JSON.stringify({ activeCustomerIds }),
  });

  if (!res.ok) {
    console.error("[customerSync] backend cleanup failed", res.status, await res.text());
  }
}

export async function syncCustomersToBackend(admin: AdminApiContext): Promise<void> {
  if (!getBackendConfig()) return;

  try {
    const rows = await fetchAllCustomerRows(admin);

    await syncCustomerRows(rows);

    const activeCustomerIds = rows.map((r) => r.shopifyCustomerId);
    await cleanupRemovedCustomersOnBackend(activeCustomerIds);

    console.log(
      `[customerSync] synced ${rows.length} customer(s) and cleaned up removed customers on backend-api`,
    );
  } catch (err) {
    console.error("[customerSync] failed to sync customers to backend-api", err);
  }
}

async function fetchCompanyInfoForCustomer(
  shop: string,
  shopifyCustomerGid: string,
): Promise<ReturnType<typeof firstCompanyInfo>> {
  try {
    const { admin } = await unauthenticated.admin(shop);
    const response = await admin.graphql(CUSTOMER_COMPANY_QUERY, {
      variables: { id: shopifyCustomerGid },
    });
    const body = (await response.json()) as CustomerCompanyQueryResponse;
    return firstCompanyInfo(body.data.customer?.companyContactProfiles);
  } catch (err) {
    console.error("[customerSync] failed to look up company for webhook customer", err);
    return {};
  }
}

export async function syncCustomerFromWebhookPayload(
  shop: string,
  payload: ShopifyCustomerWebhookPayload,
): Promise<void> {
  if (!payload.email) return;

  const shopifyCustomerId = `gid://shopify/Customer/${payload.id}`;
  const companyInfo = await fetchCompanyInfoForCustomer(shop, shopifyCustomerId);

  const rows: CustomerRow[] = [
    {
      email: payload.email,
      name: customerName(payload.first_name, payload.last_name, payload.email),
      company: payload.default_address?.company || undefined,
      tags: payload.tags
        ? payload.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
      shopifyCustomerId,
      ...companyInfo,
    },
  ];

  try {
    await syncCustomerRows(rows);
    console.log(`[customerSync] synced customer ${payload.id}`);
  } catch (err) {
    console.error("[customerSync] failed to sync customer from webhook", err);
  }
}

export async function deleteCustomerByShopifyCustomerId(
  shopifyCustomerId: number | string,
): Promise<void> {
  const config = getBackendConfig();
  if (!config) return;

  try {
    const res = await fetch(
      `${config.backendUrl}/api/internal/customers/delete-by-shopify-customer`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-api-key": config.internalKey,
        },
        body: JSON.stringify({ shopifyCustomerId: String(shopifyCustomerId) }),
      },
    );

    if (!res.ok) {
      console.error("[customerSync] backend delete failed", res.status, await res.text());
    } else {
      console.log(`[customerSync] deleted customer for shopify customer ${shopifyCustomerId}`);
    }
  } catch (err) {
    console.error("[customerSync] failed to delete customer from webhook", err);
  }
}
