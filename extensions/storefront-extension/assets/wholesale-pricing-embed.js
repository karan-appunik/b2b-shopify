(function () {
  // <product-card> (Horizon-type, carries data-product-id), Dawn-family
  // .product-card-wrapper and Broadcast's <grid-item class="product-item">
  // (the last two have no product id on the element; resolved by handle).
  // Warehouse's card is <div class="product-item product-item--vertical">.
  var CARD_SELECTOR = "product-card, .product-card-wrapper, grid-item.product-item, div.product-item, .grid-product";
  var STOREFRONT_API_VERSION = "2026-10";

  var configEl = document.getElementById("sparklayer-wholesale-pricing-embed");

  if (!configEl) return;

  var isB2B = configEl.dataset.isB2b === "true";
  var storefrontToken = configEl.dataset.storefrontToken || "";
  var shopDomain = configEl.dataset.shopDomain || "";
  var moneyFormat = configEl.dataset.moneyFormat || "${{amount}}";
  var addToCartText = configEl.dataset.i18nAddToCart || "Add to cart";
  var addWithPriceTemplate = configEl.dataset.i18nAddWithPrice || "Add ({{price}})";
  var soldOutText = configEl.dataset.i18nSoldOut || "Sold out";

  // Only inject for confirmed B2B customers, and only if the storefront
  // token has actually been provisioned (see storefrontToken.server.ts).
  if (!isB2B || !storefrontToken || !shopDomain) return;

  function formatMoney(amount, format) {
    var f = format || "${{amount}}";
    var value = Number(amount).toFixed(2);
    var parts = value.split(".");
    var withComma = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + parts[1];
    return f
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, parts[0])
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, withComma)
      .replace(/\{\{\s*amount\s*\}\}/, value);
  }

  function pickTierPrice(tiers, quantity) {
    var applicable = null;
    for (var i = 0; i < (tiers || []).length; i++) {
      if (tiers[i].minQuantity <= quantity) {
        applicable = tiers[i];
      } else {
        break;
      }
    }
    return applicable ? applicable.price : null;
  }

  function extractProductId(card) {
    var id = card.dataset.productId;
    return id ? "gid://shopify/Product/" + id : null;
  }

  // Dawn-family cards have no product id on the element, only the link.
  function extractHandle(card) {
    var link = card.querySelector('a[href*="/products/"]');
    if (!link) return null;
    var match = (link.getAttribute("href") || "").match(/\/products\/([^/?#]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  var PRODUCT_FIELDS =
    "    options { name values }" +
    "    variants(first: 100) {" +
    "      nodes {" +
    "        id" +
    "        availableForSale" +
    "        selectedOptions { name value }" +
    "        price { amount }" +
    "        compareAtPrice { amount }" +
    "        wsp: metafield(namespace: \"sparklayer\", key: \"wholesale_price\") { value }" +
    "        tiers: metafield(namespace: \"sparklayer\", key: \"wholesale_price_tiers\") { value }" +
    "      }" +
    "    }";

  var PRODUCT_QUERY = "query ProductById($id: ID!) { product(id: $id) {" + PRODUCT_FIELDS + "} }";
  var PRODUCT_BY_HANDLE_QUERY = "query ProductByHandle($handle: String!) { product: productByHandle(handle: $handle) {" + PRODUCT_FIELDS + "} }";

  function fetchProduct(productId) {
    return fetchProductWith(PRODUCT_QUERY, { id: productId });
  }

  function fetchProductByHandle(handle) {
    return fetchProductWith(PRODUCT_BY_HANDLE_QUERY, { handle: handle });
  }

  function fetchProductWith(query, variables) {
    return fetch("https://" + shopDomain + "/api/" + STOREFRONT_API_VERSION + "/graphql.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({ query: query, variables: variables }),
    })
      .then(function (res) {
        return res.json();
      })
      .then(function (json) {
        var product = json.data && json.data.product;
        if (!product) return null;

        var variants = product.variants.nodes.map(function (v) {
          var wspRaw = v.wsp && v.wsp.value ? Number(v.wsp.value) : null;
          var nativePrice = Math.round(Number(v.price.amount) * 100);
          var compareAt = v.compareAtPrice ? Math.round(Number(v.compareAtPrice.amount) * 100) : null;
          
          var tiersParsed = [];
          if (v.tiers && v.tiers.value) {
            try {
              tiersParsed = JSON.parse(v.tiers.value) || [];
            } catch (e) {
              tiersParsed = [];
            }
          }
          
          if (tiersParsed.length === 0 && wspRaw !== null) {
            tiersParsed = [{ minQuantity: 1, price: wspRaw }];
          }

          return {
            id: v.id.split("/").pop(),
            options: v.selectedOptions.map(function (o) {
              return o.value;
            }),
            available: v.availableForSale,
            wsp: wspRaw !== null,
            price: wspRaw !== null ? Math.round(wspRaw * 100) : nativePrice,
            nativePrice: nativePrice,
            compareAtPrice: compareAt,
            tiers: tiersParsed,
          };
        });

        return { options: product.options, variants: variants };
      })
      .catch(function () {
        return null;
      });
  }


  // Copies the storefront theme's own look onto a widget: primary button
  // colours, page background and text colour. Theme-agnostic: samples computed
  // styles instead of knowing each theme's CSS variables. (Same helper lives
  // in wholesale-pricing-embed.js and wholesale-pricing.js.)
  var themeLook;
  function isClearColor(color) {
    return !color || color === "transparent" || /rgba\(.*,\s*0\s*\)$/.test(color) || /\/\s*0\s*\)$/.test(color);
  }
  // A sampled button must stand out from the page, or the widget button vanishes
  // (e.g. a white secondary .btn on a white page).
  function isVisibleOnPage(color) {
    var m = color.match(/[0-9.]+/g);
    if (!m || m.length < 3) return true;
    var lum = (0.299 * m[0] + 0.587 * m[1] + 0.114 * m[2]) / 255;
    var page = getComputedStyle(document.body).backgroundColor;
    var p = isClearColor(page) ? [255, 255, 255] : page.match(/[0-9.]+/g);
    var pl = (0.299 * p[0] + 0.587 * p[1] + 0.114 * p[2]) / 255;
    // never a near-white button on a light page, and always clearly different from it
    return Math.abs(lum - pl) > 0.25 && !(pl > 0.5 && lum > 0.75);
  }
  function sampleThemeButton() {
    var selectors = ["button.button--primary", ".button--primary", ".btn--primary", ".btn", ".button", 'button[type="submit"]'];
    for (var s = 0; s < selectors.length; s++) {
      var nodes = document.querySelectorAll(selectors[s]);
      for (var i = 0; i < nodes.length; i++) {
        var node = nodes[i];
        if (node.closest(".sparklayer-wholesale-pricing, #sparklayer-cart-drawer-root") || !node.getClientRects().length) continue;
        var cs = getComputedStyle(node);
        var bg = cs.backgroundColor;
        if (isClearColor(bg)) {
          // Some themes paint the button with a gradient, not a background colour.
          var gradient = (cs.backgroundImage || "").match(/rgba?\([^)]*\)/);
          bg = gradient ? gradient[0] : null;
        }
        if (bg && !isClearColor(bg) && isVisibleOnPage(bg)) return { bg: bg, text: cs.color };
      }
    }
    return null;
  }
  function applyThemeLook(root) {
    if (!themeLook) {
      var body = getComputedStyle(document.body);
      themeLook = {
        button: sampleThemeButton(),
        fieldBg: isClearColor(body.backgroundColor) ? null : body.backgroundColor,
        text: body.color
      };
    }
    if (themeLook.button) {
      root.style.setProperty("--sl-wsp-btn-bg", themeLook.button.bg);
      root.style.setProperty("--sl-wsp-btn-text", themeLook.button.text);
    }
    if (!themeLook.button && themeLook.text) {
      // no usable theme button: page text colour on page background always contrasts
      root.style.setProperty("--sl-wsp-btn-bg", themeLook.text);
      root.style.setProperty("--sl-wsp-btn-text", themeLook.fieldBg || "#fff");
    }
    if (themeLook.fieldBg) root.style.setProperty("--sl-wsp-field-bg", themeLook.fieldBg);
    if (themeLook.text) root.style.setProperty("--sl-wsp-text", themeLook.text);
  }

  function buildCardWidget(product) {
    var root = document.createElement("div");
    root.className = "sparklayer-wholesale-pricing sl-wsp-card sl-wsp-embed";
    applyThemeLook(root);

    var priceEl = document.createElement("div");
    priceEl.className = "sl-wsp-price sl-wsp-card-price";
    var pricePrimary = document.createElement("span");
    pricePrimary.className = "sl-wsp-price-wsp";
    var priceSecondary = document.createElement("span");
    priceSecondary.className = "sl-wsp-price-msrp";
    priceEl.appendChild(pricePrimary);
    priceEl.appendChild(priceSecondary);
    root.appendChild(priceEl);

    var selects = [];
    product.options.forEach(function (option, index) {
      var wrap = document.createElement("div");
      wrap.className = "sl-wsp-option";

      var label = document.createElement("label");
      label.className = "sl-wsp-option-label";
      label.textContent = option.name;
      wrap.appendChild(label);

      var select = document.createElement("select");
      select.className = "sl-wsp-option-select";
      select.dataset.optionIndex = String(index);
      option.values.forEach(function (value) {
        var opt = document.createElement("option");
        opt.value = value;
        opt.textContent = value;
        select.appendChild(opt);
      });
      // A closed <select> shows its value on one line and cuts long names off.
      // The visible text is this wrapping box; the real select sits transparent
      // on top of it, so a click still opens the native dropdown.
      var field = document.createElement("div");
      field.className = "sl-wsp-option-field";
      var display = document.createElement("div");
      display.className = "sl-wsp-option-display";
      display.setAttribute("aria-hidden", "true");
      function syncDisplay() {
        display.textContent = select.value;
      }
      select.addEventListener("change", syncDisplay);
      syncDisplay();
      field.appendChild(display);
      field.appendChild(select);
      wrap.appendChild(field);
      root.appendChild(wrap);
      selects.push(select);
    });

    var buyRow = document.createElement("div");
    buyRow.className = "sl-wsp-card-buy-row";

    var stepper = document.createElement("div");
    stepper.className = "sl-wsp-stepper";

    var minusBtn = document.createElement("button");
    minusBtn.type = "button";
    minusBtn.className = "sl-wsp-stepper-btn";
    minusBtn.textContent = "−";

    var qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "0";
    qtyInput.value = "1";
    qtyInput.className = "sl-wsp-qty-input";

    var plusBtn = document.createElement("button");
    plusBtn.type = "button";
    plusBtn.className = "sl-wsp-stepper-btn";
    plusBtn.textContent = "+";

    stepper.appendChild(minusBtn);
    stepper.appendChild(qtyInput);
    stepper.appendChild(plusBtn);
    buyRow.appendChild(stepper);

    var addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "sl-wsp-add-to-cart sl-wsp-card-add";
    var addLabel = document.createElement("span");
    addLabel.textContent = addToCartText;
    addButton.appendChild(addLabel);
    buyRow.appendChild(addButton);

    root.appendChild(buyRow);

    var liveRegion = document.createElement("div");
    liveRegion.className = "visually-hidden";
    liveRegion.setAttribute("role", "status");
    liveRegion.setAttribute("aria-live", "polite");
    root.appendChild(liveRegion);

    function findMatchingVariant() {
      if (selects.length === 0) return product.variants[0] || null;
      var selected = selects.map(function (s) {
        return s.value;
      });
      for (var i = 0; i < product.variants.length; i++) {
        var opts = product.variants[i].options;
        if (opts.length !== selected.length) continue;
        var match = true;
        for (var j = 0; j < opts.length; j++) {
          if (opts[j] !== selected[j]) {
            match = false;
            break;
          }
        }
        if (match) return product.variants[i];
      }
      return null;
    }

    function update() {
      var variant = findMatchingVariant();
      if (!variant) {
        addButton.disabled = true;
        addLabel.textContent = soldOutText;
        return;
      }
      qtyInput.dataset.variantId = variant.id;

      var qty = Number(qtyInput.value) || 0;
      var tierDollars = pickTierPrice(variant.tiers, Math.max(1, qty));
      var effectivePrice = tierDollars != null ? Math.round(tierDollars * 100) : variant.nativePrice;

      if (tierDollars != null) {
        pricePrimary.textContent = "WSP " + formatMoney(effectivePrice / 100, moneyFormat);
        priceSecondary.textContent = "MSRP: " + formatMoney(variant.nativePrice / 100, moneyFormat);
        priceSecondary.style.display = "";
      } else {
        pricePrimary.textContent = formatMoney(variant.nativePrice / 100, moneyFormat);
        if (variant.compareAtPrice && variant.compareAtPrice > variant.nativePrice) {
          priceSecondary.textContent = "MSRP: " + formatMoney(variant.compareAtPrice / 100, moneyFormat);
          priceSecondary.style.display = "";
        } else {
          priceSecondary.textContent = "";
          priceSecondary.style.display = "none";
        }
      }

      if (!variant.available) {
        addButton.disabled = true;
        addLabel.textContent = soldOutText;
      } else {
        addButton.disabled = false;
        addLabel.textContent = qty > 0
          ? addWithPriceTemplate.replace("{{price}}", formatMoney((effectivePrice * qty) / 100, moneyFormat))
          : addToCartText;
      }
    }

    selects.forEach(function (select) {
      select.addEventListener("change", update);
    });

    minusBtn.addEventListener("click", function () {
      qtyInput.value = String(Math.max(1, (Number(qtyInput.value) || 0) - 1));
      update();
    });
    plusBtn.addEventListener("click", function () {
      qtyInput.value = String((Number(qtyInput.value) || 0) + 1);
      update();
    });
    qtyInput.addEventListener("input", update);

    addButton.addEventListener("click", function () {
      var variantId = qtyInput.dataset.variantId;
      var qty = Number(qtyInput.value) || 0;
      if (!variantId || qty <= 0) return;

      addButton.disabled = true;
      addButton.setAttribute("aria-busy", "true");

      // Dispatch native Shopify cart lines update event so the theme cart drawer opens/updates
      var deferredEventPromise = { resolve: function() {}, reject: function() {} };
      deferredEventPromise.promise = new Promise(function(resolve, reject) {
        deferredEventPromise.resolve = resolve;
        deferredEventPromise.reject = reject;
      });
      // Themes that don't listen for the event never settle or catch it.
      deferredEventPromise.promise.catch(function() {});

      // Construct the event extending CustomEvent with writable and configurable properties
      var event = new CustomEvent('shopify:cart:lines-update', {
        bubbles: true,
        cancelable: true
      });
      Object.defineProperty(event, 'action', { value: 'add', writable: true, enumerable: true, configurable: true });
      Object.defineProperty(event, 'context', { value: 'product', writable: true, enumerable: true, configurable: true });
      Object.defineProperty(event, 'lines', { value: [{ merchandiseId: 'gid://shopify/ProductVariant/' + variantId, quantity: qty }], writable: true, enumerable: true, configurable: true });
      Object.defineProperty(event, 'promise', { value: deferredEventPromise.promise, writable: true, enumerable: true, configurable: true });

      document.dispatchEvent(event);

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ items: [{ id: Number(variantId), quantity: qty }] }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (addedItem) {
          if (addedItem.status) {
            deferredEventPromise.reject(new Error(addedItem.message || "Add failed"));
            liveRegion.textContent = addedItem.message || "Add to cart failed";
            return;
          }

          // Fetch updated full cart data
          fetch("/cart.js", {
            headers: { Accept: "application/json" }
          })
            .then(function (res) { return res.json(); })
            .then(function (cart) {
              qtyInput.value = "1";
              liveRegion.textContent = "Added to cart";
              document.dispatchEvent(new CustomEvent("sparklayer:cart:updated"));

              deferredEventPromise.resolve({
                cart: {
                  totalQuantity: cart.item_count
                },
                detail: {
                  items: cart.items || [],
                  itemCount: cart.item_count || qty,
                  source: 'product-form-component',
                  didError: false
                }
              });
            })
            .catch(function (err) {
              deferredEventPromise.reject(err);
            });
        })
        .catch(function () {
          deferredEventPromise.reject(new Error("Network error"));
          liveRegion.textContent = "Network error adding to cart";
        })
        .finally(function () {
          addButton.removeAttribute("aria-busy");
          update();
        });
    });

    update();
    return root;
  }

  function injectInto(card, product) {
    if (card.querySelector(".sl-wsp-embed")) return; // already injected
    var widget = buildCardWidget(product);
    // Prestige's <product-card> is a grid, so a widget appended to the card lands
    // on top of the title. There it goes into the info block, right after the
    // price. Other themes keep the append that already works for them.
    var anchor = needsInfoPlacement() ? findNativePrice(card) : null;
    if (anchor && anchor.parentElement) {
      anchor.parentElement.insertBefore(widget, anchor.nextSibling);
    } else {
      card.appendChild(widget);
    }
    delete card.dataset.slWspBusy;

    // Hide the theme's own price, variant picker and buy / quick-add buttons
    // (everything that matches, but never our own widget).
    hideNative(card, NATIVE_PRICE_SELECTOR);
    hideNative(card, "variant-picker, .variant-picker, [data-variant-picker], fieldset:has(.color-swatch), .color-swatch");
    hideNative(card, "buy-buttons, .buy-buttons, .product-form-buttons, product-form-component, .buy-buttons-block, .quick-add, [class*='quick-add' i], [class*='quickbuy' i], [class*='quick-buy' i], .quick-product__btn, [class*='quick-form' i], .grid-product__color-swatch, .grid-product__colors, [class*='swatch' i]");
  }

  var NATIVE_PRICE_SELECTOR = "product-price, price-list, .price-list, .price, .product-card__price, .product-price, .product-item__price, .grid-product__price";

  function isPrestige() {
    return !!(window.Shopify && Shopify.theme && Shopify.theme.schema_name === "Prestige");
  }

  // Warehouse's card is a block with an info column (.product-item__info), so the
  // widget goes there, right after the price, instead of at the card's end.
  function needsInfoPlacement() {
    return isPrestige() || !!(window.Shopify && Shopify.theme && Shopify.theme.schema_name === "Warehouse");
  }

  function findNativePrice(card) {
    var matches = card.querySelectorAll(NATIVE_PRICE_SELECTOR);
    for (var i = 0; i < matches.length; i++) {
      if (!matches[i].closest(".sl-wsp-embed")) return matches[i];
    }
    return null;
  }

  function hideNative(card, selector) {
    card.querySelectorAll(selector).forEach(function (el) {
      if (el.closest(".sl-wsp-embed")) return;
      el.style.display = "none";
    });
  }

  function run() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(CARD_SELECTOR));
    if (cards.length === 0) return;

    var byProductId = {};
    var byHandle = {};
    cards.forEach(function (card) {
      // Header menus, the footer and the cart drawer reuse the card markup (mega
      // menu product lists, cart recommendations), so leave those alone.
      if (card.closest("header, footer, .mega-menu, #mini-cart, #sparklayer-cart-drawer-root")) return;
      // run() repeats as the page adds cards, so skip ones already done or queued.
      if (card.querySelector(".sl-wsp-embed") || card.dataset.slWspBusy) return;
      card.dataset.slWspBusy = "1";

      if (card.dataset.slVariants && card.dataset.slOptions) {
        try {
          var variants = JSON.parse(card.dataset.slVariants);
          var options = JSON.parse(card.dataset.slOptions);
          for (var i = 0; i < variants.length; i++) {
            var v = variants[i];
            if ((!v.tiers || v.tiers.length === 0) && v.wsp !== null) {
              v.tiers = [{ minQuantity: 1, price: v.wsp }];
            }
          }
          injectInto(card, { options: options, variants: variants });
          return;
        } catch (e) {
          console.error("Failed to parse variants/options dataset for card", e);
        }
      }

      var productId = extractProductId(card);
      if (productId) {
        byProductId[productId] = byProductId[productId] || [];
        byProductId[productId].push(card);
        return;
      }
      var handle = extractHandle(card);
      if (!handle) return;
      byHandle[handle] = byHandle[handle] || [];
      byHandle[handle].push(card);
    });

    Object.keys(byProductId).forEach(function (productId) {
      fetchProduct(productId).then(function (product) {
        if (!product) return;
        byProductId[productId].forEach(function (card) {
          injectInto(card, product);
        });
      });
    });

    Object.keys(byHandle).forEach(function (handle) {
      fetchProductByHandle(handle).then(function (product) {
        if (!product) return;
        byHandle[handle].forEach(function (card) {
          injectInto(card, product);
        });
      });
    });
  }

  // Cards also arrive after load (Horizon's "You may also like", filtered or
  // infinite-scrolled grids), so pick up new ones as they are added.
  function start() {
    run();
    var rerunTimer = null;
    new MutationObserver(function () {
      if (rerunTimer) clearTimeout(rerunTimer);
      rerunTimer = setTimeout(run, 250);
    }).observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
