function getBackendConfig(): { backendUrl: string; internalKey: string } | null {
  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_API_URL;
  // eslint-disable-next-line no-undef
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  if (!backendUrl || !internalKey) {
    console.error("[agentContext] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set");
    return null;
  }

  return { backendUrl, internalKey };
}

export interface AgentContext {
  isAgent: boolean;
  role?: string;
  name?: string;
  email?: string;
}

export interface B2bCustomerResult {
  id: string;
  name: string;
  email: string;
  company: string | null;
  shopifyCustomerId: string;
}

// Whether the shopper currently on the storefront (identified by Shopify's
// logged_in_customer_id) is a sales agent/administrator in our system — the
// gate for showing the agent search UI and letting them search other
// customers at all.
export async function getAgentContext(
  shop: string,
  loggedInCustomerId: string | null,
): Promise<AgentContext> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId) return { isAgent: false };

  try {
    const shopifyCustomerId = `gid://shopify/Customer/${loggedInCustomerId}`;
    const res = await fetch(
      `${config.backendUrl}/api/internal/customers/agent-context?shop=${encodeURIComponent(shop)}&shopifyCustomerId=${encodeURIComponent(shopifyCustomerId)}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return { isAgent: false };
    return (await res.json()) as AgentContext;
  } catch (err) {
    console.error("[agentContext] failed to fetch agent context", err);
    return { isAgent: false };
  }
}

export async function searchB2bCustomers(shop: string, q: string): Promise<B2bCustomerResult[]> {
  const config = getBackendConfig();
  if (!config || !q.trim()) return [];

  try {
    const res = await fetch(
      `${config.backendUrl}/api/internal/customers/search?shop=${encodeURIComponent(shop)}&q=${encodeURIComponent(q)}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return [];
    return (await res.json()) as B2bCustomerResult[];
  } catch (err) {
    console.error("[agentContext] failed to search customers", err);
    return [];
  }
}
