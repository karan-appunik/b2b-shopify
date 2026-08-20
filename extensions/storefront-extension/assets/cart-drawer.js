(function () {
  var root = document.getElementById("sparklayer-cart-drawer-root");
  if (!root) return;

  var i18n = {
    title: root.dataset.i18nTitle,
    myAccount: root.dataset.i18nMyAccount,
    minimise: root.dataset.i18nMinimise,
    actions: root.dataset.i18nActions,
    clearCart: root.dataset.i18nClearCart,
    searchPlaceholder: root.dataset.i18nSearchPlaceholder,
    empty: root.dataset.i18nEmpty,
    subtotal: root.dataset.i18nSubtotal,
    line: root.dataset.i18nLine,
    lines: root.dataset.i18nLines,
    item: root.dataset.i18nItem,
    items: root.dataset.i18nItems,
    checkout: root.dataset.i18nCheckout,
    perUnit: root.dataset.i18nPerUnit,
    msrp: root.dataset.i18nMsrp,
    close: root.dataset.i18nClose,
    remove: root.dataset.i18nRemove,
  };
  var proxyUrl = root.dataset.proxyUrl;
  var moneyFormat = root.dataset.moneyFormat || "${{amount}}";

  function formatMoney(cents) {
    var value = (cents / 100).toFixed(2);
    var parts = value.split(".");
    var withComma = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + parts[1];
    return moneyFormat
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, parts[0])
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, withComma)
      .replace(/\{\{\s*amount\s*\}\}/, value);
  }

  function escapeHtml(str) {
    var div = document.createElement("div");
    div.textContent = str == null ? "" : String(str);
    return div.innerHTML;
  }

  var ICON_BAG =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">' +
      '<path d="M5.5 7.5h9l.6 9.2a1 1 0 0 1-1 1.1H5.9a1 1 0 0 1-1-1.1l.6-9.2Z" stroke-linejoin="round"/>' +
      '<path d="M7.25 7.5V6a2.75 2.75 0 0 1 5.5 0v1.5" stroke-linecap="round"/>' +
    "</svg>";
  var ICON_USER =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">' +
      '<circle cx="10" cy="6.5" r="3.25"/>' +
      '<path d="M3.5 17c.9-3.4 3.7-5.25 6.5-5.25S15.6 13.6 16.5 17" stroke-linecap="round"/>' +
    "</svg>";
  var ICON_MINIMISE =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">' +
      '<path d="M8 4v3a1 1 0 0 1-1 1H4M12 16v-3a1 1 0 0 1 1-1h3M8 16v-3a1 1 0 0 0-1-1H4M12 4v3a1 1 0 0 0 1 1h3" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  var ICON_CHEVRON =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="12" height="12">' +
      '<path d="M5 7.5l5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  root.innerHTML =
    '<div class="sl-cart-overlay" data-sl-close></div>' +
    '<aside class="sl-cart-drawer" role="dialog" aria-label="' + escapeHtml(i18n.title) + '">' +
      '<div class="sl-cart-tabs">' +
        '<span class="sl-cart-tab is-active">' + ICON_BAG + "<span>" + escapeHtml(i18n.title) + "</span></span>" +
        '<a href="/account" class="sl-cart-tab">' + ICON_USER + "<span>" + escapeHtml(i18n.myAccount) + "</span></a>" +
        '<button type="button" class="sl-cart-tabs-close" data-sl-close aria-label="' + escapeHtml(i18n.close) + '">&times;</button>' +
      "</div>" +
      '<div class="sl-cart-titlebar">' +
        "<h2>" + escapeHtml(i18n.title) + "</h2>" +
        '<button type="button" class="sl-cart-minimise" data-sl-close>' + ICON_MINIMISE + "<span>" + escapeHtml(i18n.minimise) + "</span></button>" +
      "</div>" +
      '<div class="sl-cart-search">' +
        '<div class="sl-cart-search-bar">' +
          '<input type="text" class="sl-cart-search-input" placeholder="' + escapeHtml(i18n.searchPlaceholder) + '" autocomplete="off">' +
          '<div class="sl-cart-actions">' +
            '<button type="button" class="sl-cart-actions-toggle" data-sl-actions-toggle>' + escapeHtml(i18n.actions) + ICON_CHEVRON + "</button>" +
            '<div class="sl-cart-actions-menu">' +
              '<button type="button" data-sl-clear-cart>' + escapeHtml(i18n.clearCart) + "</button>" +
            "</div>" +
          "</div>" +
        "</div>" +
        '<div class="sl-cart-search-results"></div>' +
      "</div>" +
      '<div class="sl-cart-lines"></div>' +
      '<div class="sl-cart-footer">' +
        '<div class="sl-cart-subtotal">' +
          "<span>" + escapeHtml(i18n.subtotal) + ' <span class="sl-cart-subtotal-count"></span></span>' +
          '<span class="sl-cart-subtotal-amount"></span>' +
        "</div>" +
        '<a href="/checkout" class="sl-cart-checkout">' + escapeHtml(i18n.checkout) + "</a>" +
      "</div>" +
    "</aside>";

  var linesEl = root.querySelector(".sl-cart-lines");
  var subtotalEl = root.querySelector(".sl-cart-subtotal-amount");
  var subtotalCountEl = root.querySelector(".sl-cart-subtotal-count");
  var searchInput = root.querySelector(".sl-cart-search-input");
  var searchResultsEl = root.querySelector(".sl-cart-search-results");
  var actionsToggle = root.querySelector("[data-sl-actions-toggle]");
  var actionsMenu = root.querySelector(".sl-cart-actions-menu");
  var clearCartBtn = root.querySelector("[data-sl-clear-cart]");

  function openDrawer() {
    root.classList.add("is-open");
    document.body.style.overflow = "hidden";
    refreshCart();
  }

  function closeDrawer() {
    root.classList.remove("is-open");
    document.body.style.overflow = "";
  }

  var nativeCartDrawer = document.getElementById("cart-drawer");
  var pageWrapper = document.querySelector(".page-wrapper");

  if (nativeCartDrawer && pageWrapper) {
    new MutationObserver(function () {
      pageWrapper.classList.remove("page-wrapper--drawer-open");
      if (!root.classList.contains("is-open")) openDrawer();
    }).observe(nativeCartDrawer, { attributes: true, attributeFilter: ["class", "open"] });
  }

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-sl-close]")) {
      closeDrawer();
    }
  });

  var CART_TRIGGER_SELECTOR = [
    '[data-testid="cart-drawer-trigger"]',
    '[aria-controls="cart-drawer"]',
    'a[href$="/cart"]',
    'a[href*="/cart#"]',
    'a[href*="/cart?"]',
    "[data-cart-drawer-toggle]",
    "#cart-icon-bubble",
    'a[class*="cart-icon" i]',
    'button[class*="cart-icon" i]',
    'a[id*="cart-icon" i]',
    'button[id*="cart-icon" i]',
    'a[class*="cart-link" i]',
    'a[class*="cart-toggle" i]',
    'button[class*="cart-toggle" i]',
    'a[aria-label*="cart" i]',
    'button[aria-label*="cart" i]',
    'summary[aria-label*="cart" i]',
    "cart-icon",
  ].join(", ");

  window.addEventListener(
    "click",
    function (event) {
      var trigger = event.target.closest(CART_TRIGGER_SELECTOR);
      if (!trigger) return;
      if (root.contains(trigger)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      openDrawer();
    },
    true
  );

  function renderLine(line) {
    var showMsrp = line.original_price > line.price;
    var meta = [line.variant_title, line.sku ? "SKU: " + line.sku : null]
      .filter(Boolean)
      .join(" | ");

    return (
      '<div class="sl-cart-line" data-line-key="' + escapeHtml(line.key) + '">' +
        '<img src="' + escapeHtml(line.image || "") + '" alt="' + escapeHtml(line.product_title) + '" loading="lazy">' +
        '<div class="sl-cart-line-main">' +
          '<p class="sl-cart-line-title">' + escapeHtml(line.product_title) + "</p>" +
          (meta ? '<p class="sl-cart-line-meta">' + escapeHtml(meta) + "</p>" : "") +
          '<div class="sl-cart-qty">' +
            '<button type="button" data-sl-qty="-1">&minus;</button>' +
            '<input type="text" value="' + line.quantity + '" readonly>' +
            '<button type="button" data-sl-qty="1">+</button>' +
          "</div>" +
          '<div class="sl-cart-line-actions">' +
            '<button type="button" class="sl-cart-remove" data-sl-remove aria-label="' + escapeHtml(i18n.remove) + '">&#128465;</button>' +
          "</div>" +
        "</div>" +
        '<div class="sl-cart-line-price">' +
          '<span class="sl-price">' + formatMoney(line.final_line_price) + "</span>" +
          '<span class="sl-per-unit">' + formatMoney(line.price) + " " + escapeHtml(i18n.perUnit) + "</span>" +
          (showMsrp ? '<span class="sl-msrp">' + escapeHtml(i18n.msrp) + ": " + formatMoney(line.original_price) + "</span>" : "") +
        "</div>" +
      "</div>"
    );
  }

  function renderCart(cart) {
    if (!cart.items.length) {
      linesEl.innerHTML = '<div class="sl-cart-empty">' + escapeHtml(i18n.empty) + "</div>";
    } else {
      linesEl.innerHTML = cart.items.map(renderLine).join("");
    }
    subtotalEl.textContent = formatMoney(cart.total_price);
    var lineWord = cart.items.length === 1 ? i18n.line : i18n.lines;
    var itemWord = cart.item_count === 1 ? i18n.item : i18n.items;
    subtotalCountEl.textContent = "(" + cart.items.length + " " + lineWord + ", " + cart.item_count + " " + itemWord + ")";
  }

  function refreshCart() {
    fetch("/cart.js")
      .then(function (res) { return res.json(); })
      .then(renderCart);
  }

  function changeLineQuantity(key, quantity) {
    fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, quantity: quantity }),
    })
      .then(function (res) { return res.json(); })
      .then(renderCart);
  }

  linesEl.addEventListener("click", function (event) {
    var lineEl = event.target.closest(".sl-cart-line");
    if (!lineEl) return;
    var key = lineEl.dataset.lineKey;

    var qtyBtn = event.target.closest("[data-sl-qty]");
    if (qtyBtn) {
      var input = lineEl.querySelector(".sl-cart-qty input");
      var next = parseInt(input.value, 10) + parseInt(qtyBtn.dataset.slQty, 10);
      changeLineQuantity(key, Math.max(0, next));
      return;
    }

    if (event.target.closest("[data-sl-remove]")) {
      changeLineQuantity(key, 0);
    }
  });

  var searchDebounce;
  searchInput.addEventListener("input", function () {
    var query = searchInput.value.trim();
    clearTimeout(searchDebounce);
    if (!query) {
      searchResultsEl.classList.remove("is-visible");
      return;
    }
    searchDebounce = setTimeout(function () {
      fetch(proxyUrl + "?q=" + encodeURIComponent(query))
        .then(function (res) { return res.json(); })
        .then(function (data) { renderSearchResults(data.variants || []); })
        .catch(function () { renderSearchResults([]); });
    }, 300);
  });

  function renderSearchResults(variants) {
    if (!variants.length) {
      searchResultsEl.innerHTML = '<div class="sl-cart-search-empty">' + escapeHtml(i18n.empty) + "</div>";
    } else {
      searchResultsEl.innerHTML = variants
        .map(function (v) {
          return (
            '<div class="sl-cart-search-result" data-variant-id="' + escapeHtml(v.id) + '">' +
              '<img src="' + escapeHtml(v.image || "") + '" alt="">' +
              "<span>" + escapeHtml(v.productTitle) + " — " + escapeHtml(v.sku || "") + "</span>" +
            "</div>"
          );
        })
        .join("");
    }
    searchResultsEl.classList.add("is-visible");
  }

  searchResultsEl.addEventListener("click", function (event) {
    var resultEl = event.target.closest("[data-variant-id]");
    if (!resultEl) return;
    var variantId = resultEl.dataset.variantId;
    fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: variantId, quantity: 1 }),
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        searchInput.value = "";
        searchResultsEl.classList.remove("is-visible");
        refreshCart();
      });
  });

  actionsToggle.addEventListener("click", function () {
    actionsMenu.classList.toggle("is-open");
  });

  clearCartBtn.addEventListener("click", function () {
    actionsMenu.classList.remove("is-open");
    fetch("/cart/clear.js", { method: "POST" })
      .then(function (res) { return res.json(); })
      .then(renderCart);
  });

  document.addEventListener("click", function (event) {
    if (!searchResultsEl.contains(event.target) && event.target !== searchInput) {
      searchResultsEl.classList.remove("is-visible");
    }
    if (!actionsMenu.contains(event.target) && event.target !== actionsToggle && !actionsToggle.contains(event.target)) {
      actionsMenu.classList.remove("is-open");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeDrawer();
  });
})();
