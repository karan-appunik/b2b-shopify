import type { LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import {
  getAgentContext,
  getAgentDashboard,
  getAgentSession,
} from "../services/agentContext.server";

// The Sales Agent Portal (spec §4.2/§4.3): a single storefront page, reached
// at /apps/sparklayer/agent-portal, where a signed-in agent sees the accounts
// they may act for, searches them, and starts or exits a customer context.
// Nothing about it appears on any other storefront page.
//
// Returned as `application/liquid` so Shopify renders it inside the store's
// theme layout. That means Liquid will parse this whole string — keep any
// double-brace / brace-percent sequences out of the markup and script.

const PAGE_STYLE = `
  .slp { max-width: 960px; margin: 0 auto; padding: 32px 16px; font-family: inherit; }
  .slp h1 { font-size: 28px; margin: 0 0 4px; }
  .slp-sub { color: #6b7280; margin: 0 0 24px; }
  .slp-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 12px; margin-bottom: 24px; }
  .slp-card { border: 1px solid #e5e7eb; border-radius: 10px; padding: 16px; background: #fff; }
  .slp-card-label { font-size: 13px; color: #6b7280; }
  .slp-card-value { font-size: 24px; font-weight: 600; margin-top: 4px; }
  .slp-active { display: flex; flex-wrap: wrap; align-items: center; gap: 12px; padding: 14px 16px; margin-bottom: 24px; border-radius: 10px; background: #1f2937; color: #fff; }
  .slp-active-text { flex: 1; min-width: 200px; }
  .slp-btn { padding: 8px 16px; border-radius: 8px; border: 1px solid #111827; background: #111827; color: #fff; font-size: 14px; cursor: pointer; text-decoration: none; display: inline-block; }
  .slp-btn-light { background: transparent; color: inherit; border-color: currentColor; }
  .slp-search { width: 100%; padding: 12px 14px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 15px; box-sizing: border-box; }
  .slp h2 { font-size: 18px; margin: 24px 0 12px; }
  .slp-list { border: 1px solid #e5e7eb; border-radius: 10px; background: #fff; overflow: hidden; }
  .slp-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-bottom: 1px solid #f3f4f6; }
  .slp-row:last-child { border-bottom: none; }
  .slp-row-main { flex: 1; min-width: 0; }
  .slp-row-name { font-weight: 600; }
  .slp-row-meta { font-size: 13px; color: #6b7280; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .slp-empty { padding: 20px 16px; color: #9ca3af; text-align: center; }
  .slp-error { color: #b91c1c; margin: 12px 0; }
  .slp-notice { margin: 0 0 16px; padding: 12px 16px; border-radius: 10px; background: #fef3c7; color: #78350f; font-size: 14px; }
  .slp-btn[disabled] { opacity: 0.5; cursor: not-allowed; }
  .slp-mfa p { margin: 8px 0; }
  .slp-secret { padding: 4px 8px; border-radius: 6px; background: #fff; font-size: 15px; letter-spacing: 1px; word-break: break-all; }
  .slp-mfa-code { width: 140px; padding: 8px 10px; border: 1px solid #d1d5db; border-radius: 8px; font-size: 18px; letter-spacing: 4px; text-align: center; }
`;

const PAGE_SCRIPT = `
(function () {
  var data = window.__SL_AGENT_PORTAL__;
  var root = document.getElementById("sl-agent-portal");
  if (!data || !root) return;

  var searchUrl = "/apps/sparklayer/agent-search";
  var sessionUrl = "/apps/sparklayer/agent-session";
  var cartUrl = "/apps/sparklayer/agent-cart";
  var ordersUrl = "/apps/sparklayer/agent-orders";

  var session = data.session && data.session.active ? data.session : null;
  var searchResults = null;
  var recentOrders = null;
  var errorMessage = "";
  var restoreIssues = [];
  var reorderResult = null;
  var busy = false;
  // The authenticator-app check: { customerId, enrolled, secret, otpauthUrl, code, error }
  var mfaPrompt = null;
  var mfaSetupDone = false;

  function esc(value) {
    var div = document.createElement("div");
    div.textContent = value == null ? "" : String(value);
    return div.innerHTML;
  }

  function formatMoney(amount, currency) {
    try {
      return new Intl.NumberFormat(undefined, { style: "currency", currency: currency }).format(amount);
    } catch (e) {
      return amount + " " + currency;
    }
  }

  function jsonFetch(url, options) {
    return fetch(url, options)
      .then(function (res) {
        return res.json().then(function (body) {
          return { ok: res.ok, body: body };
        });
      })
      .catch(function () {
        return { ok: false, body: null };
      });
  }

  function postJson(url, payload) {
    return jsonFetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // ---- cart helpers: the storefront cart is the working copy, the server
  // keeps a saved copy per customer so it survives switching and devices.

  function readShopifyCart() {
    return fetch("/cart.js")
      .then(function (res) { return res.json(); })
      .catch(function () { return { items: [], currency: null }; });
  }

  // Saves the storefront cart against the customer the agent is currently
  // ordering for (the server decides who that is).
  function persistCart() {
    return readShopifyCart().then(function (cart) {
      var items = (cart.items || []).map(function (item) {
        return { variantId: String(item.variant_id), quantity: item.quantity };
      });
      return postJson(cartUrl, { items: items, currency: cart.currency });
    });
  }

  function clearShopifyCart() {
    return fetch("/cart/clear.js", { method: "POST" }).catch(function () {});
  }

  // Adds lines one at a time so one sold-out item doesn't block the rest.
  // Always priced fresh by the store — old prices are never copied.
  function addLines(lines) {
    var results = { added: [], failed: [] };
    var chain = Promise.resolve();

    lines.forEach(function (line) {
      chain = chain.then(function () {
        return fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Number(line.variantId), quantity: line.quantity }),
        })
          .then(function (res) {
            (res.ok ? results.added : results.failed).push(line);
          })
          .catch(function () {
            results.failed.push(line);
          });
      });
    });

    return chain.then(function () { return results; });
  }

  // ---- rendering

  function accountRow(account) {
    var meta = [account.email, account.company, account.territory].filter(Boolean).map(esc).join(" · ");
    return (
      '<div class="slp-row">' +
        '<div class="slp-row-main">' +
          '<div class="slp-row-name">' + esc(account.name) + "</div>" +
          '<div class="slp-row-meta">' + meta + "</div>" +
        "</div>" +
        '<button type="button" class="slp-btn"' + (busy ? " disabled" : "") + ' data-start="' + esc(account.id) + '">Start order</button>' +
      "</div>"
    );
  }

  function listHtml(accounts, emptyText) {
    if (!accounts.length) return '<div class="slp-list"><div class="slp-empty">' + esc(emptyText) + "</div></div>";
    return '<div class="slp-list">' + accounts.map(accountRow).join("") + "</div>";
  }

  function orderRow(order, index) {
    var date = new Date(order.createdAt).toLocaleDateString();
    return (
      '<div class="slp-row">' +
        '<div class="slp-row-main">' +
          '<div class="slp-row-name">' + esc(order.name) + "</div>" +
          '<div class="slp-row-meta">' + esc(date) + " · " + esc(formatMoney(order.total, order.currency)) + " · " + esc(order.lines.length) + " item line(s)</div>" +
        "</div>" +
        '<button type="button" class="slp-btn"' + (busy || !order.lines.length ? " disabled" : "") + ' data-reorder="' + index + '">Reorder</button>' +
      "</div>"
    );
  }

  function mfaHtml() {
    if (!mfaPrompt) return "";

    var setup = "";
    if (!mfaPrompt.enrolled) {
      setup =
        "<p>Your role needs an authenticator app. Add this key to Google Authenticator, Microsoft Authenticator, 1Password or similar:</p>" +
        '<p><code class="slp-secret">' + esc(mfaPrompt.secret || "…") + "</code></p>" +
        (mfaPrompt.otpauthUrl
          ? '<p><a href="' + esc(mfaPrompt.otpauthUrl) + '">Open in my authenticator app</a></p>'
          : "");
    }

    return (
      '<div class="slp-notice slp-mfa">' +
        "<strong>Verify it's you</strong>" +
        setup +
        "<p>Enter the 6-digit code from your authenticator app.</p>" +
        '<input type="text" class="slp-mfa-code" data-mfa-code inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456">' +
        ' <button type="button" class="slp-btn" data-mfa-submit' + (mfaPrompt.busy ? " disabled" : "") + ">Verify</button>" +
        ' <button type="button" class="slp-btn slp-btn-light" data-mfa-cancel>Cancel</button>' +
        (mfaPrompt.error ? '<p class="slp-error">' + esc(mfaPrompt.error) + "</p>" : "") +
      "</div>"
    );
  }

  function noticeHtml() {
    var html = "";

    if (mfaSetupDone) {
      html += '<div class="slp-notice">Two-step verification is set up. Your access is active.</div>';
    }

    if (restoreIssues.length) {
      html +=
        '<div class="slp-notice">' +
          "<strong>Some saved items could not be restored</strong> (unavailable or not enough stock): " +
          esc(restoreIssues.map(function (l) { return "variant " + l.variantId; }).join(", ")) +
          '. <a href="/">Continue to the store</a>' +
        "</div>";
    }

    if (reorderResult) {
      html +=
        '<div class="slp-notice">' +
          "<strong>Reorder " + esc(reorderResult.order) + ":</strong> " +
          esc(reorderResult.added) + " of " + esc(reorderResult.total) + " item line(s) added to the cart at today's prices." +
          (reorderResult.failed.length
            ? " Not added (unavailable or not enough stock): " + esc(reorderResult.failed.join(", ")) + "."
            : "") +
          " Review the cart before checkout. " +
          '<a href="/">Go to the store</a>' +
        "</div>";
    }

    return html;
  }

  function render() {
    var revenue = data.dashboard.month.revenue.length
      ? data.dashboard.month.revenue.map(function (r) { return formatMoney(r.amount, r.currency); }).join(" · ")
      : "0";

    var html =
      "<h1>Sales Agent Portal</h1>" +
      '<p class="slp-sub">Signed in as ' + esc(data.dashboard.agent.name) + "</p>";

    if (session) {
      var who = session.customer.name + (session.customer.company ? " (" + session.customer.company + ")" : "");
      html +=
        '<div class="slp-active">' +
          '<span class="slp-active-text">Ordering for: <strong>' + esc(who) + "</strong></span>" +
          '<a class="slp-btn slp-btn-light" href="/">Continue shopping</a>' +
          '<button type="button" class="slp-btn slp-btn-light"' + (busy ? " disabled" : "") + " data-exit>Exit</button>" +
        "</div>";
    }

    html += mfaHtml();
    html += noticeHtml();

    html +=
      '<div class="slp-cards">' +
        '<div class="slp-card"><div class="slp-card-label">Assigned accounts</div><div class="slp-card-value">' + esc(data.dashboard.assignedCount) + "</div></div>" +
        '<div class="slp-card"><div class="slp-card-label">Orders this month</div><div class="slp-card-value">' + esc(data.dashboard.month.orders) + "</div></div>" +
        '<div class="slp-card"><div class="slp-card-label">Revenue this month</div><div class="slp-card-value">' + esc(revenue) + "</div></div>" +
      "</div>" +
      '<input type="text" class="slp-search" placeholder="Search accounts by name, email or company" data-search autocomplete="off">';

    if (errorMessage) html += '<p class="slp-error">' + esc(errorMessage) + "</p>";

    if (searchResults) {
      html += "<h2>Search results</h2>" + listHtml(searchResults, "No matching accounts");
    }

    html += "<h2>Your accounts</h2>" + listHtml(
      data.dashboard.accounts,
      "No accounts yet — ask an administrator to give you access to customers."
    );

    if (session) {
      html += "<h2>Recent orders for " + esc(session.customer.name) + "</h2>";
      if (recentOrders === null) {
        html += '<div class="slp-list"><div class="slp-empty">Loading…</div></div>';
      } else if (!recentOrders.length) {
        html += '<div class="slp-list"><div class="slp-empty">No orders yet.</div></div>';
      } else {
        html += '<div class="slp-list">' + recentOrders.map(orderRow).join("") + "</div>";
      }
    }

    var keep = root.querySelector("[data-search]");
    var previous = keep ? keep.value : "";
    var hadFocus = keep && document.activeElement === keep;
    root.innerHTML = html;

    var input = root.querySelector("[data-search]");
    input.value = previous;
    if (hadFocus) input.focus();

    var codeInput = root.querySelector("[data-mfa-code]");
    if (codeInput && mfaPrompt) {
      codeInput.value = mfaPrompt.code || "";
      if (mfaPrompt.focus) {
        codeInput.focus();
        mfaPrompt.focus = false;
      }
    }
  }

  function loadRecentOrders() {
    if (!session) {
      recentOrders = null;
      return Promise.resolve();
    }
    return jsonFetch(ordersUrl).then(function (result) {
      recentOrders = result.ok && result.body ? result.body.orders || [] : [];
      render();
    });
  }

  // ---- actions

  // Switching customers: the cart built for the current customer is saved
  // first, the storefront cart is emptied, and the next customer's saved cart
  // (if any) is restored — nothing leaks between accounts.
  function startOrder(customerId) {
    errorMessage = "";
    busy = true;
    render();

    // Roles that require MFA must pass the authenticator check before a
    // customer is entered — asked first, so the cart isn't touched if a code
    // is still needed.
    return postJson(sessionUrl, { intent: "mfa_status" }).then(function (status) {
      var s = status.body || {};
      if (s.required && !s.verified) {
        busy = false;
        return beginMfa(customerId, s);
      }
      return proceedWithOrder(customerId);
    });
  }

  function beginMfa(customerId, status) {
    mfaPrompt = { customerId: customerId, enrolled: !!status.enrolled, code: "", error: "", focus: true };

    if (status.enrolled) {
      render();
      return Promise.resolve();
    }

    render();
    return postJson(sessionUrl, { intent: "mfa_enroll" }).then(function (result) {
      if (result.ok && result.body) {
        mfaPrompt.secret = result.body.secret;
        mfaPrompt.otpauthUrl = result.body.otpauthUrl;
      } else {
        mfaPrompt.error = "Could not start the setup. Please try again.";
      }
      render();
    });
  }

  function submitMfa() {
    if (!mfaPrompt || mfaPrompt.busy) return;

    var code = (mfaPrompt.code || "").split(" ").join("");
    if (code.length !== 6) {
      mfaPrompt.error = "Enter the 6-digit code.";
      render();
      return;
    }

    mfaPrompt.busy = true;
    mfaPrompt.error = "";
    render();

    postJson(sessionUrl, { intent: "mfa_verify", code: code }).then(function (result) {
      if (result.ok) {
        var customerId = mfaPrompt.customerId;
        mfaPrompt = null;
        if (customerId) {
          proceedWithOrder(customerId);
        } else {
          // Set-up on arrival (no order was being started): access is now active.
          mfaSetupDone = true;
          render();
        }
        return;
      }

      var reason = result.body && result.body.code;
      mfaPrompt.busy = false;
      mfaPrompt.code = "";
      mfaPrompt.focus = true;
      mfaPrompt.error =
        reason === "LOCKED"
          ? "Too many wrong codes. Try again in a few minutes."
          : "That code isn't right. Check your authenticator app and try again.";
      render();
    });
  }

  // Onboarding (spec §3.1): a role that requires MFA is activated by setting
  // up the authenticator, so it is offered as soon as the portal opens.
  function checkMfaSetup() {
    return postJson(sessionUrl, { intent: "mfa_status" }).then(function (status) {
      var s = status.body || {};
      if (s.required && !s.enrolled) return beginMfa(null, s);
    });
  }

  function proceedWithOrder(customerId) {
    busy = true;
    errorMessage = "";
    restoreIssues = [];
    reorderResult = null;
    render();

    var saved = session ? persistCart() : Promise.resolve();

    return saved
      .then(clearShopifyCart)
      .then(function () {
        return postJson(sessionUrl, { intent: "enter", customerId: customerId });
      })
      .then(function (result) {
        if (!result.ok) {
          busy = false;
          if (result.body && result.body.code === "MFA_REQUIRED") {
            // The check lapsed between the status read and now: ask again.
            return beginMfa(customerId, { enrolled: true }).then(function () { return null; });
          }
          errorMessage = "You no longer have access to this customer.";
          render();
          return null;
        }
        session = result.body;
        recentOrders = null;
        return jsonFetch(cartUrl).then(function (cartResult) {
          var lines = cartResult.ok && cartResult.body ? cartResult.body.items || [] : [];
          return addLines(lines);
        });
      })
      .then(function (results) {
        if (!results) return;
        if (results.failed.length) {
          busy = false;
          restoreIssues = results.failed;
          render();
          loadRecentOrders();
          return;
        }
        window.location.assign("/");
      })
      .catch(function () {
        busy = false;
        errorMessage = "Something went wrong. Please try again.";
        render();
      });
  }

  function exitContext() {
    var contextId = session ? session.contextId : null;
    if (!contextId) return;

    busy = true;
    render();

    persistCart()
      .then(function () {
        return postJson(sessionUrl, { intent: "exit", contextId: contextId });
      })
      .then(clearShopifyCart)
      .then(function () {
        busy = false;
        session = null;
        recentOrders = null;
        reorderResult = null;
        restoreIssues = [];
        render();
      });
  }

  function reorder(index) {
    var order = recentOrders && recentOrders[index];
    if (!order || !session) return;

    busy = true;
    reorderResult = null;
    render();

    addLines(order.lines)
      .then(function (results) {
        return persistCart().then(function () {
          reorderResult = {
            order: order.name,
            total: order.lines.length,
            added: results.added.length,
            failed: results.failed.map(function (l) { return l.title || l.sku || "variant " + l.variantId; }),
          };
        });
      })
      .then(function () {
        busy = false;
        render();
      });
  }

  root.addEventListener("click", function (event) {
    var start = event.target.closest("[data-start]");
    if (start && !busy) {
      startOrder(start.getAttribute("data-start"));
      return;
    }

    var reorderBtn = event.target.closest("[data-reorder]");
    if (reorderBtn && !busy) {
      reorder(Number(reorderBtn.getAttribute("data-reorder")));
      return;
    }

    if (event.target.closest("[data-mfa-submit]")) {
      submitMfa();
      return;
    }

    if (event.target.closest("[data-mfa-cancel]")) {
      mfaPrompt = null;
      render();
      return;
    }

    if (event.target.closest("[data-exit]") && !busy) {
      exitContext();
    }
  });

  root.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.matches("[data-mfa-code]")) {
      event.preventDefault();
      submitMfa();
    }
  });

  var debounce = null;
  var requestId = 0;
  root.addEventListener("input", function (event) {
    if (event.target.matches("[data-mfa-code]") && mfaPrompt) {
      mfaPrompt.code = event.target.value;
      return;
    }
    if (!event.target.matches("[data-search]")) return;
    var q = event.target.value.trim();
    clearTimeout(debounce);

    if (!q) {
      searchResults = null;
      render();
      return;
    }

    debounce = setTimeout(function () {
      var current = ++requestId;
      jsonFetch(searchUrl + "?q=" + encodeURIComponent(q)).then(function (result) {
        if (current !== requestId) return;
        searchResults = result.ok && result.body ? result.body.customers || [] : [];
        render();
      });
    }, 300);
  });

  render();
  loadRecentOrders();
  checkMfaSetup();
})();
`;

function page(body: string, extraScript = ""): Response {
  const html = `<style>${PAGE_STYLE}</style><div class="slp" id="sl-agent-portal">${body}</div>${extraScript}`;
  return new Response(html, { headers: { "Content-Type": "application/liquid" } });
}

function message(text: string): Response {
  return page(`<h1>Sales Agent Portal</h1><p class="slp-sub">${text}</p>`);
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    const { session } = await authenticate.public.appProxy(request);
    const loggedInCustomerId = new URL(request.url).searchParams.get("logged_in_customer_id");

    if (!session) return message("This page is not available.");
    if (!loggedInCustomerId) {
      return message('Please <a href="/account/login">log in</a> to use the Sales Agent Portal.');
    }

    const agentContext = await getAgentContext(session.shop, loggedInCustomerId);
    if (!agentContext.isAgent) return message("This page is only available to sales agents.");

    const [dashboard, agentSession] = await Promise.all([
      getAgentDashboard(session.shop, loggedInCustomerId),
      getAgentSession(session.shop, loggedInCustomerId),
    ]);
    if (!dashboard) return message("The portal is temporarily unavailable. Please try again shortly.");

    // `<` is escaped so no customer-controlled text can close the script tag.
    const payload = JSON.stringify({ dashboard, session: agentSession }).replace(/</g, "\\u003c");

    return page(
      "",
      `<script>window.__SL_AGENT_PORTAL__ = ${payload};</script><script>${PAGE_SCRIPT}</script>`,
    );
  } catch (error: any) {
    console.error("agent-portal proxy error:", error);
    return message("The portal is temporarily unavailable. Please try again shortly.");
  }
};
