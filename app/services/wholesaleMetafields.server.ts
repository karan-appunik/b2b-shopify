// Shared names for the per-variant wholesale price metafields.
//
// A variant can sit in several price lists with different currencies (e.g. a
// USD list for US buyers and a EUR list for EU buyers). One plain
// `wholesale_price` metafield can only hold one number, so each list's price
// is stored under a currency-specific key — `wholesale_price_eur`,
// `wholesale_price_tiers_eur` — and the shopper's cart currency picks which
// one is read.
//
// The original un-suffixed keys are still written and read, but only for the
// shop's own currency, so stores that pushed price lists before this change
// keep working until they re-push.
export const WHOLESALE_PRICE_NAMESPACE = "sparklayer";
export const LEGACY_PRICE_KEY = "wholesale_price";
export const LEGACY_TIERS_KEY = "wholesale_price_tiers";

// Lowercase letters/digits only, so it is always a valid metafield key suffix.
export function normalizeCurrency(currency?: string | null): string {
  return String(currency || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

export function currencyKeys(currency?: string | null) {
  const code = normalizeCurrency(currency);
  return {
    priceKey: `${LEGACY_PRICE_KEY}_${code}`,
    tiersKey: `${LEGACY_TIERS_KEY}_${code}`,
  };
}

export function sameCurrency(a?: string | null, b?: string | null): boolean {
  const left = normalizeCurrency(a);
  return left !== "" && left === normalizeCurrency(b);
}

export const SHOP_CURRENCY_QUERY = `#graphql
  query ShopCurrency {
    shop {
      currencyCode
    }
  }
`;
