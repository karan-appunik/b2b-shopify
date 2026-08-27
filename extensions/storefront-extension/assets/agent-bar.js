(function () {
  var root = document.getElementById("sparklayer-cart-drawer-root");
  if (!root) return;

  var hasCustomer = root.dataset.hasCustomer === "true";
  var loggedInCustomerId = root.dataset.customerId;
  var agentContextUrl = root.dataset.agentContextProxyUrl;
  var agentSearchUrl = root.dataset.agentSearchProxyUrl;

  if (!hasCustomer || !loggedInCustomerId || !agentContextUrl || !agentSearchUrl) return;

  // Scoped per logged-in customer so switching who's browsing on a shared
  // device never shows a stale "acting as" selection from someone else.
  var STORAGE_KEY = "sparklayer_acting_as_customer_" + loggedInCustomerId;

  function getActingAs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setActingAs(customer) {
    try {
      if (customer) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(customer));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {
      // Storage unavailable (private mode, etc.) — bar still works for this
      // page load, it just won't persist across navigation.
    }
    document.dispatchEvent(
      new CustomEvent("sparklayer:agent:actingAsChanged", { detail: { customer: customer || null } })
    );
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  function render(bar) {
    var actingAs = getActingAs();

    if (actingAs) {
      bar.innerHTML =
        '<span class="sl-agent-bar-label">Sales Agent</span>' +
        '<span class="sl-agent-bar-acting">' +
        'Acting as: <strong class="sl-agent-bar-acting-name">' + escapeHtml(actingAs.name) +
        (actingAs.company ? " (" + escapeHtml(actingAs.company) + ")" : "") +
        "</strong>" +
        "</span>" +
        '<button type="button" class="sl-agent-bar-change" data-sl-agent-change>Change customer</button>';

      var changeBtn = bar.querySelector("[data-sl-agent-change]");
      changeBtn.addEventListener("click", function () {
        setActingAs(null);
        render(bar);
      });
      return;
    }

    bar.innerHTML =
      '<span class="sl-agent-bar-label">Sales Agent</span>' +
      '<div class="sl-agent-bar-search-wrap">' +
      '<input type="text" class="sl-agent-bar-search-input" placeholder="Search for a customer to place an order for…" data-sl-agent-search-input autocomplete="off">' +
      '<div class="sl-agent-bar-results" data-sl-agent-results hidden></div>' +
      "</div>";

    var input = bar.querySelector("[data-sl-agent-search-input]");
    var results = bar.querySelector("[data-sl-agent-results]");
    var debounceTimer = null;
    var currentRequestId = 0;

    function hideResults() {
      results.hidden = true;
      results.innerHTML = "";
    }

    function showResults(customers) {
      if (customers.length === 0) {
        results.innerHTML = '<div class="sl-agent-bar-empty">No matching customers</div>';
      } else {
        results.innerHTML = customers
          .map(function (c) {
            return (
              '<button type="button" class="sl-agent-bar-result" data-id="' + escapeHtml(c.id) + '">' +
              '<span class="sl-agent-bar-result-name">' + escapeHtml(c.name) + "</span>" +
              '<span class="sl-agent-bar-result-meta">' +
              escapeHtml(c.email) +
              (c.company ? " · " + escapeHtml(c.company) : "") +
              "</span>" +
              "</button>"
            );
          })
          .join("");

        results.querySelectorAll(".sl-agent-bar-result").forEach(function (btn) {
          btn.addEventListener("click", function () {
            var id = btn.dataset.id;
            var match = customers.find(function (c) {
              return c.id === id;
            });
            if (!match) return;
            setActingAs(match);
            render(bar);
          });
        });
      }
      results.hidden = false;
    }

    input.addEventListener("input", function () {
      var q = input.value.trim();
      clearTimeout(debounceTimer);

      if (!q) {
        hideResults();
        return;
      }

      debounceTimer = setTimeout(function () {
        var requestId = ++currentRequestId;
        fetch(agentSearchUrl + "?q=" + encodeURIComponent(q))
          .then(function (res) {
            return res.json();
          })
          .then(function (data) {
            if (requestId !== currentRequestId) return;
            showResults(data.customers || []);
          })
          .catch(function () {
            if (requestId !== currentRequestId) return;
            hideResults();
          });
      }, 300);
    });

    document.addEventListener("click", function (event) {
      if (!bar.contains(event.target)) hideResults();
    });
  }

  fetch(agentContextUrl)
    .then(function (res) {
      return res.json();
    })
    .then(function (context) {
      if (!context || !context.isAgent) return;

      var bar = document.createElement("div");
      bar.className = "sl-agent-bar";
      bar.setAttribute("data-sl-agent-bar", "");
      document.body.insertBefore(bar, document.body.firstChild);
      render(bar);
    })
    .catch(function () {
      // Agent bar is a progressive enhancement — silently skip on failure
      // rather than surfacing an error banner to a normal shopper.
    });
})();
