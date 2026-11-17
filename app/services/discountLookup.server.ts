function getBackendConfig(): { backendUrl: string; internalKey: string } | null {
  // eslint-disable-next-line no-undef
  const backendUrl = process.env.BACKEND_API_URL;
  // eslint-disable-next-line no-undef
  const internalKey = process.env.BACKEND_INTERNAL_API_KEY;

  if (!backendUrl || !internalKey) {
    console.error("[discountLookup] BACKEND_API_URL or BACKEND_INTERNAL_API_KEY not set");
    return null;
  }

  return { backendUrl, internalKey };
}

// docs.sparklayer.io/discounts "Advanced Requirements and Rewards" — one
// SKU/tag/vendor condition, the shared shape between the simple
// productRequirement field, each condition inside an advanced
// requirementGroups entry, and a cart_lines reward's cartLineMatch.
export interface RequirementCondition {
  attribute: "sku" | "tag" | "vendor";
  operator: "equals" | "contains";
  value: string;
}

// One reward fired when an "advanced" discount's requirementGroups match.
// "cart_lines" targets specific lines via cartLineMatch; "subtotal"/
// "shipping" apply against the whole order/shipping cost and ignore it.
export interface Reward {
  type: "subtotal" | "shipping" | "cart_lines";
  valueType: "percentage" | "fixed" | "free" | "set_cost";
  value: number;
  cartLineMatch: RequirementCondition | null;
}

// docs.sparklayer.io/discounts "Advanced Free Products" — one product
// awarded by a freeProductGroups entry, same shape as the simple free_product
// reward's freeProduct field (see Discount.freeProduct).
export interface FreeProductGroupProduct {
  shopifyVariantId: string;
  title: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  perQuantity: number | null;
}

// docs.sparklayer.io/discounts "Advanced Free Products" — an entry parallel
// to a requirementGroups[i] (fires when that group matches); can award
// several different products together (BOGO-style).
export interface FreeProductGroup {
  products: FreeProductGroupProduct[];
  // "once" ignores every product's own perQuantity and awards its base
  // quantity a single time; "recursive" awards each product repeatedly per
  // its own perQuantity with no cap; "limited" is the same as recursive but
  // capped at limitedMaxTimes repetitions.
  application: "once" | "recursive" | "limited";
  limitedMaxTimes: number | null;
}

export interface Discount {
  _id: string;
  name: string;
  publicName: string;
  method: "automatic" | "coupon";
  // docs.sparklayer.io/discounts "Coupon codes" — a discount can have
  // several codes saved against it; any one of them applies this discount.
  couponCodes?: string[];
  // docs.sparklayer.io/discounts "Discount Priorities" — merchant-ordered
  // via drag-and-drop; lower applies first. Already sorted this way by
  // getActiveDiscounts, but sorted again defensively wherever it decides
  // order among automatic discounts.
  priority: number;
  // "simple" is every discount created via the four basic Type options
  // below (appliesTo-driven, single reward); "advanced" is
  // "Advanced requirements and rewards" (requirementGroups/rewards driven,
  // appliesTo/valueType/value/productRequirement/lineItemSkus/freeProduct
  // are meaningless placeholders on an advanced discount — see
  // resolveAdvancedRewards, which is the only code that reads
  // requirementGroups/rewards/rewardApplication); "advanced_free_product" is
  // "Advanced Free Products" (requirementGroups/freeProductGroups driven —
  // see resolveAdvancedFreeProductGroups, the only code that reads
  // freeProductGroups).
  mode: "simple" | "advanced" | "advanced_free_product";
  appliesTo: "order" | "shipping" | "free_product" | "line_item";
  valueType: "percentage" | "fixed" | "free" | "set_cost";
  value: number;
  // docs.sparklayer.io/discounts "Advanced Free Products" — present only
  // when appliesTo === "free_product"; resolved/cached server-side from the
  // Product collection so checkout never needs an extra lookup.
  freeProduct: {
    shopifyVariantId: string;
    title: string;
    variantTitle: string;
    sku: string;
    quantity: number;
    // docs.sparklayer.io/discounts "Recursive Free Products" — null means a
    // fixed `quantity` regardless of cart size; otherwise see
    // resolveFreeProductAward below for how the awarded quantity scales.
    perQuantity: number | null;
  } | null;
  // docs.sparklayer.io/discounts "Give a Percentage Off Products" — present
  // only when appliesTo === "line_item" (max 25 SKUs); matched directly
  // against cart line SKUs, no Product lookup needed.
  lineItemSkus: string[];
  // Set only on a synthetic candidate projected by resolveAdvancedRewards
  // from a "cart_lines" reward (real backend Discount documents never carry
  // this) — resolveLineItemDiscount picks a winner the same way either way,
  // but the checkout proxy's line-matching predicate must fall back to this
  // attribute/operator condition instead of lineItemSkus when it's set.
  lineItemMatch?: RequirementCondition | null;
  currency: string;
  minSubtotal: number | null;
  maxSubtotal: number | null;
  // "total" = sum of every line's quantity; "unique" = number of distinct
  // line items — docs.sparklayer.io/discounts "Order Item Limits".
  itemQuantityMethod: "total" | "unique";
  minItemQuantity: number | null;
  maxItemQuantity: number | null;
  // docs.sparklayer.io/discounts "Advanced Requirements" (simple, single-
  // condition version) — null means no product restriction; otherwise the
  // cart must contain at least one line whose sku/tag/vendor matches per the
  // given operator. Ignored when mode === "advanced" (requirementGroups is
  // the multi-condition equivalent then).
  productRequirement: RequirementCondition | null;
  // Outer array = OR, inner array = AND — only read when mode === "advanced".
  requirementGroups: RequirementCondition[][];
  // Only read when mode === "advanced".
  rewards: Reward[];
  // "all" fires every entry in rewards; "highest"/"lowest" fire only the
  // single reward with the largest/smallest computed discount amount at
  // checkout time (see selectRewards). Only read when mode === "advanced".
  rewardApplication: "all" | "highest" | "lowest";
  // docs.sparklayer.io/discounts "Advanced Free Products" — parallel array to
  // requirementGroups (index i's free products fire when requirementGroups[i]
  // matches). Only read when mode === "advanced_free_product".
  freeProductGroups: FreeProductGroup[];
  // Customer-group eligibility is already resolved server-side (the backend
  // knows the shopper's group; the client here never sees customerGroupIds).
  usageLimitPerCustomer: number | null;
  usedByCustomer: number;
  // docs.sparklayer.io/discounts "Compatible discounts" — false means this
  // discount is exclusive (see resolveDiscount below for what that does).
  compatibleWithOthers: boolean;
  // Whitelist of other Discount _ids this one is allowed to stack with.
  // Empty = combine with anything else that's also willing. Checked
  // mutually against the other side's own list — see isMutuallyCompatible.
  compatibleDiscountIds: string[];
}

export interface CartLineProductInfo {
  sku: string | null;
  tags: string[];
  vendor: string | null;
  // Unit price (post wholesale/tier pricing) and cart quantity — only needed
  // to compute a "cart_lines" advanced reward's dollar amount for
  // rewardApplication "highest"/"lowest" comparison (see computeRewardAmount).
  // Simple-mode eligibility/matching never reads these.
  price: number;
  quantity: number;
}

export interface CartItemInfo {
  totalQuantity: number;
  uniqueItemCount: number;
  lines: CartLineProductInfo[];
}

export interface ActiveDiscounts {
  automatic: Discount[];
  coupons: Discount[];
  // Whether any coupon-type discount is currently active/enabled for the
  // shop at all, independent of any specific code — docs.sparklayer.io
  // "The coupon code box will only show ... if there is an 'active'
  // discount code that is 'enabled'".
  hasCoupons: boolean;
}

const NO_DISCOUNTS: ActiveDiscounts = { automatic: [], coupons: [], hasCoupons: false };

// Raw, schedule-filtered candidates only — mirrors fetchVariantPricing's
// division of labor with pickTierPrice: the caller (checkout proxy) does the
// actual subtotal/currency matching once it knows the cart's real total.
export async function getActiveDiscounts(
  shop: string,
  couponCodes?: string[] | null,
  shopifyCustomerId?: string | null,
): Promise<ActiveDiscounts> {
  const config = getBackendConfig();
  if (!config) return NO_DISCOUNTS;

  try {
    const params = new URLSearchParams({ shop });
    if (couponCodes && couponCodes.length) params.set("couponCodes", couponCodes.join(","));
    if (shopifyCustomerId) params.set("shopifyCustomerId", shopifyCustomerId);

    const res = await fetch(
      `${config.backendUrl}/api/internal/discounts/active?${params.toString()}`,
      { headers: { "x-internal-api-key": config.internalKey } },
    );

    if (!res.ok) return NO_DISCOUNTS;
    return (await res.json()) as ActiveDiscounts;
  } catch (err) {
    console.error("[discountLookup] failed to fetch active discounts", err);
    return NO_DISCOUNTS;
  }
}

// Tells the backend a discount was actually applied to an order, so its
// usage-limit count (Discount.usageLimitPerCustomer) reflects real
// redemptions rather than carts that never checked out.
// docs.sparklayer.io/discounts "Data Tracking" — meta is optional and purely
// additive (analytics only): an older/undecorated call with no 5th argument
// still records the same redemption rows as before, just without these
// fields populated.
export interface DiscountRedemptionMeta {
  preDiscountTotal?: number;
  currency?: string;
  // discountId -> dollar amount that specific discount saved. Only
  // well-defined for order/shipping rewards (see discountAmount below) — a
  // free_product/line_item discount id simply has no entry here.
  savings?: Record<string, number>;
}

export async function recordDiscountRedemptions(
  shop: string,
  shopifyCustomerId: string | null | undefined,
  discountIds: string[],
  orderId: string,
  meta?: DiscountRedemptionMeta,
): Promise<void> {
  const config = getBackendConfig();
  if (!config || !shopifyCustomerId || discountIds.length === 0) return;

  try {
    await fetch(`${config.backendUrl}/api/internal/discounts/redemptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-internal-api-key": config.internalKey },
      body: JSON.stringify({
        shop,
        shopifyCustomerId,
        discountIds,
        orderId,
        preDiscountTotal: meta?.preDiscountTotal,
        currency: meta?.currency,
        savings: meta?.savings,
      }),
    });
  } catch (err) {
    console.error("[discountLookup] failed to record discount redemptions", err);
  }
}

// Exported so the checkout proxy can compute each stacked order discount's
// own dollar amount for redemption analytics — resolveDiscount only returns
// the combined/capped total, not the per-discount breakdown.
export function discountAmount(discount: Discount, totalValue: number): number {
  if (discount.valueType === "percentage") {
    return totalValue * (discount.value / 100);
  }
  return Math.min(discount.value, totalValue);
}

function isEligible(discount: Discount, totalValue: number, currency: string, itemInfo: CartItemInfo): boolean {
  if (discount.currency !== currency.toUpperCase()) return false;
  if (discount.minSubtotal != null && totalValue < discount.minSubtotal) return false;
  if (discount.maxSubtotal != null && totalValue > discount.maxSubtotal) return false;
  if (discount.usageLimitPerCustomer != null && discount.usedByCustomer >= discount.usageLimitPerCustomer) {
    return false;
  }

  const itemCount = discount.itemQuantityMethod === "unique" ? itemInfo.uniqueItemCount : itemInfo.totalQuantity;
  if (discount.minItemQuantity != null && itemCount < discount.minItemQuantity) return false;
  if (discount.maxItemQuantity != null && itemCount > discount.maxItemQuantity) return false;

  // docs.sparklayer.io/discounts "Advanced Requirements and Rewards" /
  // "Advanced Free Products" — an advanced discount's own OR-of-AND
  // requirementGroups fully replace the simple productRequirement/
  // line_item-SKU checks below (a discount is exactly one of "simple",
  // "advanced", or "advanced_free_product", never more than one).
  if (discount.mode === "advanced" || discount.mode === "advanced_free_product") {
    return cartMatchesRequirementGroups(discount.requirementGroups || [], itemInfo.lines);
  }

  if (discount.productRequirement && !conditionMatches(discount.productRequirement, itemInfo.lines)) {
    return false;
  }

  if (discount.appliesTo === "line_item") {
    const skus = new Set((discount.lineItemSkus || []).map((s) => s.toLowerCase()));
    const hasMatch = itemInfo.lines.some((line) => line.sku && skus.has(line.sku.toLowerCase()));
    if (!hasMatch) return false;
  }

  return true;
}

export function lineMatchesCondition(condition: RequirementCondition, line: CartLineProductInfo): boolean {
  const { attribute, operator, value } = condition;
  const needle = value.toLowerCase();

  const fieldMatches = (field: string | null) => {
    if (field == null) return false;
    const haystack = field.toLowerCase();
    return operator === "equals" ? haystack === needle : haystack.includes(needle);
  };

  if (attribute === "tag") return line.tags.some((tag) => fieldMatches(tag));
  if (attribute === "vendor") return fieldMatches(line.vendor);
  return fieldMatches(line.sku);
}

// True if at least one cart line matches — used for eligibility checks
// (the simple productRequirement field, and each AND condition inside an
// advanced requirementGroups entry).
function conditionMatches(condition: RequirementCondition, lines: CartLineProductInfo[]): boolean {
  return lines.some((line) => lineMatchesCondition(condition, line));
}

// docs.sparklayer.io/discounts "Advanced Requirements and Rewards" —
// conditions inside a group are AND'd, groups are OR'd with each other:
// (condA AND condB) OR (condC).
function cartMatchesRequirementGroups(groups: RequirementCondition[][], lines: CartLineProductInfo[]): boolean {
  return groups.some((group) => group.length > 0 && group.every((condition) => conditionMatches(condition, lines)));
}

export type ResolvedDiscount =
  | { discounts: Discount[]; amount: number }
  | { error: string }
  | null;

export type ResolvedShippingDiscount = { discount: Discount; amount: number } | null;

const MAX_COUPON_CODES = 3;
const MAX_TOTAL_DISCOUNTS = 4;

export interface SplitCoupons {
  orderCoupons: Discount[];
  shippingCoupons: Discount[];
  freeProductCoupons: Discount[];
  lineItemCoupons: Discount[];
  // "advanced" coupons are bucketed separately from the appliesTo-driven
  // ones above — appliesTo is a meaningless placeholder on an advanced
  // discount, so it can't be routed by that switch.
  advancedCoupons: Discount[];
  // Same reasoning as advancedCoupons, for mode === "advanced_free_product".
  advancedFreeProductCoupons: Discount[];
}

// Every requested coupon code (up to 3) must exist, be active, and meet its
// own subtotal requirement — regardless of whether its reward reduces the
// order total, the shipping cost, or gives away a product — or checkout
// fails with a clear error naming the bad code. Coupons that qualify are
// then split by what they reward, so each resolver below only sees the
// ones meant for it.
export function validateAndSplitCoupons(
  discounts: ActiveDiscounts,
  requestedCouponCodes: string[] | null | undefined,
  totalValue: number,
  currency: string,
  itemInfo: CartItemInfo,
): SplitCoupons | { error: string } {
  const codes = (requestedCouponCodes || []).slice(0, MAX_COUPON_CODES);
  const orderCoupons: Discount[] = [];
  const shippingCoupons: Discount[] = [];
  const freeProductCoupons: Discount[] = [];
  const lineItemCoupons: Discount[] = [];
  const advancedCoupons: Discount[] = [];
  const advancedFreeProductCoupons: Discount[] = [];

  for (const code of codes) {
    const match = discounts.coupons.find((d) =>
      d.couponCodes?.some((c) => c.toUpperCase() === code.toUpperCase()),
    );
    if (!match || !isEligible(match, totalValue, currency, itemInfo)) {
      return { error: `Coupon code "${code}" is invalid or does not apply to your order.` };
    }
    if (match.mode === "advanced") advancedCoupons.push(match);
    else if (match.mode === "advanced_free_product") advancedFreeProductCoupons.push(match);
    else if (match.appliesTo === "shipping") shippingCoupons.push(match);
    else if (match.appliesTo === "free_product") freeProductCoupons.push(match);
    else if (match.appliesTo === "line_item") lineItemCoupons.push(match);
    else orderCoupons.push(match);
  }

  return { orderCoupons, shippingCoupons, freeProductCoupons, lineItemCoupons, advancedCoupons, advancedFreeProductCoupons };
}

// Two discounts are only allowed to sit in the same stack if each one's own
// whitelist (when it has one) names the other — an empty list means "no
// restriction from this side". Checked both ways because either discount's
// merchant could have configured the whitelist.
function isMutuallyCompatible(a: Discount, b: Discount): boolean {
  const aAllows = !a.compatibleDiscountIds?.length || a.compatibleDiscountIds.includes(b._id);
  const bAllows = !b.compatibleDiscountIds?.length || b.compatibleDiscountIds.includes(a._id);
  return aAllows && bAllows;
}

// Up to 4 order-total discounts stack per order (docs.sparklayer.io/discounts),
// in priority order: already-validated coupons first (in the order the
// buyer typed them), then automatic discounts in the merchant's own
// "Discount Priorities" order (drag-and-drop in the merchant panel; lower
// priority number goes first) — "the priority system determines which
// discount gets first pick". Per the docs, every discount is compatible
// with every other discount by default — the only thing that narrows a
// stack is a discount's own compatibleDiscountIds whitelist (see
// isMutuallyCompatible), checked against everything already in the stack as
// each new candidate is considered. Shopify's draft order API only accepts
// a single order-level discount, so the caller combines whatever's left
// into one fixed-amount line — the docs' "priority doesn't affect savings,
// same-phase discounts just add together" is why plain addition (not
// compounding) is correct for whatever ends up in the stack.
export function resolveDiscount(
  discounts: ActiveDiscounts,
  orderCoupons: Discount[],
  totalValue: number,
  currency: string,
  itemInfo: CartItemInfo,
  // Synthetic candidates projected from an "advanced" discount's own
  // "subtotal" reward(s) by resolveAdvancedRewards — already eligibility-
  // checked and shaped with a real valueType/value, so they stack/
  // compatibility-check here exactly like any simple order discount.
  extraCandidates: Discount[] = [],
): ResolvedDiscount {
  const eligibleAutomatic = discounts.automatic
    .filter((d) => d.mode === "simple" && d.appliesTo === "order" && isEligible(d, totalValue, currency, itemInfo))
    .sort((a, b) => a.priority - b.priority);

  const candidates = [...orderCoupons, ...eligibleAutomatic, ...extraCandidates];
  if (candidates.length === 0) return null;

  const applied: Discount[] = [];
  for (const candidate of candidates) {
    if (applied.length >= MAX_TOTAL_DISCOUNTS) break;
    if (applied.length > 0 && !applied.every((a) => isMutuallyCompatible(candidate, a))) continue;
    applied.push(candidate);
  }

  const amount = Math.min(
    applied.reduce((sum, d) => sum + discountAmount(d, totalValue), 0),
    totalValue,
  );

  return amount > 0 ? { discounts: applied, amount } : null;
}

function shippingDiscountAmount(discount: Discount, shippingAmount: number): number {
  if (discount.valueType === "free") return shippingAmount;
  if (discount.valueType === "percentage") return shippingAmount * (discount.value / 100);
  if (discount.valueType === "set_cost") {
    // docs.sparklayer.io/discounts "Set-cost shipping rates" — sets exact shipping price
    return Math.max(0, shippingAmount - discount.value);
  }
  return Math.min(discount.value, shippingAmount);
}

// Shipping is a single line, so unlike order discounts this picks the one
// best (largest) eligible shipping reward rather than stacking several —
// the already-validated shipping coupon(s) take priority over automatic
// ones when both qualify, same as the order resolver.
export function resolveShippingDiscount(
  discounts: ActiveDiscounts,
  shippingCoupons: Discount[],
  totalValue: number,
  shippingAmount: number,
  currency: string,
  itemInfo: CartItemInfo,
  // Synthetic candidates projected from an "advanced" discount's own
  // "shipping" reward(s) — see resolveDiscount's extraCandidates for why
  // this competes for the single shipping slot the same way a simple
  // shipping-reward discount would.
  extraCandidates: Discount[] = [],
): ResolvedShippingDiscount {
  const eligibleAutomatic = discounts.automatic.filter(
    (d) => d.mode === "simple" && d.appliesTo === "shipping" && isEligible(d, totalValue, currency, itemInfo),
  );
  const candidates = [...shippingCoupons, ...eligibleAutomatic, ...extraCandidates];
  if (candidates.length === 0) return null;

  const best = candidates.reduce(
    (max, d) => {
      const amount = shippingDiscountAmount(d, shippingAmount);
      return amount > max.amount ? { discount: d, amount } : max;
    },
    { discount: candidates[0], amount: shippingDiscountAmount(candidates[0], shippingAmount) },
  );

  return best.amount > 0 ? best : null;
}

export type ResolvedFreeProductDiscount = { discount: Discount } | null;

// Only one free-product reward applies per order (a giveaway isn't a dollar
// amount to add up the way order/shipping discounts are) — the
// already-validated coupon(s) take priority over automatic ones, same as
// the other resolvers. There's no "amount" to compare candidates by, so the
// first eligible one in priority order wins.
export function resolveFreeProductDiscount(
  discounts: ActiveDiscounts,
  freeProductCoupons: Discount[],
  totalValue: number,
  currency: string,
  itemInfo: CartItemInfo,
): ResolvedFreeProductDiscount {
  const eligibleAutomatic = discounts.automatic
    .filter((d) => d.mode === "simple" && d.appliesTo === "free_product" && isEligible(d, totalValue, currency, itemInfo))
    .sort((a, b) => a.priority - b.priority);
  const candidate = [...freeProductCoupons, ...eligibleAutomatic][0];
  return candidate && candidate.freeProduct ? { discount: candidate } : null;
}

// docs.sparklayer.io/discounts "Recursive Free Products" — freeProduct.quantity
// is the base award; when perQuantity is set, that base is awarded again for
// every additional multiple of perQuantity the cart reaches (using the same
// itemQuantityMethod-driven count minItemQuantity is checked against), e.g.
// quantity 1 + perQuantity 5 gives 1 free item at 5 units, 2 at 10, 3 at 15.
// A discount is only a candidate at all once its own minItemQuantity
// eligibility gate (checked in isEligible) already passed, so the minimum
// award here is always the base quantity, never zero.
export function resolveFreeProductAward(discount: Discount, itemInfo: CartItemInfo): number {
  const freeProduct = discount.freeProduct;
  if (!freeProduct) return 0;
  if (!freeProduct.perQuantity || freeProduct.perQuantity < 1) return freeProduct.quantity;

  const itemCount = discount.itemQuantityMethod === "unique" ? itemInfo.uniqueItemCount : itemInfo.totalQuantity;
  const multiplier = Math.max(1, Math.floor(itemCount / freeProduct.perQuantity));
  return freeProduct.quantity * multiplier;
}

export type ResolvedLineItemDiscount = { discount: Discount } | null;

// docs.sparklayer.io/discounts "Give a Percentage Off Products" — only one
// such reward applies per order, same single-pick rule as free-product
// rewards (its percentage is applied per matching line, not summed as an
// order total, so there's nothing to stack). Already-validated coupons take
// priority over automatic discounts, same as every other resolver here.
export function resolveLineItemDiscount(
  discounts: ActiveDiscounts,
  lineItemCoupons: Discount[],
  totalValue: number,
  currency: string,
  itemInfo: CartItemInfo,
  // Synthetic candidates projected from an "advanced" discount's own
  // "cart_lines" reward(s) — carries lineItemMatch instead of lineItemSkus,
  // see the checkout proxy's line-matching predicate for how that's read.
  extraCandidates: Discount[] = [],
): ResolvedLineItemDiscount {
  const eligibleAutomatic = discounts.automatic
    .filter((d) => d.mode === "simple" && d.appliesTo === "line_item" && isEligible(d, totalValue, currency, itemInfo))
    .sort((a, b) => a.priority - b.priority);
  const candidate = [...lineItemCoupons, ...eligibleAutomatic, ...extraCandidates][0];
  return candidate ? { discount: candidate } : null;
}

// docs.sparklayer.io/discounts "Advanced Requirements and Rewards" — a
// reward's dollar amount, used only to compare rewards against each other
// for rewardApplication "highest"/"lowest" (see selectRewards). "subtotal"
// is against the whole order; "shipping" against the shipping cost;
// "cart_lines" against the subtotal of just the lines its own cartLineMatch
// hits (so a %-off-a-few-lines reward isn't unfairly compared against a
// %-off-everything one using the whole order as its base).
function computeRewardAmount(
  reward: Reward,
  totalValue: number,
  shippingAmount: number,
  lines: CartLineProductInfo[],
): number {
  if (reward.type === "shipping") {
    if (reward.valueType === "free") return shippingAmount;
    if (reward.valueType === "percentage") return shippingAmount * (reward.value / 100);
    return Math.min(reward.value, shippingAmount);
  }

  if (reward.type === "cart_lines") {
    if (!reward.cartLineMatch) return 0;
    const matchingSubtotal = lines.reduce((sum, line) => {
      if (!lineMatchesCondition(reward.cartLineMatch!, line)) return sum;
      return sum + line.price * line.quantity;
    }, 0);
    if (reward.valueType === "percentage") return matchingSubtotal * (reward.value / 100);
    return Math.min(reward.value, matchingSubtotal);
  }

  // "subtotal"
  if (reward.valueType === "percentage") return totalValue * (reward.value / 100);
  return Math.min(reward.value, totalValue);
}

// "all" fires every reward the merchant configured; "highest"/"lowest" fire
// only the single one with the largest/smallest computed amount right now
// (which reward "wins" can change cart to cart, e.g. a %-off-cart_lines
// reward is worth more on a cart with lots of matching lines than on one
// with few).
function selectRewards(
  discount: Discount,
  totalValue: number,
  shippingAmount: number,
  lines: CartLineProductInfo[],
): Reward[] {
  const rewards = discount.rewards || [];
  if (rewards.length === 0) return [];
  if (discount.rewardApplication !== "highest" && discount.rewardApplication !== "lowest") {
    return rewards;
  }

  let best = rewards[0];
  let bestAmount = computeRewardAmount(best, totalValue, shippingAmount, lines);
  for (const reward of rewards.slice(1)) {
    const amount = computeRewardAmount(reward, totalValue, shippingAmount, lines);
    const isBetter = discount.rewardApplication === "highest" ? amount > bestAmount : amount < bestAmount;
    if (isBetter) {
      best = reward;
      bestAmount = amount;
    }
  }
  return [best];
}

export interface AdvancedRewardCandidates {
  subtotalCandidates: Discount[];
  shippingCandidates: Discount[];
  cartLinesCandidates: Discount[];
}

// docs.sparklayer.io/discounts "Advanced Requirements and Rewards" — finds
// every eligible "advanced" discount (automatic, plus any already-validated
// advanced coupon codes), applies each one's own rewardApplication to pick
// which of its rewards actually fire, then projects each fired reward onto a
// lightweight simple-shaped candidate (valueType/value taken from the
// reward, mode forced back to "simple") so it can be hard concatenated into
// resolveDiscount/resolveShippingDiscount/resolveLineItemDiscount's existing
// candidate arrays via their extraCandidates parameter — those functions'
// own stacking/compatibility/single-winner logic is entirely reused,
// unchanged, for advanced rewards.
export function resolveAdvancedRewards(
  discounts: ActiveDiscounts,
  advancedCoupons: Discount[],
  totalValue: number,
  shippingAmount: number,
  currency: string,
  itemInfo: CartItemInfo,
): AdvancedRewardCandidates {
  const eligibleAutomatic = discounts.automatic.filter(
    (d) => d.mode === "advanced" && isEligible(d, totalValue, currency, itemInfo),
  );
  const eligible = [...advancedCoupons, ...eligibleAutomatic];

  const subtotalCandidates: Discount[] = [];
  const shippingCandidates: Discount[] = [];
  const cartLinesCandidates: Discount[] = [];

  for (const discount of eligible) {
    const rewards = selectRewards(discount, totalValue, shippingAmount, itemInfo.lines);
    for (const reward of rewards) {
      if (reward.type === "subtotal") {
        subtotalCandidates.push({ ...discount, mode: "simple", valueType: reward.valueType, value: reward.value });
      } else if (reward.type === "shipping") {
        shippingCandidates.push({ ...discount, mode: "simple", valueType: reward.valueType, value: reward.value });
      } else if (reward.type === "cart_lines" && reward.cartLineMatch) {
        cartLinesCandidates.push({
          ...discount,
          mode: "simple",
          appliesTo: "line_item",
          valueType: reward.valueType,
          value: reward.value,
          lineItemMatch: reward.cartLineMatch,
        });
      }
    }
  }

  return { subtotalCandidates, shippingCandidates, cartLinesCandidates };
}

// Same OR-of-AND logic as cartMatchesRequirementGroups, but returns which
// group matched (needed to pick the right freeProductGroups[i] reward)
// instead of just whether any of them did.
function matchRequirementGroupIndex(groups: RequirementCondition[][], lines: CartLineProductInfo[]): number {
  return groups.findIndex((group) => group.length > 0 && group.every((condition) => conditionMatches(condition, lines)));
}

export type ResolvedAdvancedFreeProductGroup = { discount: Discount; group: FreeProductGroup } | null;

// docs.sparklayer.io/discounts "Advanced Free Products" — only one discount's
// free-product reward applies per order (same single-pick rule as the
// simple free_product reward — a giveaway isn't a dollar amount to add up
// the way order/shipping discounts are). Already-validated coupons take
// priority over automatic ones, and among automatic discounts the
// merchant's own priority order decides. Whichever requirementGroups[i]
// matches first (in the merchant's own group order) is the one whose
// freeProductGroups[i] awards — a cart matching multiple groups only ever
// gets the first matching group's reward, not all of them.
export function resolveAdvancedFreeProductGroups(
  discounts: ActiveDiscounts,
  advancedFreeProductCoupons: Discount[],
  totalValue: number,
  currency: string,
  itemInfo: CartItemInfo,
): ResolvedAdvancedFreeProductGroup {
  const eligibleAutomatic = discounts.automatic
    .filter((d) => d.mode === "advanced_free_product" && isEligible(d, totalValue, currency, itemInfo))
    .sort((a, b) => a.priority - b.priority);
  const candidates = [...advancedFreeProductCoupons, ...eligibleAutomatic];

  for (const discount of candidates) {
    const groupIndex = matchRequirementGroupIndex(discount.requirementGroups || [], itemInfo.lines);
    const group = groupIndex >= 0 ? discount.freeProductGroups?.[groupIndex] : undefined;
    if (group) return { discount, group };
  }
  return null;
}

// docs.sparklayer.io/discounts "Advanced Free Products" — "once" awards each
// product's base quantity a single time, ignoring its own perQuantity;
// "recursive" reuses the same per-product perQuantity scaling as
// resolveFreeProductAward (no cap); "limited" is the same as recursive but
// additionally capped at the group's own limitedMaxTimes repetitions.
export function resolveFreeProductGroupAward(
  discount: Discount,
  group: FreeProductGroup,
  itemInfo: CartItemInfo,
): { shopifyVariantId: string; quantity: number }[] {
  const itemCount = discount.itemQuantityMethod === "unique" ? itemInfo.uniqueItemCount : itemInfo.totalQuantity;

  return group.products.map((product) => {
    if (group.application === "once" || !product.perQuantity || product.perQuantity < 1) {
      return { shopifyVariantId: product.shopifyVariantId, quantity: product.quantity };
    }
    let multiplier = Math.max(1, Math.floor(itemCount / product.perQuantity));
    if (group.application === "limited" && group.limitedMaxTimes != null) {
      multiplier = Math.min(multiplier, group.limitedMaxTimes);
    }
    return { shopifyVariantId: product.shopifyVariantId, quantity: product.quantity * multiplier };
  });
}
