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
  // "active", "suspended" or "merged"; and whether another account looks like it.
  status?: string;
  similar?: boolean;
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

// Results are limited server-side to the customers this agent has been
// granted access to — the backend re-checks the agent on every call.
export async function searchB2bCustomers(
  shop: string,
  q: string,
  agentCustomerId: string,
): Promise<B2bCustomerResult[]> {
  const config = getBackendConfig();
  if (!config || !q.trim() || !agentCustomerId) return [];

  try {
    const agentShopifyCustomerId = `gid://shopify/Customer/${agentCustomerId}`;
    const res = await fetch(
      `${config.backendUrl}/api/internal/customers/search?shop=${encodeURIComponent(shop)}&q=${encodeURIComponent(q)}&agentShopifyCustomerId=${encodeURIComponent(agentShopifyCustomerId)}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return [];
    return (await res.json()) as B2bCustomerResult[];
  } catch (err) {
    console.error("[agentContext] failed to search customers", err);
    return [];
  }
}

export interface AgentSession {
  active: boolean;
  // "STALE" when the agent's access changed since they started: reading
  // carries on, changes wait for a refresh.
  state?: "ACTIVE" | "STALE";
  contextId?: string;
  expiresAt?: string;
  customer?: B2bCustomerResult;
}

export interface EnterSessionResult {
  ok: boolean;
  session?: AgentSession;
  // Set when the refusal is something the agent can fix (e.g. MFA_REQUIRED).
  code?: string;
}

function toGid(loggedInCustomerId: string): string {
  return `gid://shopify/Customer/${loggedInCustomerId}`;
}

// The agent's live "acting for customer" context, kept server-side so the
// backend — not the browser — decides who the agent is representing.
export async function getAgentSession(shop: string, loggedInCustomerId: string): Promise<AgentSession> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId) return { active: false };

  try {
    const res = await fetch(
      `${config.backendUrl}/api/internal/agent/contexts/current?shop=${encodeURIComponent(shop)}&agentShopifyCustomerId=${encodeURIComponent(toGid(loggedInCustomerId))}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return { active: false };
    const data = await res.json();
    return data.active ? { ...data, active: true } : { active: false };
  } catch (err) {
    console.error("[agentContext] failed to read agent session", err);
    return { active: false };
  }
}

export async function enterAgentSession(
  shop: string,
  loggedInCustomerId: string,
  customerId: string,
  meta: { clientIp?: string; userAgent?: string } = {},
): Promise<EnterSessionResult> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId || !customerId) return { ok: false };

  try {
    const res = await fetch(`${config.backendUrl}/api/internal/agent/contexts`, {
      method: "POST",
      headers: { "x-internal-api-key": config.internalKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        agentShopifyCustomerId: toGid(loggedInCustomerId),
        customerId,
        ...meta,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => null);
      return { ok: false, code: body?.code === "MFA_REQUIRED" ? "MFA_REQUIRED" : undefined };
    }
    return { ok: true, session: { ...(await res.json()), active: true } };
  } catch (err) {
    console.error("[agentContext] failed to enter agent session", err);
    return { ok: false };
  }
}

export async function exitAgentSession(
  shop: string,
  loggedInCustomerId: string,
  contextId: string,
): Promise<void> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId || !contextId) return;

  try {
    await fetch(
      `${config.backendUrl}/api/internal/agent/contexts/${encodeURIComponent(contextId)}?shop=${encodeURIComponent(shop)}&agentShopifyCustomerId=${encodeURIComponent(toGid(loggedInCustomerId))}`,
      { method: "DELETE", headers: { "x-internal-api-key": config.internalKey } },
    );
  } catch (err) {
    console.error("[agentContext] failed to exit agent session", err);
  }
}

export type OrderActor =
  | { kind: "self" }
  | { kind: "on_behalf"; customerId: string; contextId: string }
  | { kind: "error"; code: string; message: string };

// Decides who a checkout is really for. An agent only orders on a customer's
// behalf when the cart explicitly claims a context (`claimedContextId`, the
// one the Agent Mode bar is showing) AND the server still has that exact
// context live — so a stale tab, an expired context or a revoked grant
// fails loudly instead of silently placing the order for the wrong account
// (or for the agent themselves while the banner says otherwise).
export async function resolveOrderActor(
  shop: string,
  loggedInCustomerId: string | null,
  claimedContextId: unknown,
): Promise<OrderActor> {
  const claimed = typeof claimedContextId === "string" && claimedContextId ? claimedContextId : null;

  if (!loggedInCustomerId) return { kind: "self" };

  const session = await getAgentSession(shop, loggedInCustomerId);

  if (!claimed) return { kind: "self" };

  if (!session.active || session.contextId !== claimed || !session.customer?.shopifyCustomerId) {
    return {
      kind: "error",
      code: "CONTEXT_EXPIRED",
      message: "Your customer session has expired or changed. Please re-select the customer and try again.",
    };
  }

  return {
    kind: "on_behalf",
    customerId: session.customer.shopifyCustomerId.split("/").pop() as string,
    contextId: session.contextId,
  };
}

export interface AgentDashboard {
  agent: { name: string; email: string; role: string };
  assignedCount: number;
  accounts: { id: string; name: string; email: string; company: string | null; territory: string | null }[];
  month: { orders: number; revenue: { currency: string; amount: number }[] };
}

// What the Sales Agent Portal shows on load. The backend scopes it to the
// accounts this agent has been granted.
export async function getAgentDashboard(
  shop: string,
  loggedInCustomerId: string,
): Promise<AgentDashboard | null> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId) return null;

  try {
    const res = await fetch(
      `${config.backendUrl}/api/internal/agent/dashboard?shop=${encodeURIComponent(shop)}&agentShopifyCustomerId=${encodeURIComponent(toGid(loggedInCustomerId))}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return null;
    return (await res.json()) as AgentDashboard;
  } catch (err) {
    console.error("[agentContext] failed to load agent dashboard", err);
    return null;
  }
}

// The Shopify customer id that customer-specific data (credit, payment terms,
// orders, addresses) should be read for. While a sales agent has a live
// context it is the customer they represent, decided by the server — never
// by anything the browser sends — otherwise it is the logged-in shopper.
export async function resolveEffectiveCustomerId(
  shop: string,
  loggedInCustomerId: string | null,
): Promise<string | null> {
  if (!loggedInCustomerId) return null;

  const session = await getAgentSession(shop, loggedInCustomerId);
  if (session.active && session.customer?.shopifyCustomerId) {
    return session.customer.shopifyCustomerId.split("/").pop() as string;
  }

  return loggedInCustomerId;
}

export interface AgentCartLine {
  variantId: string;
  quantity: number;
}

export interface AgentCart {
  items: AgentCartLine[];
  currency: string | null;
  version: number;
}

// The cart saved on the server for the customer the agent is currently
// ordering for. The customer and context come from the server-held session,
// never from the browser, so an agent can only touch the cart of an account
// they are presently authorized for.
export async function getAgentCart(shop: string, loggedInCustomerId: string): Promise<AgentCart | null> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId) return null;

  const session = await getAgentSession(shop, loggedInCustomerId);
  if (!session.active || !session.contextId) return null;

  try {
    const res = await fetch(
      `${config.backendUrl}/api/internal/agent/carts/current?shop=${encodeURIComponent(shop)}&agentShopifyCustomerId=${encodeURIComponent(toGid(loggedInCustomerId))}&contextId=${encodeURIComponent(session.contextId)}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return null;
    return (await res.json()) as AgentCart;
  } catch (err) {
    console.error("[agentContext] failed to load agent cart", err);
    return null;
  }
}

export async function saveAgentCart(
  shop: string,
  loggedInCustomerId: string,
  items: AgentCartLine[],
  currency: string | null,
  expectedVersion?: number | null,
): Promise<(AgentCart & { conflict?: boolean }) | null> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId) return null;

  const session = await getAgentSession(shop, loggedInCustomerId);
  if (!session.active || !session.contextId) return null;

  try {
    const res = await fetch(`${config.backendUrl}/api/internal/agent/carts/current`, {
      method: "PUT",
      headers: { "x-internal-api-key": config.internalKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        agentShopifyCustomerId: toGid(loggedInCustomerId),
        contextId: session.contextId,
        items,
        currency,
        expectedVersion: expectedVersion ?? undefined,
      }),
    });

    // Another device saved first: hand its cart back so the agent can choose.
    if (res.status === 409) return { ...((await res.json()) as AgentCart), conflict: true };
    if (!res.ok) return null;
    return (await res.json()) as AgentCart;
  } catch (err) {
    console.error("[agentContext] failed to save agent cart", err);
    return null;
  }
}

export interface OnBehalfDecision {
  // The limits on the permission (for order.submit: the order mode).
  constraints?: { mode?: string } | null;
  // False when the shopper isn't currently acting for a customer, in which
  // case no agent permission applies.
  onBehalf: boolean;
  allowed: boolean;
  reason?: string;
  // True when the answer is "we couldn't ask" (the server was down), not "no".
  unavailable?: boolean;
}

// Asks the backend whether the agent's role lets them do `permission` while
// ordering for a customer. The role is evaluated on the server every time
// (spec §2.2), so editing a role in the merchant panel takes effect on the
// agent's next action. Fails closed: if the backend can't be reached the
// action is not allowed.
export async function authorizeOnBehalf(
  shop: string,
  loggedInCustomerId: string,
  permission: string,
): Promise<OnBehalfDecision> {
  const config = getBackendConfig();
  const session = await getAgentSession(shop, loggedInCustomerId);

  if (!session.active || !session.contextId) return { onBehalf: false, allowed: true };
  if (!config) return { onBehalf: true, allowed: false };

  try {
    const res = await fetch(`${config.backendUrl}/api/internal/agent/authorize`, {
      method: "POST",
      headers: { "x-internal-api-key": config.internalKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        shop,
        agentShopifyCustomerId: toGid(loggedInCustomerId),
        contextId: session.contextId,
        permission,
      }),
    });

    if (!res.ok) {
      const failed = await res.json().catch(() => null);
      return { onBehalf: true, allowed: false, reason: failed?.code, unavailable: res.status >= 500 };
    }
    const body = await res.json();
    return { onBehalf: true, allowed: body.allowed === true, reason: body.reason, constraints: body.constraints ?? null };
  } catch (err) {
    console.error("[agentContext] failed to authorize agent action", err);
    return { onBehalf: true, allowed: false, unavailable: true };
  }
}

export interface MfaStatus {
  required: boolean;
  enrolled: boolean;
  verified: boolean;
  locked: boolean;
}

// Authenticator-app (TOTP) check for sales agents. The agent is always the
// signed-in storefront shopper; the backend holds the secret and the rules.
export async function getMfaStatus(shop: string, loggedInCustomerId: string): Promise<MfaStatus | null> {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId) return null;

  try {
    const res = await fetch(
      `${config.backendUrl}/api/internal/agent/mfa/status?shop=${encodeURIComponent(shop)}&agentShopifyCustomerId=${encodeURIComponent(toGid(loggedInCustomerId))}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );
    return res.ok ? ((await res.json()) as MfaStatus) : null;
  } catch (err) {
    console.error("[agentContext] failed to read MFA status", err);
    return null;
  }
}

async function mfaPost(path: string, shop: string, loggedInCustomerId: string, extra: object = {}) {
  const config = getBackendConfig();
  if (!config || !loggedInCustomerId) return { status: 500, body: null as any };

  try {
    const res = await fetch(`${config.backendUrl}/api/internal/agent/mfa/${path}`, {
      method: "POST",
      headers: { "x-internal-api-key": config.internalKey, "Content-Type": "application/json" },
      body: JSON.stringify({ shop, agentShopifyCustomerId: toGid(loggedInCustomerId), ...extra }),
    });
    return { status: res.status, body: (await res.json().catch(() => null)) as any };
  } catch (err) {
    console.error(`[agentContext] MFA ${path} failed`, err);
    return { status: 500, body: null as any };
  }
}

export const startMfaEnrollment = (shop: string, loggedInCustomerId: string) =>
  mfaPost("enroll", shop, loggedInCustomerId);

// "session" is the normal check when signing in; "step_up" is the fresh check
// asked for before a high-risk action such as changing a price.
export const verifyMfaCode = (
  shop: string,
  loggedInCustomerId: string,
  code: string,
  purpose: "session" | "step_up" = "session",
) => mfaPost("verify", shop, loggedInCustomerId, { code, purpose });

// ---- exceptions (price overrides) and approvals ---------------------------
// The customer and context always come from the server-held session, never
// from the browser.

async function backendRequest(
  method: "GET" | "POST",
  path: string,
  query: Record<string, string>,
  body?: Record<string, unknown>,
): Promise<{ status: number; body: any }> {
  const config = getBackendConfig();
  if (!config) return { status: 500, body: null };

  try {
    const url = new URL(`${config.backendUrl}${path}`);
    for (const [key, value] of Object.entries(query)) url.searchParams.set(key, value);

    const res = await fetch(url, {
      method,
      headers: { "x-internal-api-key": config.internalKey, "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: res.status, body: await res.json().catch(() => null) };
  } catch (err) {
    console.error(`[agentContext] ${method} ${path} failed`, err);
    return { status: 500, body: null };
  }
}

async function activeContext(shop: string, loggedInCustomerId: string) {
  const session = await getAgentSession(shop, loggedInCustomerId);
  if (!session.active || !session.contextId) return null;
  return { contextId: session.contextId, agentShopifyCustomerId: toGid(loggedInCustomerId) };
}

export async function getAgentOverrides(shop: string, loggedInCustomerId: string) {
  const context = await activeContext(shop, loggedInCustomerId);
  if (!context) return [];

  const res = await backendRequest("GET", "/api/internal/agent/overrides", { shop, ...context });
  return res.status === 200 && Array.isArray(res.body?.overrides) ? res.body.overrides : [];
}

export async function getAgentOverridesWithStatus(shop: string, loggedInCustomerId: string) {
  const context = await activeContext(shop, loggedInCustomerId);
  if (!context) return { overrides: [], enabled: false };

  const res = await backendRequest("GET", "/api/internal/agent/overrides", { shop, ...context });
  return {
    overrides: res.status === 200 && Array.isArray(res.body?.overrides) ? res.body.overrides : [],
    enabled: res.status === 200 && res.body?.enabled !== false,
  };
}

export async function requestAgentOverride(
  shop: string,
  loggedInCustomerId: string,
  input: Record<string, unknown>,
) {
  const context = await activeContext(shop, loggedInCustomerId);
  if (!context) return { status: 401, body: { code: "CONTEXT_REQUIRED", message: "Customer context is required" } };

  return backendRequest("POST", "/api/internal/agent/overrides", {}, { shop, ...context, ...input });
}

export async function cancelAgentOverride(shop: string, loggedInCustomerId: string, id: string) {
  return backendRequest(
    "POST",
    `/api/internal/agent/overrides/${encodeURIComponent(id)}/cancel`,
    {},
    { shop, agentShopifyCustomerId: toGid(loggedInCustomerId) },
  );
}

export async function markOverridesApplied(
  shop: string,
  loggedInCustomerId: string,
  ids: string[],
  orderId: string,
) {
  const context = await activeContext(shop, loggedInCustomerId);
  if (!context || ids.length === 0) return;

  await backendRequest("POST", "/api/internal/agent/overrides/applied", {}, { shop, ...context, ids, orderId });
}

export async function listAgentApprovals(shop: string, loggedInCustomerId: string) {
  const res = await backendRequest("GET", "/api/internal/agent/approvals", {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
  });

  const ok = res.status === 200;
  return {
    approvals: ok && Array.isArray(res.body?.approvals) ? res.body.approvals : [],
    // True when approvals are waiting but the agent must confirm with their
    // authenticator first.
    needsStepUp: ok && res.body?.needsStepUp === true,
  };
}

export async function decideAgentApproval(
  shop: string,
  loggedInCustomerId: string,
  id: string,
  decision: string,
  comment: string,
) {
  return backendRequest(
    "POST",
    `/api/internal/agent/approvals/${encodeURIComponent(id)}/decision`,
    {},
    { shop, agentShopifyCustomerId: toGid(loggedInCustomerId), decision, comment },
  );
}

// ---- quotes ---------------------------------------------------------------

export async function listAgentQuotes(shop: string, loggedInCustomerId: string) {
  const res = await backendRequest("GET", "/api/internal/agent/quotes", {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
  });
  return res.status === 200 && Array.isArray(res.body?.quotes) ? res.body.quotes : [];
}

export async function getAgentQuote(shop: string, loggedInCustomerId: string, id: string) {
  return backendRequest("GET", `/api/internal/agent/quotes/${encodeURIComponent(id)}`, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
  });
}

// A quote made from the cart the agent is building for the customer they are
// ordering for. The customer and context come from the server-held session.
export async function createAgentQuote(shop: string, loggedInCustomerId: string, input: Record<string, unknown>) {
  const context = await activeContext(shop, loggedInCustomerId);
  if (!context) return { status: 401, body: { code: "CONTEXT_REQUIRED", message: "Customer context is required" } };

  return backendRequest("POST", "/api/internal/agent/quotes", {}, { shop, ...context, ...input });
}

// send | submit | withdraw | revise | duplicate | converted
export async function agentQuoteAction(
  shop: string,
  loggedInCustomerId: string,
  id: string,
  action: string,
  extra: Record<string, unknown> = {},
) {
  return backendRequest(
    "POST",
    `/api/internal/agent/quotes/${encodeURIComponent(id)}/${action}`,
    {},
    { shop, agentShopifyCustomerId: toGid(loggedInCustomerId), ...extra },
  );
}

export async function listQuoteApprovals(shop: string, loggedInCustomerId: string) {
  const res = await backendRequest("GET", "/api/internal/agent/quote-approvals", {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
  });

  const ok = res.status === 200;
  return {
    quotes: ok && Array.isArray(res.body?.quotes) ? res.body.quotes : [],
    needsStepUp: ok && res.body?.needsStepUp === true,
  };
}

export async function decideAgentQuote(
  shop: string,
  loggedInCustomerId: string,
  id: string,
  decision: string,
  comment: string,
) {
  return backendRequest(
    "POST",
    `/api/internal/agent/quote-approvals/${encodeURIComponent(id)}/decision`,
    {},
    { shop, agentShopifyCustomerId: toGid(loggedInCustomerId), decision, comment },
  );
}

// Whether the signed-in shopper's role allows something, with no customer
// context needed (used before work that can't easily be undone).
export async function agentMay(shop: string, loggedInCustomerId: string, permission: string): Promise<boolean> {
  const res = await backendRequest(
    "POST",
    "/api/internal/agent/authorize",
    {},
    { shop, agentShopifyCustomerId: toGid(loggedInCustomerId), permission },
  );
  return res.status === 200 && res.body?.allowed === true;
}

// ---- the buyer's side: any signed-in customer, for quotes sent to them

export async function listBuyerQuotes(shop: string, loggedInCustomerId: string) {
  const res = await backendRequest("GET", "/api/internal/customer/quotes", {
    shop,
    buyerShopifyCustomerId: toGid(loggedInCustomerId),
  });
  return res.status === 200 && Array.isArray(res.body?.quotes) ? res.body.quotes : [];
}

export async function respondToBuyerQuote(
  shop: string,
  loggedInCustomerId: string,
  id: string,
  action: string,
  comment: string,
) {
  return backendRequest(
    "POST",
    `/api/internal/customer/quotes/${encodeURIComponent(id)}/respond`,
    {},
    { shop, buyerShopifyCustomerId: toGid(loggedInCustomerId), action, comment },
  );
}

// ---- payment links: the buyer pays on the hosted page, never the agent

export async function createPaymentLink(
  shop: string,
  loggedInCustomerId: string,
  input: {
    customerShopifyId: string;
    draftOrderId: string;
    invoiceUrl: string;
    amount: number;
    currency: string;
    quoteId?: string;
    shipTo?: { zip?: string | null; countryCode?: string | null; provinceCode?: string | null };
  },
) {
  return backendRequest("POST", "/api/internal/agent/payment-links", {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    ...input,
  });
}

export async function listAgentPaymentLinks(shop: string, loggedInCustomerId: string) {
  const res = await backendRequest("GET", "/api/internal/agent/payment-links", {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
  });
  return res.status === 200 && Array.isArray(res.body?.links) ? res.body.links : [];
}

export async function revokeAgentPaymentLink(shop: string, loggedInCustomerId: string, id: string) {
  return backendRequest(
    "POST",
    `/api/internal/agent/payment-links/${encodeURIComponent(id)}/revoke`,
    {},
    { shop, agentShopifyCustomerId: toGid(loggedInCustomerId) },
  );
}

// The signed-in buyer opens their link; the backend only answers for the
// customer the link was made for.
export async function resolvePaymentLink(shop: string, loggedInCustomerId: string, token: string) {
  return backendRequest(
    "POST",
    "/api/internal/customer/payment-links/resolve",
    {},
    { shop, token, buyerShopifyCustomerId: toGid(loggedInCustomerId) },
  );
}

export async function reportPaymentLinkPaid(
  shop: string,
  token: string,
  orderId: string,
  amount: number,
  currency: string,
  extras?: { shipping: number; tax: number },
) {
  return backendRequest("POST", "/api/internal/payment-links/paid", {}, { shop, token, orderId, amount, currency, extras });
}

// ---- creating a new customer at a trade event

// Whether the role has a permission, telling "not allowed" apart from "allowed
// once the agent confirms their authenticator code".
export async function agentCan(
  shop: string,
  loggedInCustomerId: string,
  permission: string,
): Promise<{ allowed: boolean; needsStepUp: boolean }> {
  const res = await backendRequest(
    "POST",
    "/api/internal/agent/authorize",
    {},
    { shop, agentShopifyCustomerId: toGid(loggedInCustomerId), permission },
  );
  return {
    allowed: res.status === 200 && res.body?.allowed === true,
    needsStepUp: res.status === 200 && res.body?.reason === "STEP_UP_REQUIRED",
  };
}

export async function checkNewCustomer(
  shop: string,
  loggedInCustomerId: string,
  customer: Record<string, unknown>,
  confirmNotDuplicate: boolean,
) {
  return backendRequest("POST", "/api/internal/agent/customers/check", {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    customer,
    confirmNotDuplicate,
  });
}

export async function recordNewCustomer(
  shop: string,
  loggedInCustomerId: string,
  shopifyCustomerId: string,
  customer: Record<string, unknown>,
  duplicatesConfirmed: boolean,
) {
  return backendRequest("POST", "/api/internal/agent/customers/record", {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    shopifyCustomerId,
    customer,
    duplicatesConfirmed,
  });
}

// Writes the audit entry for an address added for the customer the agent is
// currently ordering for. Best effort: the address already exists.
export async function recordAgentAddress(
  shop: string,
  loggedInCustomerId: string,
  address: { city?: string; country?: string; setDefault?: boolean },
) {
  const context = await activeContext(shop, loggedInCustomerId);
  if (!context) return;

  await backendRequest("POST", "/api/internal/agent/addresses/record", {}, {
    shop,
    agentShopifyCustomerId: context.agentShopifyCustomerId,
    contextId: context.contextId,
    address,
  });
}

// ---- approval links emailed to approvers (spec §8.4)

export async function openApprovalLink(shop: string, loggedInCustomerId: string, token: string) {
  return backendRequest("POST", "/api/internal/agent/approval-links/open", {}, {
    shop,
    token,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
  });
}

export async function decideApprovalLink(
  shop: string,
  loggedInCustomerId: string,
  token: string,
  decision: string,
  comment: string,
) {
  return backendRequest("POST", "/api/internal/agent/approval-links/decide", {}, {
    shop,
    token,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    decision,
    comment,
  });
}

// ---- shopping lists (spec §3.2): saved lists of items to order again

// The actor is whoever is signed in; while an agent is ordering for a customer
// the lists are that customer's, taken from the live context held on the server.
async function shoppingListTarget(shop: string, loggedInCustomerId: string) {
  const session = await getAgentSession(shop, loggedInCustomerId);
  return {
    shop,
    actorShopifyCustomerId: toGid(loggedInCustomerId),
    customerShopifyCustomerId: session.active ? session.customer?.shopifyCustomerId : undefined,
  };
}

export async function listShoppingLists(shop: string, loggedInCustomerId: string) {
  const target = await shoppingListTarget(shop, loggedInCustomerId);
  const query: Record<string, string> = { shop, actorShopifyCustomerId: target.actorShopifyCustomerId };
  if (target.customerShopifyCustomerId) query.customerShopifyCustomerId = target.customerShopifyCustomerId;

  const res = await backendRequest("GET", "/api/internal/shopping-lists", query);
  return res.status === 200 && Array.isArray(res.body?.lists) ? res.body.lists : [];
}

export async function createShoppingList(
  shop: string,
  loggedInCustomerId: string,
  name: string,
  items: Array<Record<string, unknown>>,
) {
  const target = await shoppingListTarget(shop, loggedInCustomerId);
  return backendRequest("POST", "/api/internal/shopping-lists", {}, { ...target, name, items });
}

export async function deleteShoppingList(shop: string, loggedInCustomerId: string, id: string) {
  const target = await shoppingListTarget(shop, loggedInCustomerId);
  return backendRequest("POST", `/api/internal/shopping-lists/${encodeURIComponent(id)}/delete`, {}, target);
}

// ---- the agent's alerts (spec §10.2)

export async function listAgentNotifications(shop: string, loggedInCustomerId: string) {
  const res = await backendRequest("GET", "/api/internal/agent/notifications", {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
  });
  return res.status === 200 && res.body ? res.body : { notifications: [], unread: 0 };
}

export async function markAgentNotificationsRead(shop: string, loggedInCustomerId: string, ids: string[]) {
  return backendRequest("POST", "/api/internal/agent/notifications/read", {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    ids,
  });
}

// ---- the customer being ordered for (spec §4.3 "Summary")

export async function getAgentCustomerSummary(shop: string, loggedInCustomerId: string) {
  const context = await activeContext(shop, loggedInCustomerId);
  if (!context) return null;

  const res = await backendRequest("GET", "/api/internal/agent/customer-summary", { shop, ...context });
  return res.status === 200 ? res.body : null;
}

// The agent confirms their changed access and carries on (spec §5.2).
export async function refreshAgentSession(shop: string, loggedInCustomerId: string, contextId: string) {
  return backendRequest("POST", `/api/internal/agent/contexts/${encodeURIComponent(contextId)}/refresh`, {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
  });
}

// Tells the backend an agent's order could not be placed. It counts the tries
// of the same order and alerts the agent and their managers when it keeps
// failing (spec §10.2). Never allowed to get in the way of the reply.
export async function reportOrderFailure(
  shop: string,
  agentShopifyCustomerId: string,
  customerId: string | null,
  key: string,
  code: string,
  message: string,
) {
  if (!key) return;
  try {
    await backendRequest("POST", "/api/internal/agent/order-failed", {}, { shop, agentShopifyCustomerId: toGid(agentShopifyCustomerId), customerId, key, code, message });
  } catch (err) {
    console.error("[checkout] could not report the failed order", err);
  }
}

// How stock is treated and how long a payment link lives (spec §9.5).
export async function getModuleSettings(shop: string) {
  const res = await backendRequest("GET", "/api/internal/agent/module-settings", { shop });
  return {
    inventoryMode: (res.body?.inventoryMode as "informational" | "reserve_orders") || "informational",
    paymentLinkValidHours: Number(res.body?.paymentLinkValidHours) || 72,
    substitutes: (Array.isArray(res.body?.substitutes) ? res.body.substitutes : []) as { fromSku: string; toSku: string; note: string | null }[],
  };
}

// ---- pinned accounts (spec §4.2)

export async function pinAgentAccount(shop: string, loggedInCustomerId: string, customerId: string, pinned: boolean) {
  return backendRequest("POST", "/api/internal/agent/pins", {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    customerId,
    pinned,
  });
}

// ---- Phase 4: delegation, temporary access and offline capture

export async function listAgentDelegations(shop: string, loggedInCustomerId: string) {
  const [list, who] = await Promise.all([
    backendRequest("GET", "/api/internal/agent/delegations", { shop, agentShopifyCustomerId: toGid(loggedInCustomerId) }),
    backendRequest("GET", "/api/internal/agent/delegate-candidates", { shop, agentShopifyCustomerId: toGid(loggedInCustomerId) }),
  ]);
  return { delegations: list.body?.delegations ?? [], agents: who.body?.agents ?? [] };
}

export async function createAgentDelegation(
  shop: string,
  loggedInCustomerId: string,
  input: { delegateId: string; endsAt: string; reason: string; coverAccess: boolean; includeQuotes: boolean },
) {
  return backendRequest("POST", "/api/internal/agent/delegations", {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    delegateId: input.delegateId,
    endsAt: input.endsAt,
    reason: input.reason,
    coverAccess: input.coverAccess === true,
    includeQuotes: input.includeQuotes !== false,
  });
}

export async function revokeAgentDelegation(shop: string, loggedInCustomerId: string, id: string) {
  return backendRequest("POST", `/api/internal/agent/delegations/${encodeURIComponent(id)}/revoke`, {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    reason: "Ended by the agent",
  });
}

export async function listOfflineCaptures(shop: string, loggedInCustomerId: string) {
  return backendRequest("GET", "/api/internal/agent/offline-captures", { shop, agentShopifyCustomerId: toGid(loggedInCustomerId) });
}

export async function sendOfflineCaptures(shop: string, loggedInCustomerId: string, captures: unknown[]) {
  return backendRequest("POST", "/api/internal/agent/offline-captures", {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    captures,
  });
}

export async function resolveOfflineCapture(shop: string, loggedInCustomerId: string, id: string, outcome: string) {
  return backendRequest("POST", `/api/internal/agent/offline-captures/${encodeURIComponent(id)}/resolve`, {}, {
    shop,
    agentShopifyCustomerId: toGid(loggedInCustomerId),
    outcome,
  });
}
