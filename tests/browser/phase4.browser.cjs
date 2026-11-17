// The real cart drawer in headless Chrome: approval delegation and offline
// capture (Phase 4), against a pretend server.
// Needs Chrome and two small packages that are not part of the app:
//   npm i --no-save puppeteer-core bwip-js
// Set CHROME_PATH if Chrome is not in its usual place. Run: node tests/browser/<this file>
const puppeteer = require("puppeteer-core");
const fs = require("fs");
const path = require("path");
const DRAWER = fs.readFileSync(path.join(__dirname, "..", "..", "extensions", "storefront-extension", "assets", "cart-drawer.js"), "utf8");

const accounts = [
  { id: "c1", name: "Ravi Shah", company: "Test Trading Co", email: "r@x.com", status: "active" },
  { id: "c2", name: "Karine Ruby", company: "Canada Team", email: "k@x.com", status: "merged" },
  { id: "c3", name: "Test User", company: "Test Traders", email: "t@x.com", status: "active" },
];

const pageHtml = () => `<!doctype html><html><body>
  <a id="cart-icon-bubble" href="/cart">cart</a>
  <div id="sparklayer-cart-drawer-root" data-sparklayer-cart-drawer
    data-proxy-url="/apps/sparklayer/variant-search" data-variant-pricing-proxy-url="/apps/sparklayer/variant-pricing"
    data-agent-session-proxy-url="/apps/sparklayer/agent-session" data-agent-cart-proxy-url="/apps/sparklayer/agent-cart"
    data-agent-context-proxy-url="/apps/sparklayer/agent-context" data-agent-dashboard-proxy-url="/apps/sparklayer/agent-dashboard"
    data-quick-order-proxy-url="/apps/sparklayer/quick-order"
    data-customer-id="99" data-has-customer="true" data-customer-email="a@x.com" data-customer-name="Agent" data-money-format="\${{amount}}"></div>
  <script>${DRAWER.replace(/<\/script>/g, "<\\/script>")}</script></body></html>`;

(async () => {
  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const seen = { delegationPosts: [], offlinePosts: [], quickOrder: [], resolves: [] };
  const state = { entered: false, delegations: [], serverCaptures: [{ id: "cap1", customerId: "c1", customerName: "Test Trading Co", capturedAt: new Date().toISOString(), po: "PO-9", lines: [{ sku: "B-1", quantity: 3 }, { barcode: "5901234123457", quantity: 1 }] }] };
  const cartItems = [];

  await page.setRequestInterception(true);
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  page.on("dialog", (d) => d.accept());
  page.on("request", (req) => {
    const u = new URL(req.url());
    const p = u.pathname;
    const body = () => { try { return JSON.parse(req.postData() || "{}"); } catch { return {}; } };
    const json = (b, s = 200) => req.respond({ status: s, contentType: "application/json", body: JSON.stringify(b) });
    if (p === "/") return req.respond({ status: 200, contentType: "text/html", body: pageHtml() });
    if (p === "/cart.js") return json({ token: "t", currency: "USD", item_count: cartItems.length, total_price: 0, note: "", items: cartItems });
    if (p === "/cart/clear.js") return json({});
    if (p === "/cart/add.js") { const b = body(); cartItems.push({ key: b.id + ":k", id: b.id, variant_id: b.id, quantity: b.quantity, price: 1000, final_price: 1000, original_price: 1000, line_price: 1000, product_title: "Necklace", variant_title: "", sku: "S", title: "Necklace", url: "/p", image: "" }); return json({}); }
    if (p === "/apps/sparklayer/agent-session") {
      if (req.method() === "GET") return json(state.entered ? { active: true, contextId: "ctx1", state: "ACTIVE", customer: { id: "c1", name: "Ravi", company: "Test Trading Co" } } : { active: false });
      const b = body();
      if (b.intent === "mfa_status") return json({ required: false, verified: true });
      if (b.intent === "enter") { state.entered = true; return json({ ok: true }); }
      return json({});
    }
    if (p === "/apps/sparklayer/agent-context") return json({ isAgent: true });
    if (p === "/apps/sparklayer/agent-dashboard") return json({ accounts, metrics: {}, pinned: [], recent: [], cartAccounts: [] });
    if (p === "/apps/sparklayer/agent-cart") return req.method() === "GET" ? json({ items: [], version: 1 }) : json({ saved: true, version: 2 });
    if (p === "/apps/sparklayer/agent-delegations") {
      if (req.method() === "GET") return json({ delegations: state.delegations, agents: [{ id: "a1", name: "Mia Manager" }, { id: "a2", name: "Noah Newman" }] });
      const b = body();
      seen.delegationPosts.push(b);
      if (b.intent === "revoke") { state.delegations = state.delegations.filter((d) => d.id !== b.id); return json({ id: b.id, status: "revoked" }); }
      if (!b.reason) return json({ code: "REASON_REQUIRED", message: "A reason is required" }, 400);
      state.delegations.push({ id: "d1", direction: "given", delegator: { id: "me", name: "Agent" }, delegate: { id: b.delegateId, name: "Mia Manager" }, startsAt: new Date().toISOString(), endsAt: b.endsAt, reason: b.reason, coverAccess: b.coverAccess, includeQuotes: b.includeQuotes, status: "active" });
      return json({ id: "d1", status: "active" }, 201);
    }
    if (p === "/apps/sparklayer/agent-offline") {
      if (req.method() === "GET") return json({ enabled: true, captures: state.serverCaptures });
      const b = body();
      if (b.intent === "send") { seen.offlinePosts.push(b); return json({ results: b.captures.map((c) => ({ clientId: c.clientId, status: "accepted", id: "srv-" + c.clientId })) }); }
      if (b.intent === "resolve") { seen.resolves.push(b); state.serverCaptures = state.serverCaptures.filter((c) => c.id !== b.id); return json({ id: b.id, status: b.outcome }); }
      return json({});
    }
    if (p === "/apps/sparklayer/quick-order") {
      const b = body();
      seen.quickOrder.push(b.text);
      const rows = String(b.text || "").split(/\r?\n/).filter(Boolean).map((line, i) => ({ line: i + 1, input: line.split(",")[0].trim(), status: "ok", variantId: String(700 + i), title: "Necklace", sku: "N-" + i, quantity: Number(line.split(",")[1]) || 1 }));
      return json({ rows });
    }
    if (p.startsWith("/apps/sparklayer/")) return json({ variants: [], accounts: [], overrides: [], notifications: [], links: [] });
    return req.respond({ status: 404, body: "" });
  });

  let pass = 0, fail = 0;
  const ok = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  " + JSON.stringify(extra))); };
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const text = () => page.evaluate(() => (document.querySelector("[data-sl-agent-panel]") || document.body).innerText.replace(/\s+/g, " "));
  const click = (sel) => page.evaluate((s) => { const b = document.querySelector(s); if (b) b.click(); return !!b; }, sel);
  const set = (sel, value) => page.evaluate((s, v) => { const e = document.querySelector(s); e.value = v; e.dispatchEvent(new Event("input", { bubbles: true })); e.dispatchEvent(new Event("change", { bubbles: true })); }, sel, value);

  await page.goto("http://localhost/", { waitUntil: "domcontentloaded" });
  await page.click("#cart-icon-bubble");
  await wait(1500);
  await click("[data-sl-tab=account]");
  await wait(1200);

  // ---- offline capture, on the Order for Customer view
  let t = await text();
  ok("the offline card is shown when the merchant allows it", /Offline capture/.test(t), t.slice(0, 200));
  ok("a capture waiting for review is listed with its item count", /Captured, waiting for you/.test(t) && /Test Trading Co/.test(t) && /2 items/.test(t) && /PO PO-9/.test(t), t);

  await page.setOfflineMode(true);
  await page.evaluate(() => window.dispatchEvent(new Event("offline")));
  await wait(300);
  t = await text();
  ok("with no connection the card says captures stay on the device", /No connection/.test(t), t);

  await click("[data-sl-offline-open]");
  await wait(200);
  const options = await page.evaluate(() => [...document.querySelectorAll('[data-sl-offline-field="customerId"] option')].map((o) => o.textContent));
  ok("the customer choice comes from the names kept on the device, without merged accounts", options.includes("Test Trading Co") && options.includes("Test Traders") && !options.includes("Canada Team"), options);

  await click("[data-sl-offline-save]");
  await wait(200);
  t = await text();
  ok("saving with nothing filled in explains what is needed", /Choose a customer and write at least one item/.test(t), t);

  await set('[data-sl-offline-field="customerId"]', "c3");
  await set('[data-sl-offline-field="text"]', "B-1, 3\n5901234123457\nC-2 x 2\n\n  ");
  await set('[data-sl-offline-field="po"]', "PO-1");
  await click("[data-sl-offline-save]");
  await wait(400);
  const queue = await page.evaluate(() => JSON.parse(localStorage.getItem("slOfflineQueue:99") || "[]"));
  ok("a capture is kept on the device", queue.length === 1 && queue[0].customerId === "c3" && queue[0].po === "PO-1", queue);
  ok("lines are read as code and quantity (a bare code is 1)", JSON.stringify(queue[0].lines) === JSON.stringify([{ sku: "B-1", quantity: 3 }, { sku: "5901234123457", quantity: 1 }, { sku: "C-2", quantity: 2 }]), queue[0] && queue[0].lines);
  ok("it has an id and the time it was captured", /^dev-/.test(queue[0].clientId) && !isNaN(Date.parse(queue[0].capturedAt)), queue[0]);
  t = await text();
  ok("it shows under 'On this device', waiting for a connection", /On this device/.test(t) && /Test Traders/.test(t) && /Waiting for a connection/.test(t), t);
  ok("nothing was sent while offline", seen.offlinePosts.length === 0, seen.offlinePosts);

  // ---- back online: it is sent once
  await page.setOfflineMode(false);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await wait(1500);
  ok("when the connection returns it is sent, with the same id", seen.offlinePosts.length === 1 && seen.offlinePosts[0].captures[0].clientId === queue[0].clientId, seen.offlinePosts);
  const after = await page.evaluate(() => JSON.parse(localStorage.getItem("slOfflineQueue:99") || "[]"));
  ok("and leaves the device once the server has it", after.length === 0, after);
  await page.evaluate(() => window.dispatchEvent(new Event("online")));
  await wait(500);
  ok("coming online again does not send it twice", seen.offlinePosts.length === 1, seen.offlinePosts.length);

  // ---- review: items go through the normal check before the cart
  page.on("dialog", () => {});
  ok("Review is offered", await click("[data-sl-offline-review=cap1]"));
  await wait(3500);
  ok("reviewing starts the order for that customer", state.entered === true, state.entered);
  ok("and puts the captured items into the quick-order check (today's price and stock are checked there)", seen.quickOrder.length > 0 && /B-1, 3/.test(seen.quickOrder[seen.quickOrder.length - 1]) && /5901234123457, 1/.test(seen.quickOrder[seen.quickOrder.length - 1]), seen.quickOrder);
  ok("nothing is in the cart until the agent adds it", cartItems.length === 0, cartItems);
  ok("the capture is still open until then", state.serverCaptures.length === 1 && seen.resolves.length === 0, seen.resolves);
  await click("[data-sl-qo-add]");
  await wait(1500);
  ok("when the agent adds the checked items the capture is closed as added", seen.resolves.length === 1 && seen.resolves[0].id === "cap1" && seen.resolves[0].outcome === "ADDED", seen.resolves);

  // ---- delegation (on Dashboard & Tasks)
  state.entered = false;
  await page.goto("http://localhost/", { waitUntil: "domcontentloaded" });
  await page.click("#cart-icon-bubble");
  await wait(1500);
  await click("[data-sl-tab=account]");
  await wait(800);
  await click('[data-sl-agent-view="overview"]');
  await wait(500);
  t = await text();
  ok("the overview has an Approval delegation section", /Approval delegation/.test(t) && /No delegations right now/.test(t), t);

  await click("[data-sl-deleg-open]");
  await wait(200);
  await click("[data-sl-deleg-save]");
  await wait(300);
  t = await text();
  ok("an empty form says what is missing", /Choose a colleague, an end date and a reason/.test(t), t);
  ok("nothing was sent", seen.delegationPosts.length === 0, seen.delegationPosts);

  const until = new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  await set('[data-sl-deleg-field="delegateId"]', "a1");
  await set('[data-sl-deleg-field="until"]', until);
  await set('[data-sl-deleg-field="reason"]', "On holiday");
  await page.evaluate(() => { const c = document.querySelector('[data-sl-deleg-field="coverAccess"]'); c.checked = true; c.dispatchEvent(new Event("change", { bubbles: true })); });
  await click("[data-sl-deleg-save]");
  await wait(1200);
  const post = seen.delegationPosts[0] || {};
  ok("the delegation is sent with colleague, end, reason and access", post.intent === "create" && post.delegateId === "a1" && post.reason === "On holiday" && post.coverAccess === true && post.includeQuotes === true && new Date(post.endsAt).toISOString().slice(0, 10) >= until, post);
  t = await text();
  ok("it then shows in the list, with its end date and access", /To Mia Manager/.test(t) && /with access to their customers/.test(t) && /On holiday/.test(t), t);

  await click("[data-sl-deleg-end=d1]");
  await wait(1000);
  t = await text();
  ok("ending it sends the end and clears the row", seen.delegationPosts.some((x) => x.intent === "revoke" && x.id === "d1") && /No delegations right now/.test(t), t);

  // ---- logging out clears what was kept on the device
  await page.evaluate(() => localStorage.setItem("slOfflineAccounts:99", JSON.stringify({ at: Date.now(), accounts: [{ id: "c1", name: "x" }] })));
  await page.evaluate(() => { const a = document.createElement("a"); a.className = "sl-cart-usermenu-logout"; a.href = "#"; a.addEventListener("click", (e) => e.preventDefault()); document.getElementById("sparklayer-cart-drawer-root").appendChild(a); a.click(); });
  const left = await page.evaluate(() => ["slOfflineAccounts:99", "slOfflineQueue:99", "slOfflineEnabled:99"].filter((k) => localStorage.getItem(k) !== null));
  ok("logging out removes the customer names and captures kept on the device", left.length === 0, left);

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
