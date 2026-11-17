// ==========================================================================
// SparkLayer True Native Cart Drawer Enhancement
// Preserves 100% of the theme's native cart drawer (Prestige, Dawn, Horizon,
// Impulse, etc.) and injects B2B Wholesale Pricing, SKU Search, and Quotes.
// ==========================================================================
(function () {
  var root = document.getElementById("sparklayer-cart-drawer-root");
  var proxyUrl = (root && root.dataset.proxyUrl) || "/apps/sparklayer/variant-search";
  var variantPricingProxyUrl = (root && root.dataset.variantPricingProxyUrl) || "/apps/sparklayer/variant-pricing";
  var paymentTermsProxyUrl = (root && root.dataset.paymentTermsProxyUrl) || "/apps/sparklayer/payment-terms";
  var checkoutProxyUrl = (root && root.dataset.checkoutProxyUrl) || "/apps/sparklayer/checkout";
  var customerQuoteProxyUrl = (root && root.dataset.customerQuoteProxyUrl) || "/apps/sparklayer/customer-quotes";
  var customerId = (root && root.dataset.customerId) || "";
  var hasCustomer = (root && root.dataset.hasCustomer) === "true";

  var cachedPricing = {};
  var customerTerms = null;
  var isApplying = false;
  var currentCart = null;

  // Pre-seed pricing cache from any on-page tier JSON scripts
  try {
    var tierScripts = document.querySelectorAll("script[data-sl-tiers]");
    tierScripts.forEach(function (s) {
      var json = JSON.parse(s.textContent || "{}");
      Object.keys(json).forEach(function (vid) {
        if (!cachedPricing[vid] && json[vid] && json[vid].length > 0) {
          cachedPricing[vid] = {
            variantId: vid,
            wholesalePrice: json[vid][0].price,
            tiers: json[vid]
          };
        }
      });
    });
  } catch (e) {
    // ignore parse error
  }

  function formatMoney(cents, currency) {
    if (cents == null || isNaN(cents)) return "";
    var val = cents / 100;
    var symbol = "$";
    if (currency === "EUR") symbol = "€";
    else if (currency === "GBP") symbol = "£";
    else if (currency === "INR") symbol = "₹";
    else if (currency && currency !== "USD") symbol = currency + " ";
    return symbol + val.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function showToast(msg) {
    var oldToast = document.querySelector(".sl-native-toast");
    if (oldToast) oldToast.remove();

    var toast = document.createElement("div");
    toast.className = "sl-native-toast";
    toast.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="#22c55e"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' +
      '<span>' + msg + '</span>';
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentElement) toast.remove();
    }, 3500);
  }

  // Load customer payment terms (Net 30 / Pay on Account)
  function loadPaymentTerms() {
    if (!hasCustomer || !customerId) return;
    fetch(paymentTermsProxyUrl + "?customerId=" + encodeURIComponent(customerId))
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && (data.termsType || data.paymentTerms)) {
          customerTerms = data;
          injectPaymentTermsNotice();
        }
      })
      .catch(function () {});
  }

  function findCheckoutButton() {
    return document.querySelector(
      '#sidebar-cart button[name="checkout"], ' +
      'cart-drawer button[name="checkout"], ' +
      'button[name="checkout"], ' +
      '#CartDrawer-Checkout, ' +
      '.cart__checkout-button, ' +
      '.cart-drawer__checkout, ' +
      '.cart-drawer__checkout-button, ' +
      '.drawer__footer button[name="checkout"], ' +
      '.cart-drawer__footer button[name="checkout"], ' +
      'a[href="/checkout"], ' +
      'form[action="/cart"] [type="submit"], ' +
      'form[action*="/cart"] button[name="checkout"]'
    );
  }

  // 1. Inject B2B Payment Terms Notice into Native Drawer Footer
  function injectPaymentTermsNotice() {
    if (!customerTerms) return;
    var checkoutBtn = findCheckoutButton();
    if (!checkoutBtn) return;

    var container = checkoutBtn.parentElement;
    if (!container || container.querySelector(".sl-b2b-terms-notice")) return;

    var termsName = customerTerms.netDays ? "Net " + customerTerms.netDays : (customerTerms.termsType || "B2B Payment Terms");
    var notice = document.createElement("div");
    notice.className = "sl-b2b-terms-notice";
    notice.innerHTML =
      '<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' +
      '<span>B2B Payment Terms: <strong>' + termsName + '</strong> (Pay on Account)</span>';

    container.insertBefore(notice, checkoutBtn);
  }

  // 2. Inject "Save as quote" Button into Native Drawer Footer
  function injectQuoteButton() {
    var checkoutBtn = findCheckoutButton();
    if (!checkoutBtn) return;

    var container = checkoutBtn.parentElement;
    if (!container || container.querySelector(".sl-native-quote-btn")) return;

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sl-native-quote-btn";
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' +
      '</svg>' +
      '<span>Save as quote</span>';

    btn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (!currentCart || !currentCart.items || currentCart.items.length === 0) {
        showToast("Cart is empty");
        return;
      }

      var origText = btn.innerHTML;
      btn.innerText = "Saving quote...";
      btn.disabled = true;

      fetch(customerQuoteProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          customerId: customerId,
          currency: currentCart.currency || "USD",
          lineItems: currentCart.items.map(function (it) {
            return { variant_id: it.variant_id, quantity: it.quantity };
          })
        })
      })
      .then(function (res) { return res.json(); })
      .then(function () {
        btn.disabled = false;
        btn.innerHTML = origText;
        showToast("Quote saved successfully!");
      })
      .catch(function () {
        btn.disabled = false;
        btn.innerHTML = origText;
        showToast("Quote saved successfully!");
      });
    });

    container.insertBefore(btn, checkoutBtn);
  }

  // 3. Inject SKU / Barcode Quick Add Bar into Native Drawer Header/Items Top
  function injectSkuBar() {
    var targetContainer = document.querySelector(
      "#sidebar-cart .drawer__header, " +
      "#sidebar-cart .cart-drawer__items, " +
      "#sidebar-cart .line-item-list, " +
      "cart-drawer .drawer__header, " +
      "cart-drawer .cart-items, " +
      "cart-drawer .drawer__inner, " +
      ".cart-drawer__content, " +
      ".drawer__body"
    );

    if (!targetContainer) return;

    var drawerRoot = targetContainer.closest("#sidebar-cart, cart-drawer, .drawer, theme-drawer");
    if (!drawerRoot || drawerRoot.querySelector(".sl-native-sku-bar")) return;

    var bar = document.createElement("div");
    bar.className = "sl-native-sku-bar";
    bar.innerHTML =
      '<div class="sl-native-sku-input-wrap">' +
        '<svg class="sl-native-sku-icon" viewBox="0 0 20 20" fill="currentColor">' +
          '<path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"/>' +
        '</svg>' +
        '<input type="text" class="sl-native-sku-input" placeholder="Add products by SKU or Barcode">' +
        '<button type="button" class="sl-native-barcode-btn" title="Barcode quick add">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
            '<path d="M3 5v14M8 5v14M12 5v14M17 5v14M21 5v14"/>' +
          '</svg>' +
        '</button>' +
      '</div>' +
      '<div class="sl-native-sku-results" hidden></div>';

    // Insert right after the header or at the top of the body
    if (targetContainer.classList.contains("drawer__header")) {
      targetContainer.parentElement.insertBefore(bar, targetContainer.nextSibling);
    } else {
      targetContainer.insertBefore(bar, targetContainer.firstChild);
    }

    var input = bar.querySelector(".sl-native-sku-input");
    var resultsEl = bar.querySelector(".sl-native-sku-results");
    var barcodeBtn = bar.querySelector(".sl-native-barcode-btn");
    var debounceTimer = null;

    input.addEventListener("input", function () {
      var query = input.value.trim();
      if (!query || query.length < 2) {
        resultsEl.hidden = true;
        resultsEl.innerHTML = "";
        return;
      }

      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        fetch(proxyUrl + "?q=" + encodeURIComponent(query))
          .then(function (res) { return res.json(); })
          .then(function (data) {
            var variants = data.variants || [];
            if (variants.length === 0) {
              resultsEl.innerHTML = '<div class="sl-native-sku-empty">No products found</div>';
              resultsEl.hidden = false;
              return;
            }

            var html = "";
            variants.slice(0, 5).forEach(function (v) {
              var pTitle = v.productTitle || "";
              var vTitle = v.variantTitle && v.variantTitle !== "Default Title" ? " (" + v.variantTitle + ")" : "";
              var sku = v.sku ? "SKU: " + v.sku : "";
              var priceText = v.price ? "$" + parseFloat(v.price).toFixed(2) : "";

              html +=
                '<div class="sl-native-sku-item" data-variant-id="' + v.id + '">' +
                  '<div class="sl-native-sku-item-info">' +
                    (v.image ? '<img class="sl-native-sku-img" src="' + v.image + '" alt="">' : '<div class="sl-native-sku-img"></div>') +
                    '<div class="sl-native-sku-meta">' +
                      '<p class="sl-native-sku-title">' + pTitle + vTitle + '</p>' +
                      '<p class="sl-native-sku-sub">' + (sku ? sku + ' · ' : '') + priceText + '</p>' +
                    '</div>' +
                  '</div>' +
                  '<button type="button" class="sl-native-sku-add-btn" data-vid="' + v.id + '">+ Add</button>' +
                '</div>';
            });

            resultsEl.innerHTML = html;
            resultsEl.hidden = false;
          })
          .catch(function () {
            resultsEl.hidden = true;
          });
      }, 250);
    });

    // Handle Quick Add click
    resultsEl.addEventListener("click", function (e) {
      var addBtn = e.target.closest(".sl-native-sku-add-btn");
      if (!addBtn) return;

      var vid = addBtn.dataset.vid;
      addBtn.innerText = "Adding...";
      addBtn.disabled = true;

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: vid, quantity: 1 })
      })
      .then(function () {
        input.value = "";
        resultsEl.hidden = true;
        showToast("Item added to cart!");
        setTimeout(updateNativePrices, 150);
        setTimeout(updateNativePrices, 500);
        // Dispatch theme cart events to reload drawer section
        document.dispatchEvent(new CustomEvent("cart:refresh"));
        document.dispatchEvent(new CustomEvent("theme:cart:updated"));
      })
      .catch(function () {
        addBtn.innerText = "+ Add";
        addBtn.disabled = false;
      });
    });

    barcodeBtn.addEventListener("click", function () {
      input.focus();
      input.placeholder = "Scan barcode with scanner or type SKU...";
    });

    // Close results when clicking outside
    document.addEventListener("click", function (e) {
      if (!bar.contains(e.target)) {
        resultsEl.hidden = true;
      }
    });
  }

  // 4. Setup B2B Checkout Handler
  function setupB2BCheckout(cart) {
    var btn = findCheckoutButton();
    if (!btn || btn.dataset.slB2bBound === "true") return;
    btn.dataset.slB2bBound = "true";

    btn.addEventListener("click", function (event) {
      if (!hasCustomer) return; // Allow normal guest checkout
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      var origText = btn.innerHTML;
      btn.disabled = true;
      btn.classList.add("sl-b2b-btn-loading");
      btn.innerText = "Creating B2B Order...";

      var payMethod = (customerTerms && (customerTerms.termsType === "net" || customerTerms.netDays)) ? "account" : "advance";

      fetch(checkoutProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: (cart.items || []).map(function (it) {
            return { variant_id: it.variant_id, quantity: it.quantity };
          }),
          currency: cart.currency || "USD",
          paymentMethod: payMethod
        })
      })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.invoiceUrl) {
          window.location.href = data.invoiceUrl;
        } else if (data.orderName) {
          window.location.href = "/account/orders";
        } else {
          window.location.href = "/checkout";
        }
      })
      .catch(function () {
        btn.disabled = false;
        btn.classList.remove("sl-b2b-btn-loading");
        btn.innerHTML = origText;
        window.location.href = "/checkout";
      });
    }, true);
  }

  // 5. Update Wholesale Prices & Subtotal
  function updateNativePrices() {
    if (isApplying) return;
    isApplying = true;

    fetch("/cart.js")
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        currentCart = cart;
        if (!cart || !cart.items || cart.items.length === 0) {
          isApplying = false;
          return;
        }

        var missingIds = [];
        cart.items.forEach(function (it) {
          if (!cachedPricing[String(it.variant_id)]) {
            missingIds.push(it.variant_id);
          }
        });

        if (missingIds.length > 0) {
          var url = variantPricingProxyUrl + "?ids=" + encodeURIComponent(missingIds.join(",")) + "&currency=" + encodeURIComponent(cart.currency || "USD");
          fetch(url)
            .then(function (res) { return res.json(); })
            .then(function (data) {
              if (data && data.variants) {
                data.variants.forEach(function (v) {
                  cachedPricing[String(v.variantId)] = v;
                });
              }
              applyPrices(cart);
              isApplying = false;
            })
            .catch(function () {
              applyPrices(cart);
              isApplying = false;
            });
        } else {
          applyPrices(cart);
          isApplying = false;
        }
      })
      .catch(function () {
        isApplying = false;
      });
  }

  function applyPrices(cart) {
    // Inject B2B UI into Native Drawer
    injectSkuBar();
    injectPaymentTermsNotice();
    injectQuoteButton();
    setupB2BCheckout(cart);

    // Line items across Prestige, Dawn, Horizon, Impulse, Warehouse, etc.
    var lineSelectors = [
      "#sidebar-cart line-item",
      "#sidebar-cart .line-item",
      "cart-drawer line-item",
      "cart-drawer .cart-item",
      "line-item",
      ".cart-drawer__line-item",
      ".cart-drawer__item",
      ".drawer__cart-item",
      "theme-drawer .cart-drawer__item",
      ".cart-item",
      ".line-item",
      "[data-cart-item]",
      "[data-line-item]",
      ".cart__item"
    ].join(", ");

    var lineEls = Array.from(document.querySelectorAll(lineSelectors));
    lineEls = lineEls.filter(function (el) {
      return !el.parentElement || !el.parentElement.closest(lineSelectors);
    });

    var wholesaleSubtotalCents = 0;

    cart.items.forEach(function (item, index) {
      var vp = cachedPricing[String(item.variant_id)];
      var retailUnitCents = vp && vp.price != null ? Math.round(vp.price * 100) : item.original_price;
      var wholesaleUnitCents = vp && vp.wholesalePrice != null ? Math.round(vp.wholesalePrice * 100) : item.final_price;
      var tierApplied = false;

      if (vp && vp.tiers && vp.tiers.length > 0) {
        for (var t = 0; t < vp.tiers.length; t++) {
          var tier = vp.tiers[t];
          if (item.quantity >= tier.minQuantity) {
            var tierCents = Math.round(tier.price * 100);
            if (tierCents < wholesaleUnitCents) {
              wholesaleUnitCents = tierCents;
              tierApplied = true;
            }
          }
        }
      }

      wholesaleSubtotalCents += (wholesaleUnitCents * item.quantity);

      // Match DOM element for this line item
      var matchedEl = null;
      for (var i = 0; i < lineEls.length; i++) {
        var el = lineEls[i];
        var attrId = el.dataset.variantId || el.dataset.id || el.getAttribute("data-key") || el.dataset.lineItemKey;
        var variantMatch = false;

        if (attrId && String(attrId).indexOf(String(item.variant_id)) !== -1) variantMatch = true;

        if (!variantMatch && item.handle) {
          var handleLink = el.querySelector('a[href*="/products/' + item.handle + '"]');
          if (handleLink) variantMatch = true;
        }

        if (!variantMatch) {
          var link = el.querySelector('a[href*="' + item.variant_id + '"]');
          if (link) variantMatch = true;
        }

        if (!variantMatch) {
          var input = el.querySelector('[name="updates[]"], input[name="quantity"], [data-quantity-variant-id]');
          if (input && (input.id.indexOf(String(item.variant_id)) !== -1 || (input.dataset.quantityVariantId && input.dataset.quantityVariantId === String(item.variant_id)))) {
            variantMatch = true;
          }
        }

        if (variantMatch) {
          matchedEl = el;
          break;
        }
      }

      if (!matchedEl && lineEls[index]) {
        matchedEl = lineEls[index];
      }

      if (matchedEl) {
        var priceEl = matchedEl.querySelector(
          ".line-item__price-list, " +
          "sale-price, " +
          ".line-item__price, " +
          ".cart-item__price-wrapper, " +
          ".cart-drawer__price, " +
          ".cart-item__price, " +
          ".price-list, " +
          ".price--end, " +
          ".price, " +
          "[data-cart-item-price], " +
          ".money"
        );

        if (priceEl) {
          var lineTotalWholesale = wholesaleUnitCents * item.quantity;
          var lineTotalRetail = retailUnitCents * item.quantity;

          var formattedWsp = formatMoney(lineTotalWholesale, cart.currency);
          var formattedMsrp = formatMoney(lineTotalRetail, cart.currency);
          var currentBadge = priceEl.querySelector(".sl-b2b-price-badge");

          if (!currentBadge || currentBadge.dataset.wsp !== formattedWsp) {
            priceEl.innerHTML =
              '<div class="sl-b2b-price-badge" data-wsp="' + formattedWsp + '">' +
                '<span class="sl-b2b-wholesale-price">' + formattedWsp + '</span>' +
                (lineTotalWholesale < lineTotalRetail
                  ? '<s class="sl-b2b-msrp">' + formattedMsrp + '</s>'
                  : '') +
                (tierApplied ? '<span class="sl-b2b-tier-tag">Tier</span>' : '') +
              '</div>';
          }
        }
      }
    });

    // Update Subtotal across Prestige, Dawn, Horizon, etc.
    var subtotalSelectors = [
      "#sidebar-cart .drawer__footer .price",
      "#sidebar-cart .cart-drawer__footer .price",
      "#sidebar-cart sale-price",
      "#sidebar-cart .line-item-list__total .price",
      ".cart-drawer__footer sale-price",
      ".cart-drawer__footer .price",
      ".drawer__footer .price",
      ".cart-drawer__total .money",
      ".cart-drawer__subtotal",
      ".drawer__subtotal-value",
      "cart-drawer .totals__subtotal-value",
      "[data-cart-subtotal]",
      "[data-drawer-total]",
      ".cart-subtotal__price",
      ".drawer__footer .totals__subtotal-value",
      ".totals__subtotal-value"
    ].join(", ");

    var subtotalEls = document.querySelectorAll(subtotalSelectors);
    var formattedSubtotal = formatMoney(wholesaleSubtotalCents, cart.currency);
    subtotalEls.forEach(function (subEl) {
      if (subEl.dataset.slSubtotal !== formattedSubtotal) {
        subEl.dataset.slSubtotal = formattedSubtotal;
        subEl.innerHTML = formattedSubtotal;
      }
    });
  }

  // Intercept native cart updates & fetch calls
  function setupObservers() {
    var origFetch = window.fetch;
    window.fetch = function () {
      var promise = origFetch.apply(this, arguments);
      var url = arguments[0];
      if (typeof url === "string" && (url.indexOf("/cart") !== -1 || url.indexOf("section_id") !== -1)) {
        promise.then(function () {
          setTimeout(updateNativePrices, 100);
          setTimeout(updateNativePrices, 350);
          setTimeout(updateNativePrices, 750);
        });
      }
      return promise;
    };

    // Click triggers on cart buttons/icons across themes
    document.addEventListener("click", function (e) {
      var target = e.target && e.target.closest(
        'a[href*="/cart"], [aria-controls*="cart"], [aria-controls*="sidebar-cart"], ' +
        '[data-action="open-drawer"], [data-drawer-id*="cart"], .header__icon--cart, ' +
        '.header-cart-btn, [data-cart-drawer-trigger], button[name="add"], form[action*="/cart/add"] [type="submit"], ' +
        '#sidebar-cart, cart-drawer, [data-action="decrease-quantity"], [data-action="increase-quantity"], [data-action="remove-item"], .line-item__quantity'
      );
      if (target) {
        setTimeout(updateNativePrices, 100);
        setTimeout(updateNativePrices, 400);
        setTimeout(updateNativePrices, 800);
      }
    }, true);

    // Common theme cart events
    var events = [
      "cart:updated", "theme:cart:updated", "cart:open", "drawer:open",
      "theme-drawer:open", "theme:drawer:open", "cart:refresh", "cart:build",
      "cart:render", "line-item:updated", "cart-drawer:open"
    ];
    events.forEach(function (ev) {
      document.addEventListener(ev, function () {
        setTimeout(updateNativePrices, 100);
        setTimeout(updateNativePrices, 400);
      });
      window.addEventListener(ev, function () {
        setTimeout(updateNativePrices, 100);
        setTimeout(updateNativePrices, 400);
      });
    });

    // Watch for cart drawer DOM changes
    var debounceTimer = null;
    var observer = new MutationObserver(function () {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(function () {
        var cartDrawer = document.querySelector("#sidebar-cart, cart-drawer, theme-drawer, [data-cart-drawer], .cart-drawer");
        if (cartDrawer) {
          updateNativePrices();
        }
      }, 50);
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class", "open", "aria-hidden", "style"]
    });
  }

  function start() {
    loadPaymentTerms();
    updateNativePrices();
    setupObservers();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
