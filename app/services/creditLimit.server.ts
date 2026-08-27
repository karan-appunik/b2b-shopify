import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import { readCreditMetafield, writeCreditMetafield } from "./customerCreditMetafield.server";

function getBackendConfig(): { backendUrl: string; internalKey: string } | null {
  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_API_URL;
  // eslint-disable-next-line no-undef
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  if (!backendUrl || !internalKey) {
    console.error("[creditLimit] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set");
    return null;
  }

  return { backendUrl, internalKey };
}

export interface CreditInfo {
  creditLimit: number | null;
  balance: number;
  // The customer group's "Prevent placing an order if exceeding credit
  // limit" checkbox — a numeric limit alone doesn't block anything unless
  // this is on.
  enforced: boolean;
  // The customer group's Payment Methods > "Payment on account" toggle —
  // whether this shopper is allowed to see/use the "Payment on Account"
  // checkout option at all (independent of Shopify's native Net Terms).
  onAccountEnabled: boolean;
}

const NO_CREDIT_INFO: CreditInfo = {
  creditLimit: null,
  balance: 0,
  enforced: false,
  onAccountEnabled: false,
};

// The customer group's enforcement + payment-method flags (Customer Groups >
// [group] > Credit settings / Payment methods) live in our own backend-api,
// not Shopify — they're SparkLayer-panel concepts, not part of the metafield.
async function fetchGroupFlags(
  shop: string,
  shopifyCustomerId: string,
): Promise<{ enforced: boolean; onAccountEnabled: boolean }> {
  const config = getBackendConfig();
  if (!config) return { enforced: false, onAccountEnabled: false };

  try {
    const res = await fetch(
      `${config.backendUrl}/api/internal/customers/credit?shop=${encodeURIComponent(shop)}&shopifyCustomerId=${encodeURIComponent(shopifyCustomerId)}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );
    if (!res.ok) return { enforced: false, onAccountEnabled: false };
    const data = (await res.json()) as { enforced?: boolean; onAccountEnabled?: boolean };
    return { enforced: !!data.enforced, onAccountEnabled: !!data.onAccountEnabled };
  } catch (err) {
    console.error("[creditLimit] failed to fetch group flags", err);
    return { enforced: false, onAccountEnabled: false };
  }
}

// Reads the shopper's real credit limit/balance from Shopify's own customer
// metafield (sparklayer.payment_on_account — mirrors SparkLayer's real
// "Payment on account" feature), same as SparkLayer's own app does. `admin`
// is only available on requests that went through Shopify's app proxy.
export async function getCreditInfo(
  admin: AdminApiContext | null,
  shop: string,
  loggedInCustomerId: string | null,
): Promise<CreditInfo> {
  if (!loggedInCustomerId) return NO_CREDIT_INFO;

  const shopifyCustomerId = `gid://shopify/Customer/${loggedInCustomerId}`;
  const { enforced, onAccountEnabled } = await fetchGroupFlags(shop, shopifyCustomerId);

  if (!admin) return { ...NO_CREDIT_INFO, enforced, onAccountEnabled };

  try {
    const metafield = await readCreditMetafield(admin, shopifyCustomerId);
    if (!metafield) return { creditLimit: null, balance: 0, enforced, onAccountEnabled };

    return {
      creditLimit: metafield.credit_limit ?? null,
      balance: metafield.balance ?? 0,
      enforced,
      onAccountEnabled,
    };
  } catch (err) {
    console.error("[creditLimit] failed to read credit metafield", err);
    return { creditLimit: null, balance: 0, enforced, onAccountEnabled };
  }
}

// Returns a human-readable block reason if placing an order of `amount`
// "on account" would exceed the customer's credit limit, or null if it's
// fine (no limit set counts as fine).
export function checkCreditLimit(info: CreditInfo, amount: number): string | null {
  if (!info.enforced) return null;
  if (info.creditLimit == null) return null;
  if (info.balance + amount > info.creditLimit) {
    return "This order exceeds your available credit. Please pay by card, or contact us to arrange payment.";
  }
  return null;
}

// Also grows the Mongo mirror of the balance in real time, so the merchant
// panel's customer page reflects the new balance immediately instead of
// waiting for the next full customer sync (which only runs when the admin
// app is opened).
async function chargeMirrorBalance(
  shop: string,
  shopifyCustomerId: string,
  amount: number,
): Promise<void> {
  const config = getBackendConfig();
  if (!config) return;

  try {
    await fetch(`${config.backendUrl}/api/internal/customers/credit/charge`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-api-key": config.internalKey },
      body: JSON.stringify({ shop, shopifyCustomerId, amount }),
    });
  } catch (err) {
    console.error("[creditLimit] failed to update balance mirror", err);
  }
}

// Called after a "pay on account" draft order is successfully placed — grows
// the customer's outstanding balance by the order total directly in the
// Shopify metafield (source of truth), same as SparkLayer's own balance
// auto-update on successful order.
export async function chargeCredit(
  admin: AdminApiContext | null,
  shop: string,
  loggedInCustomerId: string | null,
  amount: number,
): Promise<void> {
  if (!admin || !loggedInCustomerId || !(amount > 0)) return;

  const shopifyCustomerId = `gid://shopify/Customer/${loggedInCustomerId}`;

  try {
    const current = (await readCreditMetafield(admin, shopifyCustomerId)) || {};
    const newBalance = (current.balance ?? 0) + amount;
    await writeCreditMetafield(admin, shopifyCustomerId, { ...current, balance: newBalance });
    await chargeMirrorBalance(shop, shopifyCustomerId, amount);
  } catch (err) {
    console.error("[creditLimit] failed to charge credit balance", err);
  }
}
