// The real cart drawer in headless Chrome: upload a picture of a barcode, see it checked and added.
// Needs Chrome and two small packages that are not part of the app:
//   npm i --no-save puppeteer-core bwip-js
// Set CHROME_PATH if Chrome is not in its usual place. Run: node tests/browser/<this file>
const puppeteer = require("puppeteer-core");
const bwipjs = require("bwip-js");
const fs = require("fs");
const os = require("os");
const path = require("path");
const DRAWER = fs.readFileSync(require("path").join(__dirname, "..", "..", "extensions", "storefront-extension", "assets", "cart-drawer.js"), "utf8");

const KNOWN = "5901234123457"; // a valid EAN-13

function pageHtml() {
  return `<!doctype html><html><body>
  <a id="cart-icon-bubble" href="/cart">cart</a>
  <div id="sparklayer-cart-drawer-root" data-sparklayer-cart-drawer
    data-proxy-url="/apps/sparklayer/variant-search" data-variant-pricing-proxy-url="/apps/sparklayer/variant-pricing"
    data-agent-session-proxy-url="/apps/sparklayer/agent-session" data-agent-cart-proxy-url="/apps/sparklayer/agent-cart"
    data-agent-context-proxy-url="/apps/sparklayer/agent-context" data-agent-dashboard-proxy-url="/apps/sparklayer/agent-dashboard"
    data-quick-order-proxy-url="/apps/sparklayer/quick-order"
    data-customer-id="99" data-has-customer="true" data-customer-email="a@x.com" data-customer-name="Agent" data-money-format="\${{amount}}"></div>
  <script>${DRAWER.replace(/<\/script>/g, "<\\/script>")}</script></body></html>`;
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "barcode-"));
  const png = (text, file, extra = {}) => bwipjs.toBuffer({ bcid: "ean13", text, scale: 4, height: 18, includetext: true, paddingwidth: 20, paddingheight: 20, ...extra }).then((b) => { fs.writeFileSync(path.join(dir, file), b); return path.join(dir, file); });
  const goodPhoto = await png(KNOWN, "good.png");
  const blank = path.join(dir, "blank.png");
  fs.writeFileSync(blank, await bwipjs.toBuffer({ bcid: "ean13", text: "5901234123457", scale: 1, height: 1, backgroundcolor: "FFFFFF", barcolor: "FFFFFF" }));

  const browser = await puppeteer.launch({ executablePath: process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe", headless: "new", args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream"] });
  const page = await browser.newPage();
  const cart = { items: [] };
  const seenText = [];
  await page.setRequestInterception(true);
  page.on("pageerror", (e) => console.log("PAGE ERROR", e.message));
  page.on("request", (req) => {
    const u = new URL(req.url());
    const p = u.pathname;
    const json = (b, s = 200) => req.respond({ status: s, contentType: "application/json", body: JSON.stringify(b) });
    if (p === "/") return req.respond({ status: 200, contentType: "text/html", body: pageHtml() });
    if (p === "/cart.js") return json({ token: "t", currency: "USD", item_count: cart.items.length, total_price: 0, note: "", items: cart.items.map((i) => ({ key: i.id + ":k", id: i.id, variant_id: i.id, quantity: i.quantity, price: 1000, final_price: 1000, original_price: 1000, line_price: 1000, product_title: "Necklace", variant_title: "", sku: "S", title: "Necklace", url: "/p", image: "" })) });
    if (p === "/cart/add.js") { const b = JSON.parse(req.postData() || "{}"); cart.items.push({ id: b.id, quantity: b.quantity }); return json({}); }
    if (p === "/apps/sparklayer/agent-session") return json({ active: true, contextId: "c", state: "ACTIVE", customer: { id: "c1", name: "Ravi" } });
    if (p === "/apps/sparklayer/agent-context") return json({ isAgent: true });
    if (p === "/apps/sparklayer/agent-cart") return req.method() === "GET" ? json({ items: [], version: 1 }) : json({ saved: true, version: 2 });
    if (p === "/apps/sparklayer/quick-order") {
      const b = JSON.parse(req.postData() || "{}");
      seenText.push(b.text);
      const rows = String(b.text || "").split(/\r?\n/).filter(Boolean).map((line, i) => {
        const code = line.split(",")[0].trim();
        return code === KNOWN ? { line: i + 1, input: code, status: "ok", variantId: "777", title: "Necklace", sku: "N-1", quantity: 1 } : { line: i + 1, input: code, status: "error", error: "NOT_FOUND", quantity: 1 };
      });
      return json({ rows });
    }
    if (p.startsWith("/apps/sparklayer/")) return json({ variants: [], accounts: [], overrides: [], notifications: [], links: [] });
    if (u.hostname.includes("unpkg.com")) return req.continue();
    return req.respond({ status: 404, body: "" });
  });
  await page.goto("http://localhost/", { waitUntil: "domcontentloaded" });
  await page.click("#cart-icon-bubble");
  await new Promise((r) => setTimeout(r, 1500));

  const dialogs = [];
  page.on("dialog", (d) => { dialogs.push(d.message()); d.dismiss(); });
  let pass = 0, fail = 0;
  const ok = (n, c, extra) => { c ? pass++ : fail++; console.log((c ? "PASS " : "FAIL ") + n + (c ? "" : "  " + JSON.stringify(extra))); };
  const text = () => page.evaluate(() => document.querySelector("[data-sl-qo]") ? document.querySelector("[data-sl-qo]").innerText.replace(/\s+/g, " ") : "");

  await page.evaluate(() => document.querySelector("[data-sl-qo-menu]").click());
  const menuText = await page.evaluate(() => (document.querySelector(".sl-qo-menu") || {}).innerText || "");
  ok("the Actions menu offers choosing a photo and taking one", /Upload Image/.test(menuText) && /Take photo/.test(menuText), menuText);

  // a photo with a barcode goes straight into the cart, like the live scan
  const input = await page.$("[data-sl-qo-photo-input]");
  await input.uploadFile(goodPhoto);
  await new Promise((r) => setTimeout(r, 6000));
  ok("the barcode in the photo is read and looked up", seenText.length > 0 && seenText[seenText.length - 1].startsWith(KNOWN), { seenText });
  ok("the item is added straight to the cart", cart.items.length === 1 && cart.items[0].id === 777, cart.items);

  // a photo with no barcode: a message, and nothing is added
  dialogs.length = 0;
  await page.evaluate(() => document.querySelector("[data-sl-qo-menu]").click());
  const input2 = await page.$("[data-sl-qo-photo-input]");
  await input2.uploadFile(blank);
  await new Promise((r) => setTimeout(r, 5000));
  ok("a photo with no barcode says so and adds nothing", dialogs.some((d) => /No barcode found/.test(d)) && cart.items.length === 1, { dialogs, cart: cart.items });

  // the live camera screen: its own upload button, and a round X in the corner
  cart.items = [];
  await page.evaluate(() => { const b = document.querySelector("[data-sl-qo-scan]"); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 1500));
  const camera = await page.evaluate(() => { const w = document.querySelector(".sl-qo-scan-wrapper"); return w ? w.innerText.replace(/s+/g, " ") : null; });
  ok("the camera screen offers uploading an image", /Upload Image/.test(camera || ""), camera);
  ok("the close button is a round X in the corner of the camera, not in the bottom row", await page.evaluate(() => !!document.querySelector(".sl-qo-scan-viewport .sl-qo-scan-x[data-sl-qo-close-scan]") && !document.querySelector(".sl-qo-scan-footer [data-sl-qo-close-scan]")));
  const chooser = page.waitForFileChooser({ timeout: 5000 });
  await page.evaluate(() => document.querySelector(".sl-qo-scan-wrapper [data-sl-qo-photo]").click());
  const fc = await chooser.catch(() => null);
  ok("it opens the file picker", !!fc);
  if (fc) await fc.accept([goodPhoto]);
  await new Promise((r) => setTimeout(r, 6000));
  ok("the camera is put away and the item is added", (await page.evaluate(() => !document.querySelector(".sl-qo-scan-wrapper"))) && cart.items.length === 1, cart.items);

  // the X closes the camera (on a fresh page)
  await page.goto("http://localhost/", { waitUntil: "domcontentloaded" });
  await page.click("#cart-icon-bubble");
  await new Promise((r) => setTimeout(r, 1500));
  await page.evaluate(() => { const b = document.querySelector("[data-sl-qo-scan]"); if (b) b.click(); });
  await new Promise((r) => setTimeout(r, 1500));
  const opened = await page.evaluate(() => !!document.querySelector(".sl-qo-scan-wrapper"));
  await page.evaluate(() => { const x = document.querySelector(".sl-qo-scan-x"); if (x) x.click(); });
  await new Promise((r) => setTimeout(r, 800));
  ok("the X closes the camera", opened && (await page.evaluate(() => !document.querySelector(".sl-qo-scan-wrapper"))), { opened });

  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
