// The real cart drawer in headless Chrome against a pretend server: two windows, one customer, the cart changed in the other window.
// Needs Chrome and two small packages that are not part of the app:
//   npm i --no-save puppeteer-core bwip-js
// Set CHROME_PATH if Chrome is not in its usual place. Run: node tests/browser/<this file>
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const DRAWER = fs.readFileSync(require("path").join(__dirname, "..", "..", "extensions", "storefront-extension", "assets", "cart-drawer.js"), "utf8");

const server = { ctx: "ctxA", version: 1, items: [{ variantId: "1", quantity: 1 }], log: [] };

function pageHtml() {
  return `<!doctype html><html><body>
  <a id="cart-icon-bubble" href="/cart">cart</a>
  <div id="sparklayer-cart-drawer-root" data-sparklayer-cart-drawer
    data-proxy-url="/apps/sparklayer/variant-search" data-variant-pricing-proxy-url="/apps/sparklayer/variant-pricing"
    data-agent-session-proxy-url="/apps/sparklayer/agent-session" data-agent-cart-proxy-url="/apps/sparklayer/agent-cart"
    data-agent-context-proxy-url="/apps/sparklayer/agent-context" data-agent-dashboard-proxy-url="/apps/sparklayer/agent-dashboard"
    data-agent-override-proxy-url="/apps/sparklayer/agent-override" data-agent-summary-proxy-url="/apps/sparklayer/agent-summary"
    data-agent-notifications-proxy-url="/apps/sparklayer/agent-notifications" data-agent-addresses-proxy-url="/apps/sparklayer/agent-addresses"
    data-customer-id="99" data-has-customer="true" data-customer-email="a@x.com" data-customer-name="Agent" data-money-format="\${{amount}}"></div>
  <script>${DRAWER.replace(/<\/script>/g, "<\\/script>")}</script></body></html>`;
}

async function newWindow(browser, name, cartItems) {
  const page = await browser.newPage();
  const cart = { items: cartItems.map((i) => ({ ...i })) };
  const toCartJs = () => ({
    token: "t", currency: "USD", item_count: cart.items.reduce((s, i) => s + i.quantity, 0), total_price: 0, note: "",
    items: cart.items.map((i) => ({ key: i.variantId + ":k", id: Number(i.variantId), variant_id: Number(i.variantId), quantity: i.quantity, price: 160000, final_price: 160000, original_price: 160000, line_price: 160000 * i.quantity, product_title: "Necklace", variant_title: "Gold", sku: "SKU" + i.variantId, title: "Necklace", url: "/p", image: "" })),
  });
  await page.setRequestInterception(true);
  page.on("console", (m) => { if (process.env.VERBOSE) console.log(`[${name}]`, m.text()); });
  page.on("pageerror", (e) => console.log(`[${name}] PAGE ERROR`, e.message));
  page.on("request", async (req) => {
    const url = new URL(req.url());
    const path = url.pathname;
    const json = (body, status = 200) => req.respond({ status, contentType: "application/json", body: JSON.stringify(body) });
    if (path === "/") return req.respond({ status: 200, contentType: "text/html", body: pageHtml() });
    if (path === "/cart.js") return json(toCartJs());
    if (path === "/cart/clear.js") { cart.items = []; return json({}); }
    if (path === "/cart/add.js") { const b = JSON.parse(req.postData() || "{}"); const ex = cart.items.find((i) => i.variantId === String(b.id)); if (ex) ex.quantity += b.quantity || 1; else cart.items.push({ variantId: String(b.id), quantity: b.quantity || 1 }); return json({}); }
    if (path === "/cart/change.js" || path === "/cart/update.js") {
      const b = JSON.parse(req.postData() || "{}");
      if (b.id) { const ex = cart.items.find((i) => i.variantId + ":k" === b.id || i.variantId === String(b.id)); if (ex) ex.quantity = b.quantity; }
      if (b.line) { const ex = cart.items[b.line - 1]; if (ex) ex.quantity = b.quantity; }
      cart.items = cart.items.filter((i) => i.quantity > 0);
      return json(toCartJs());
    }
    if (path === "/apps/sparklayer/agent-session") {
      if (req.method() === "GET") return json({ active: true, contextId: server.ctx, state: "ACTIVE", customer: { id: "c1", name: "Ravi", company: "Ravi Co", code: null, legalEntity: null } });
      return json({});
    }
    if (path === "/apps/sparklayer/agent-cart") {
      if (req.method() === "GET") return json({ items: server.items, currency: "USD", version: server.version });
      const b = JSON.parse(req.postData() || "{}");
      server.log.push(`${name} saves v${b.expectedVersion === undefined ? "none" : b.expectedVersion}`);
      if (b.expectedVersion != null && b.expectedVersion !== server.version) return json({ saved: false, conflict: true, items: server.items, currency: "USD", version: server.version }, 409);
      server.items = b.items; server.version += 1;
      return json({ saved: true, version: server.version });
    }
    if (path === "/apps/sparklayer/agent-context") return json({ isAgent: true });
    if (path.startsWith("/apps/sparklayer/")) return json({ variants: [], accounts: [], overrides: [], notifications: [], links: [] });
    return req.respond({ status: 404, body: "" });
  });
  await page.goto("http://localhost/", { waitUntil: "domcontentloaded" });
  await page.click("#cart-icon-bubble");
  await new Promise((r) => setTimeout(r, 1500));
  return { page, cart, name };
}

const conflictText = (w) => w.page.evaluate(() => { const el = document.querySelector(".sl-agent-conflict"); return el ? el.innerText.replace(/\s+/g, " ").trim() : null; });
const qtyShown = (w) => w.page.evaluate(() => { const el = document.querySelector(".sl-cart-qty-input, input[type=number], .sl-cart-qty-value"); return el ? (el.value || el.textContent) : null; });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  let pass = 0, fail = 0;
  const ok = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  " + JSON.stringify(extra))); };

  // ---- A opens the drawer with the cart the server holds
  const A = await newWindow(browser, "A", [{ variantId: "1", quantity: 1 }]);
  ok("window A shows the agent bar and its cart", (await A.page.evaluate(() => !!document.querySelector(".sl-cart-agent-label, [data-sl-agent-exit]"))) && (await conflictText(A)) === null, await conflictText(A));

  // ---- window B takes the customer and changes the cart on the server
  server.ctx = "ctxB"; server.version = 5; server.items = [{ variantId: "1", quantity: 2 }];

  // ---- A comes back into focus
  await A.page.evaluate(() => window.dispatchEvent(new Event("focus")));
  await sleep(1500);
  const afterFocus = await conflictText(A);
  ok("coming back into window A shows 'changed on another device'", /another device/i.test(afterFocus || ""), afterFocus);

  if (afterFocus) {
    ok("it says what is different", /1 here, 2 there/.test(afterFocus), afterFocus);
    ok("both choices are offered", /Use the other cart/.test(afterFocus) && /Keep this cart/.test(afterFocus), afterFocus);
    await A.page.evaluate(() => document.querySelector("[data-sl-cart-theirs]").click());
    await sleep(1500);
    ok("choosing the other cart puts quantity 2 in window A", A.cart.items.length === 1 && A.cart.items[0].quantity === 2, A.cart.items);
    ok("the message goes away", (await conflictText(A)) === null, await conflictText(A));
  }

  // ---- the timer path, with no focus event: B changes again, A just waits
  server.version = 9; server.items = [{ variantId: "1", quantity: 4 }];
  await sleep(11500);
  const afterWait = await conflictText(A);
  ok("without focus, window A notices within about 10 seconds", /another device/i.test(afterWait || ""), afterWait);

  // ---- a change made in A while the other window has moved on
  if (afterWait) await A.page.evaluate(() => document.querySelector("[data-sl-cart-mine]").click());
  await sleep(1200);
  server.version = 12; server.items = [{ variantId: "1", quantity: 7 }];
  await A.page.evaluate(() => { const plus = document.querySelector('[data-sl-qty-plus], .sl-cart-qty-btn[data-delta="1"], button[aria-label*="ncrease" i]'); if (plus) plus.click(); });
  await sleep(2500);
  const afterEdit = await conflictText(A);
  ok("an edit in window A after the other window moved on is a clash, not an overwrite", /another device/i.test(afterEdit || "") || server.items[0].quantity === 7, { afterEdit, serverItems: server.items });

  console.log("server log:", server.log.join(" | "));
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
