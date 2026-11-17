const { execSync } = require("child_process");
const path = require("path");
const fs = require("fs");
const os = require("os");
const S = path.join(os.tmpdir(), "sparklayer-logic-tests") + "/";
fs.mkdirSync(S, { recursive: true });
const APP = path.join(__dirname, "..", "..");
const out = S + "compiled_ro";
fs.rmSync(out, { recursive: true, force: true });
execSync(`npx tsc "${APP}/app/services/reorder.server.ts" --outDir "${out}" --module commonjs --target es2020 --skipLibCheck`, { cwd: APP, stdio: "pipe" });
const m = require(path.join(out, "reorder.server.js"));
let pass = 0, fail = 0;
const ok = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  " + JSON.stringify(extra))); };

const line = (over = {}, variant = {}) => ({
  title: "Bracelet", sku: "B-1", quantity: 5,
  variant: { id: "gid://shopify/ProductVariant/11", title: "Gold", availableForSale: true, inventoryPolicy: "DENY", inventoryQuantity: 100, product: { title: "Sunflower Bracelet", status: "ACTIVE" }, ...variant },
  ...over,
});

let r = m.evaluateReorderLine(line());
ok("a normal line is added as it was", r.status === "ADDED" && r.quantity === 5 && r.variantId === "11" && r.note === "", r);
ok("the name comes from today's product, with the variant", r.title === "Sunflower Bracelet - Gold", r.title);
r = m.evaluateReorderLine(line({}, { title: "Default Title" }));
ok("'Default Title' is not shown", r.title === "Sunflower Bracelet", r.title);

r = m.evaluateReorderLine(line({ variant: null }));
ok("a deleted item -> UNAVAILABLE, nothing added", r.status === "UNAVAILABLE" && r.quantity === 0 && r.variantId === null && /no longer sold/.test(r.note), r);
r = m.evaluateReorderLine(line({}, { product: { title: "Old", status: "ARCHIVED" } }));
ok("a discontinued (archived) product -> UNAVAILABLE", r.status === "UNAVAILABLE" && r.quantity === 0 && /discontinued/.test(r.note), r);
r = m.evaluateReorderLine(line({}, { product: { title: "Hidden", status: "DRAFT" } }));
ok("a product not on sale (draft) -> RESTRICTED", r.status === "RESTRICTED" && r.quantity === 0, r);
r = m.evaluateReorderLine(line({}, { availableForSale: false }));
ok("out of stock -> UNAVAILABLE", r.status === "UNAVAILABLE" && /Out of stock/.test(r.note), r);
r = m.evaluateReorderLine(line({ quantity: 10 }, { inventoryQuantity: 4 }));
ok("less stock than before -> QUANTITY_ADJUSTED to what is left, with the reason", r.status === "QUANTITY_ADJUSTED" && r.quantity === 4 && r.requested === 10 && /Only 4/.test(r.note), r);
r = m.evaluateReorderLine(line({ quantity: 10 }, { inventoryQuantity: 0 }));
ok("no stock left -> UNAVAILABLE", r.status === "UNAVAILABLE" && r.quantity === 0, r);
r = m.evaluateReorderLine(line({ quantity: 10 }, { inventoryQuantity: -3 }));
ok("negative stock counts as none", r.status === "UNAVAILABLE", r);
r = m.evaluateReorderLine(line({ quantity: 10 }, { inventoryPolicy: "CONTINUE", inventoryQuantity: 2 }));
ok("an item sold past zero stock keeps its quantity", r.status === "ADDED" && r.quantity === 10, r);
r = m.evaluateReorderLine(line({ quantity: 10 }, { inventoryQuantity: null }));
ok("stock not tracked -> added as ordered", r.status === "ADDED" && r.quantity === 10, r);
r = m.evaluateReorderLine(line({ quantity: 3 }, { inventoryQuantity: 3 }));
ok("exactly enough stock -> added", r.status === "ADDED" && r.quantity === 3, r);

const rows = m.evaluateReorder([
  line({ quantity: 2 }), line({ quantity: 3 }),
  line({ variant: null }),
  line({ quantity: 8 }, { id: "gid://shopify/ProductVariant/22", inventoryQuantity: 5 }),
]);
ok("the same item twice becomes one line (2 + 3)", rows.filter((x) => x.variantId === "11").length === 1 && rows[0].quantity === 5 && rows[0].requested === 5, rows);
ok("every line gets its own answer, in order", rows.length === 3 && rows[1].status === "UNAVAILABLE" && rows[2].status === "QUANTITY_ADJUSTED", rows.map((x) => x.status));
ok("empty order -> nothing", m.evaluateReorder([]).length === 0);


// ---- substitutes
const subs = new Map([["b-1", { toSku: "B-2", note: "Same style, new finish." }]]);
const sub = (over = {}) => ({ id: "gid://shopify/ProductVariant/22", sku: "B-2", title: "Sunflower Bracelet 2", availableForSale: true, inventoryPolicy: "DENY", inventoryQuantity: 50, productStatus: "ACTIVE", ...over });
const found = (v) => new Map([["b-2", v]]);
const gone = m.evaluateReorder([line({}, { product: { title: "Sunflower Bracelet", status: "ARCHIVED" } })]);

let rows2 = m.applySubstitutes(gone, subs, found(sub()));
ok("a discontinued item with a substitute is offered the substitute", rows2[0].status === "SUBSTITUTED" && rows2[0].variantId === "22" && rows2[0].sku === "B-2" && rows2[0].quantity === 5, rows2);
ok("the offer says what it replaces and carries the merchant's note", rows2[0].replaces.sku === "B-1" && /Offered instead of/.test(rows2[0].note) && /Same style, new finish\./.test(rows2[0].note), rows2[0]);
rows2 = m.applySubstitutes(gone, subs, found(sub({ inventoryQuantity: 3 })));
ok("not enough substitute stock: offered at what there is, and says so", rows2[0].status === "SUBSTITUTED" && rows2[0].quantity === 3 && /Only 3 in stock/.test(rows2[0].note), rows2);
rows2 = m.applySubstitutes(gone, subs, found(sub({ inventoryQuantity: 0 })));
ok("a substitute that is out of stock is not offered", rows2[0].status === "UNAVAILABLE", rows2);
rows2 = m.applySubstitutes(gone, subs, found(sub({ availableForSale: false })));
ok("a substitute that can't be sold is not offered", rows2[0].status === "UNAVAILABLE", rows2);
rows2 = m.applySubstitutes(gone, subs, found(sub({ productStatus: "DRAFT" })));
ok("a substitute that is not active is not offered", rows2[0].status === "UNAVAILABLE", rows2);
rows2 = m.applySubstitutes(gone, subs, new Map());
ok("a substitute that can't be found is not offered", rows2[0].status === "UNAVAILABLE", rows2);
rows2 = m.applySubstitutes(gone, new Map(), found(sub()));
ok("an item with no substitute set stays as it was", rows2[0].status === "UNAVAILABLE", rows2);
rows2 = m.applySubstitutes(m.evaluateReorder([line()]), subs, found(sub()));
ok("an item that can be added is left alone", rows2[0].status === "ADDED" && rows2[0].sku === "B-1", rows2);
rows2 = m.applySubstitutes(m.evaluateReorder([line({ quantity: 5 }, { inventoryQuantity: 2 })]), subs, found(sub()));
ok("a quantity that was only adjusted is left alone", rows2[0].status === "QUANTITY_ADJUSTED", rows2);
rows2 = m.applySubstitutes(m.evaluateReorder([line({}, { product: { title: "X", status: "DRAFT" } })]), subs, found(sub()));
ok("an item that can't be ordered right now also gets its substitute", rows2[0].status === "SUBSTITUTED", rows2);
rows2 = m.applySubstitutes(m.evaluateReorder([line({ sku: null }, { product: { title: "X", status: "ARCHIVED" } })]), subs, found(sub()));
ok("no SKU, no substitute", rows2[0].status === "UNAVAILABLE", rows2);
rows2 = m.applySubstitutes(m.evaluateReorder([line({ sku: "b-1" }, { product: { title: "X", status: "ARCHIVED" } })]), subs, found(sub()));
ok("SKUs match regardless of capital letters", rows2[0].status === "SUBSTITUTED", rows2);
rows2 = m.applySubstitutes(m.evaluateReorder([line({}, { inventoryQuantity: 100, availableForSale: false })]), subs, found(sub({ inventoryPolicy: "CONTINUE", inventoryQuantity: -5 })));
ok("a substitute that can be backordered is offered in full", rows2[0].status === "SUBSTITUTED" && rows2[0].quantity === 5, rows2);

console.log(`\n${pass} passed, ${fail} failed`);
fs.rmSync(out, { recursive: true, force: true });
process.exit(fail ? 1 : 0);
