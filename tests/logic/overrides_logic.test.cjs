const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");

const os = require("os");
const S = path.join(os.tmpdir(), "sparklayer-logic-tests") + "/";
fs.mkdirSync(S, { recursive: true });
const APP = path.join(__dirname, "..", "..");
const out = S + "compiled";
fs.rmSync(out, { recursive: true, force: true });
execSync(
  `npx tsc "${APP}/app/services/agentOverrides.server.ts" --outDir "${out}" --module commonjs --target es2020 --skipLibCheck`,
  { cwd: APP, stdio: "pipe" }
);

const m = require(path.join(out, "agentOverrides.server.js"));
let pass = 0, fail = 0;
const ok = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  " + JSON.stringify(extra))); };

const ov = (over = {}) => ({
  id: "o1", type: "UNIT_PRICE", status: "APPROVED", denyReason: null, lineVariantId: "111", snapshotQuantity: 10,
  baseline: { amount: 45000, currency: "INR" }, proposed: { amount: 42500, currency: "INR" },
  deltaPercent: 5.56, reasonCode: "LOYALTY", reasonText: "x", expiresAt: null, ...over,
});
const lines = [{ variantId: 111, quantity: 10 }, { variantId: "222", quantity: 5 }];

let map = m.overridesForCheckout([ov()], lines, "INR");
ok("an approved unit-price exception for a line in the order is applied", map.size === 1 && map.get("gid://shopify/ProductVariant/111").unitPrice === 425 && map.get("gid://shopify/ProductVariant/111").id === "o1", [...map]);
ok("an auto-approved one is applied too", m.overridesForCheckout([ov({ status: "AUTO_APPROVED" })], lines, "INR").size === 1);
for (const status of ["PENDING_APPROVAL", "DENIED", "REJECTED", "EXPIRED", "CANCELLED", "INVALIDATED", "APPLIED", "REQUESTED"]) {
  ok(`a ${status} exception is never applied`, m.overridesForCheckout([ov({ status })], lines, "INR").size === 0);
}
ok("a different quantity than the one approved is not applied", m.overridesForCheckout([ov({ snapshotQuantity: 8 })], lines, "INR").size === 0);
ok("a line that isn't in the order is ignored", m.overridesForCheckout([ov({ lineVariantId: "999" })], lines, "INR").size === 0);
ok("an exception in another currency is ignored", m.overridesForCheckout([ov()], lines, "USD").size === 0);
ok("currency match is case-insensitive", m.overridesForCheckout([ov({ proposed: { amount: 42500, currency: "inr" } })], lines, "INR").size === 1);
ok("order-level exceptions (discount, shipping) are not applied as line prices", m.overridesForCheckout([ov({ type: "ORDER_DISCOUNT" }), ov({ type: "SHIPPING_PRICE" })], lines, "INR").size === 0);
ok("an exception without a line is ignored", m.overridesForCheckout([ov({ lineVariantId: null })], lines, "INR").size === 0);
ok("two lines can each have their own exception", m.overridesForCheckout([ov(), ov({ id: "o2", lineVariantId: "222", snapshotQuantity: 5, proposed: { amount: 1000, currency: "INR" } })], lines, "INR").size === 2);
const two = m.overridesForCheckout([ov({ id: "new", proposed: { amount: 40000, currency: "INR" } }), ov({ id: "old" })], lines, "INR");
ok("two for one line: the first listed (newest) wins", two.get("gid://shopify/ProductVariant/111").id === "new" && two.get("gid://shopify/ProductVariant/111").unitPrice === 400, [...two]);

ok("pending exceptions are found (checkout is held)", m.pendingOverrides([ov({ status: "PENDING_APPROVAL" }), ov()]).length === 1);
ok("none pending -> checkout may go on", m.pendingOverrides([ov(), ov({ status: "REJECTED" })]).length === 0);

const gid = "gid://shopify/ProductVariant/111";
ok("effective price: exception wins", m.effectiveUnitPrice(gid, 450, map) === 425);
ok("effective price: no exception keeps the computed price", m.effectiveUnitPrice("gid://shopify/ProductVariant/222", 90, map) === 90);

ok("typed price 42.50 -> 4250 minor units", m.toMinorUnits("42.50") === 4250);
ok("typed price '45' -> 4500", m.toMinorUnits("45") === 4500);
ok("rounding: 19.999 -> 2000", m.toMinorUnits("19.999") === 2000);
ok("a number input works", m.toMinorUnits(12.34) === 1234);
ok("negative refused", m.toMinorUnits("-1") === null);
ok("text refused", m.toMinorUnits("abc") === null && m.toMinorUnits("") === null && m.toMinorUnits(undefined) === null);
ok("zero is a valid (free) price", m.toMinorUnits("0") === 0);
ok("whitespace is trimmed", m.toMinorUnits("  7.5 ") === 750);

// ---- order-level exceptions
const disc = ov({ id: "d1", type: "ORDER_DISCOUNT", lineVariantId: null, baseline: { amount: 100000, currency: "INR" }, proposed: { amount: 96000, currency: "INR" } });
const ship = ov({ id: "s1", type: "SHIPPING_PRICE", lineVariantId: null, baseline: { amount: 2000, currency: "INR" }, proposed: { amount: 0, currency: "INR" } });
const moq = ov({ id: "q1", type: "QUANTITY_RULE", baseline: { amount: 12, currency: "QTY" }, proposed: { amount: 8, currency: "QTY" } });
const cust = ov({ id: "c1", type: "CUSTOM_LINE", lineVariantId: null, custom: { title: "Setup fee", quantity: 2 }, baseline: { amount: 0, currency: "INR" }, proposed: { amount: 5000, currency: "INR" } });

let ex = m.orderExceptionsForCheckout([disc, ship, moq, cust], "INR");
ok("order discount: 100000 -> 96000 takes 40.00 off", ex.discount && ex.discount.amount === 40 && ex.discount.id === "d1", ex);
ok("shipping price 0.00 is a valid agreed price", ex.shipping && ex.shipping.price === 0 && ex.shipping.id === "s1", ex);
ok("accepted minimum quantity is 8", ex.acceptedMinQuantity && ex.acceptedMinQuantity.quantity === 8, ex);
ok("custom line carries title, quantity and unit price", ex.customLines.length === 1 && ex.customLines[0].title === "Setup fee" && ex.customLines[0].quantity === 2 && ex.customLines[0].unitPrice === 50, ex);

ex = m.orderExceptionsForCheckout([disc, ship, moq, cust].map((o) => ({ ...o, status: "PENDING_APPROVAL" })), "INR");
ok("pending exceptions are not applied", !ex.discount && !ex.shipping && !ex.acceptedMinQuantity && ex.customLines.length === 0, ex);
ex = m.orderExceptionsForCheckout([disc, ship, moq, cust].map((o) => ({ ...o, status: "REJECTED" })), "INR");
ok("rejected exceptions are not applied", !ex.discount && !ex.shipping && ex.customLines.length === 0, ex);
ex = m.orderExceptionsForCheckout([disc, ship, cust], "USD");
ok("exceptions in another currency are ignored", !ex.discount && !ex.shipping && ex.customLines.length === 0, ex);
ex = m.orderExceptionsForCheckout([ov({ ...disc, proposed: { amount: 100000, currency: "INR" } })], "INR");
ok("a 'discount' of nothing is ignored", !ex.discount, ex);
ex = m.orderExceptionsForCheckout([ov({ ...disc, proposed: { amount: 120000, currency: "INR" } })], "INR");
ok("a proposal above the baseline never becomes a discount", !ex.discount, ex);
ex = m.orderExceptionsForCheckout([ov({ ...moq, id: "q2", proposed: { amount: 6, currency: "QTY" } }), moq], "INR");
ok("the lowest accepted quantity wins", ex.acceptedMinQuantity.quantity === 6 && ex.acceptedMinQuantity.id === "q2", ex);
ex = m.orderExceptionsForCheckout([ov({ ...disc, id: "d2" }), disc], "INR");
ok("two discounts: only the first (newest) counts", ex.discount.id === "d2", ex);
ex = m.orderExceptionsForCheckout([ov({ ...cust, custom: null })], "INR");
ok("a custom line with no details is ignored", ex.customLines.length === 0, ex);

ex = m.orderExceptionsForCheckout([disc, ship, moq, cust], "INR");
const ids = m.appliedExceptionIds(m.overridesForCheckout([ov()], lines, "INR"), ex);
ok("spent ids cover the price, discount, shipping, quantity and custom line", ["o1", "d1", "s1", "q1", "c1"].every((i) => ids.includes(i)) && ids.length === 5, ids);
ok("relaxed minimum: 12 becomes 8", m.relaxedMinQuantity(12, ex) === 8);
ok("relaxed minimum never goes up (min 5 stays 5)", m.relaxedMinQuantity(5, ex) === 5);
ok("no minimum stays no minimum", m.relaxedMinQuantity(null, ex) === null);
ok("without an exception the minimum is unchanged", m.relaxedMinQuantity(12, m.orderExceptionsForCheckout([], "INR")) === 12);


// ---- increment, address, credit and tax details
const inc = ov({ id: "i1", type: "QUANTITY_RULE", rule: "INCREMENT", baseline: { amount: 6, currency: "QTY" }, proposed: { amount: 10, currency: "QTY" } });
const addr = ov({ id: "a1", type: "ADDRESS", lineVariantId: null, address: { address1: "9 Dock Road", city: "Leeds", zip: "LS1", countryCode: "GB" }, baseline: { amount: 0, currency: "INR" }, proposed: { amount: 0, currency: "INR" } });
const cred = ov({ id: "k1", type: "CREDIT_LIMIT", lineVariantId: null, baseline: { amount: 100000, currency: "INR" }, proposed: { amount: 130000, currency: "INR" } });
const taxed = ov({ id: "t1", type: "CUSTOM_LINE", lineVariantId: null, custom: { title: "Setup", quantity: 1, taxable: true, taxCode: "SERVICES", accountingCode: "4100" }, baseline: { amount: 0, currency: "INR" }, proposed: { amount: 5000, currency: "INR" } });
const untaxed = ov({ id: "t2", type: "CUSTOM_LINE", lineVariantId: null, custom: { title: "Gift", quantity: 1, taxable: false }, baseline: { amount: 0, currency: "INR" }, proposed: { amount: 100, currency: "INR" } });

ex = m.orderExceptionsForCheckout([inc, addr, cred, taxed, untaxed, moq], "INR");
ok("an increment exception waives the pack size and is not read as a minimum", ex.incrementWaived && ex.incrementWaived.id === "i1" && ex.acceptedMinQuantity && ex.acceptedMinQuantity.id === "q1", ex);
ok("a minimum exception alone leaves the pack size in force", !m.orderExceptionsForCheckout([moq], "INR").incrementWaived);
ok("an approved one-off address is picked up whole", ex.address && ex.address.id === "a1" && ex.address.address.city === "Leeds", ex.address);
ok("a credit exception allows the order up to what was approved (1300.00)", ex.credit && ex.credit.id === "k1" && ex.credit.exposure === 1300, ex.credit);
ok("custom lines carry tax and accounting codes", ex.customLines[0].taxable === true && ex.customLines[0].taxCode === "SERVICES" && ex.customLines[0].accountingCode === "4100", ex.customLines);
ok("a non-taxable custom line says so and has no codes", ex.customLines[1].taxable === false && ex.customLines[1].taxCode === null && ex.customLines[1].accountingCode === null, ex.customLines);
ex = m.orderExceptionsForCheckout([inc, addr, cred].map((o) => ({ ...o, status: "PENDING_APPROVAL" })), "INR");
ok("pending ones change nothing", !ex.incrementWaived && !ex.address && !ex.credit, ex);
ex = m.orderExceptionsForCheckout([addr, cred], "USD");
ok("a credit exception in another currency is ignored; an address has no currency", !ex.credit && !!ex.address, ex);
ex = m.orderExceptionsForCheckout([ov({ ...addr, address: null })], "INR");
ok("an address exception with no address is ignored", !ex.address, ex);
ex = m.orderExceptionsForCheckout([inc, addr, cred, taxed, disc, ship, moq], "INR");
const ids2 = m.appliedExceptionIds(new Map(), ex);
ok("all of them are marked spent after the order", ["i1", "a1", "k1", "t1", "d1", "s1", "q1"].every((i) => ids2.includes(i)) && ids2.length === 7, ids2);


// ---- whole-order approval
const oa = ov({ id: "oa1", type: "ORDER_APPROVAL", lineVariantId: null, baseline: { amount: 50000, currency: "INR" }, proposed: { amount: 50000, currency: "INR" } });
ex = m.orderExceptionsForCheckout([oa], "INR");
ok("an approved order approval covers the total it was given (500.00)", ex.orderApproval && ex.orderApproval.id === "oa1" && ex.orderApproval.total === 500, ex.orderApproval);
ex = m.orderExceptionsForCheckout([{ ...oa, status: "PENDING_APPROVAL" }], "INR");
ok("a pending one does not count", !ex.orderApproval, ex);
ex = m.orderExceptionsForCheckout([{ ...oa, status: "REJECTED" }, { ...oa, status: "INVALIDATED" }], "INR");
ok("a rejected or invalidated one does not count", !ex.orderApproval, ex);
ex = m.orderExceptionsForCheckout([oa], "USD");
ok("in another currency it does not count", !ex.orderApproval, ex);
ex = m.orderExceptionsForCheckout([oa, inc], "INR");
ok("it is marked spent with the order", m.appliedExceptionIds(new Map(), ex).includes("oa1"));

console.log(`\n${pass} passed, ${fail} failed`);
fs.rmSync(out, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
