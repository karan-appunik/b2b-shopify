import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { decideApprovalLink, openApprovalLink } from "../services/agentContext.server";

// The page behind the link in an approver's email (spec §8.4). The link works
// once, only for the approver it was made for, only while they are signed in,
// and only until it expires. The server decides all of that; this draws the
// request and sends the decision back.

const TYPE_TEXT: Record<string, string> = {
  UNIT_PRICE: "Price change",
  ORDER_DISCOUNT: "Order discount",
  QUANTITY_RULE: "Quantity rule exception",
  SHIPPING_PRICE: "Shipping price",
  CUSTOM_LINE: "Custom line",
};

const esc = (value: unknown) =>
  String(value ?? "")
    .split("&").join("&amp;")
    .split("<").join("&lt;")
    .split(">").join("&gt;")
    .split("{").join("&#123;")
    .split('"').join("&quot;");

function money(m: { amount: number; currency: string } | null | undefined) {
  if (!m) return "-";
  if (m.currency === "QTY") return String(m.amount);
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency: m.currency }).format(m.amount / 100);
  } catch {
    return `${m.amount / 100} ${m.currency}`;
  }
}

const shell = (title: string, inner: string, status = 200) =>
  new Response(
    `<div style="max-width:560px;margin:48px auto;padding:0 16px;font-family:inherit">
       <h2 style="margin:0 0 12px">${esc(title)}</h2>
       ${inner}
     </div>`,
    { status, headers: { "Content-Type": "application/liquid" } },
  );

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

async function resolveShopper(request: Request) {
  const { session } = await authenticate.public.appProxy(request);
  const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");
  return session ? { shop: session.shop, loggedInCustomerId } : null;
}

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper) return shell("Link not available", "<p>This approval link isn't available.</p>", 404);

    const token = params.token || "";
    if (!shopper.loggedInCustomerId) {
      const back = encodeURIComponent(`/apps/sparklayer/approve/${token}`);
      return shell(
        "Sign in to review",
        `<p>Sign in to your account to review this request.</p>
         <a href="/account/login?return_url=${back}" style="display:inline-block;padding:10px 20px;background:#111;color:#fff;border-radius:6px;text-decoration:none">Sign in</a>`,
      );
    }

    const result = await openApprovalLink(shopper.shop, shopper.loggedInCustomerId, token);
    if (result.status === 410) return shell("Link no longer valid", "<p>This link has already been used or has expired.</p>", 410);
    if (result.status === 409) return shell("Already decided", "<p>This request has already been decided.</p>");
    if (result.status !== 200 || !result.body) return shell("Link not available", "<p>This approval link isn't available for this account.</p>", 404);

    const r = result.body;
    const rows: string[] = [
      `<tr><td>Requested by</td><td>${esc(r.agentName)}</td></tr>`,
      `<tr><td>Customer</td><td>${esc(r.customerName)}</td></tr>`,
    ];
    if (r.custom) {
      rows.push(`<tr><td>Item</td><td>${esc(r.custom.title)} x ${esc(r.custom.quantity)}</td></tr>`);
      rows.push(`<tr><td>Unit price</td><td>${esc(money(r.proposed))}</td></tr>`);
    } else {
      rows.push(`<tr><td>Baseline</td><td>${esc(money(r.baseline))}</td></tr>`);
      rows.push(`<tr><td>Requested</td><td>${esc(money(r.proposed))}${r.deltaPercent != null ? ` (${esc(r.deltaPercent)}% lower)` : ""}</td></tr>`);
    }
    if (r.impact) {
      rows.push(`<tr><td>Price impact</td><td>${esc(money({ amount: r.impact.total, currency: r.impact.currency }))} given up (cost is not tracked, so this is not a margin)</td></tr>`);
    }
    const h = r.history;
    if (h) {
      rows.push(
        `<tr><td>Customer history</td><td>${esc(h.orders)} orders, ${esc(money({ amount: h.orderTotal, currency: h.currency || "USD" }))} spent. Exceptions in 90 days: ${esc(h.exceptions90d.total)} (${esc(h.exceptions90d.approved)} approved, ${esc(h.exceptions90d.rejected)} refused)</td></tr>`,
      );
    }
    rows.push(`<tr><td>Reason</td><td>${esc(r.reasonText)}</td></tr>`);

    const script = `
      var btns = document.querySelectorAll("[data-decision]");
      var msg = document.getElementById("sl-appr-msg");
      btns.forEach(function (b) {
        b.addEventListener("click", function () {
          var decision = b.getAttribute("data-decision");
          var comment = document.getElementById("sl-appr-comment").value;
          if (decision === "reject" && !comment.trim()) { msg.textContent = "Add a comment to reject."; return; }
          btns.forEach(function (x) { x.disabled = true; });
          fetch(window.location.href, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision: decision, comment: comment }) })
            .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
            .then(function (result) {
              if (result.ok) { document.getElementById("sl-appr-box").innerHTML = "<p><strong>Done.</strong> The request was " + (decision === "approve" ? "approved" : "rejected") + ".</p>"; return; }
              btns.forEach(function (x) { x.disabled = false; });
              msg.textContent = result.body.code === "STEP_UP_REQUIRED"
                ? "Confirm your authenticator code first: open the cart drawer, My Account, then use this link again."
                : (result.body.message || "That did not work.");
            })
            .catch(function () { btns.forEach(function (x) { x.disabled = false; }); msg.textContent = "Something went wrong."; });
        });
      });`;

    return shell(
      TYPE_TEXT[r.type] || "Exception",
      `<div id="sl-appr-box">
         <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.join("")}</table>
         <textarea id="sl-appr-comment" rows="3" placeholder="Comment (required to reject)" style="width:100%;box-sizing:border-box;margin:16px 0 8px;padding:8px"></textarea>
         <p id="sl-appr-msg" style="color:#b91c1c;margin:0 0 8px"></p>
         <button type="button" data-decision="approve" style="padding:10px 20px;background:#111;color:#fff;border:0;border-radius:6px;cursor:pointer">Approve</button>
         <button type="button" data-decision="reject" style="padding:10px 20px;background:#fff;color:#111;border:1px solid #999;border-radius:6px;cursor:pointer;margin-left:8px">Reject</button>
       </div>
       <script>${script}</script>`,
    );
  } catch (error) {
    console.error("approve proxy error:", error);
    return shell("Something went wrong", "<p>Please try again in a moment.</p>", 500);
  }
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  try {
    const shopper = await resolveShopper(request);
    if (!shopper || !shopper.loggedInCustomerId) return json({ message: "Not authorized" }, 403);

    const body = await request.json().catch(() => ({}));
    const result = await decideApprovalLink(
      shopper.shop,
      shopper.loggedInCustomerId,
      params.token || "",
      String(body.decision ?? ""),
      String(body.comment ?? ""),
    );
    return json(result.body ?? {}, result.status);
  } catch (error) {
    console.error("approve proxy error:", error);
    return json({ message: "Something went wrong" }, 500);
  }
};
