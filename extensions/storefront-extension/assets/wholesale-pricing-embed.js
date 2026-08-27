(function () {
  var CARD_SELECTOR = "product-card";
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

  var PRODUCT_QUERY =
    "query ProductById($id: ID!) {" +
    "  product(id: $id) {" +
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
    "    }" +
    "  }" +
    "}";

  function fetchProduct(productId) {
    return fetch("https://" + shopDomain + "/api/" + STOREFRONT_API_VERSION + "/graphql.json", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": storefrontToken,
      },
      body: JSON.stringify({ query: PRODUCT_QUERY, variables: { id: productId } }),
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

  function buildCardWidget(product) {
    var root = document.createElement("div");
    root.className = "sparklayer-wholesale-pricing sl-wsp-card sl-wsp-embed";

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
      wrap.appendChild(select);
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
      var deferredEventPromise = {
        resolve: function() {},
        reject: function() {},
        promise: new Promise(function(resolve, reject) {
          deferredEventPromise.resolve = resolve;
          deferredEventPromise.reject = reject;
        })
      };

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
    card.appendChild(widget);

    // Hide native price element
    var priceEl = card.querySelector("product-price, .price, .product-card__price");
    if (priceEl) {
      priceEl.style.display = "none";
    }

    // Hide native variant picker
    var pickerEl = card.querySelector("variant-picker, .variant-picker, [data-variant-picker]");
    if (pickerEl) {
      pickerEl.style.display = "none";
    }

    // Hide native buy buttons
    var buttonsEl = card.querySelector("buy-buttons, .buy-buttons, .product-form-buttons, product-form-component, .buy-buttons-block");
    if (buttonsEl) {
      buttonsEl.style.display = "none";
    }
  }

  function run() {
    var cards = Array.prototype.slice.call(document.querySelectorAll(CARD_SELECTOR));
    if (cards.length === 0) return;

    var byProductId = {};
    cards.forEach(function (card) {
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
      if (!productId) return;
      byProductId[productId] = byProductId[productId] || [];
      byProductId[productId].push(card);
    });

    Object.keys(byProductId).forEach(function (productId) {
      fetchProduct(productId).then(function (product) {
        if (!product) return;
        byProductId[productId].forEach(function (card) {
          injectInto(card, product);
        });
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
