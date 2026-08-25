(function () {
  var ROOT_SELECTOR = ".sl-wsp-card";

  // Picks the price for the highest tier whose minQuantity the given
  // quantity still qualifies for (tiers must be sorted ascending).
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

  function formatMoney(cents, moneyFormat) {
    var format = moneyFormat || "${{amount}}";
    var value = (cents / 100).toFixed(2);
    var parts = value.split(".");
    var withComma = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + parts[1];
    return format
      .replace(/\{\{\s*amount_no_decimals\s*\}\}/, parts[0])
      .replace(/\{\{\s*amount_with_comma_separator\s*\}\}/, withComma)
      .replace(/\{\{\s*amount\s*\}\}/, value);
  }

  function initInstance(root) {
    var variantsScript = root.querySelector("[data-sl-variants]");
    if (!variantsScript) return;

    var variants;
    try {
      variants = JSON.parse(variantsScript.textContent);
      for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        if ((!v.tiers || v.tiers.length === 0) && v.wsp !== null) {
          v.tiers = [{ minQuantity: 1, price: v.wsp }];
        }
      }
    } catch (e) {
      return;
    }

    var moneyFormat = root.dataset.moneyFormat || "${{amount}}";
    var addToCartText = root.dataset.i18nAddToCart || "Add to cart";
    var addWithPriceTemplate = root.dataset.i18nAddWithPrice || "Add ({{price}})";
    var soldOutText = root.dataset.i18nSoldOut || "Sold out";

    var optionSelects = Array.prototype.slice.call(root.querySelectorAll("[data-sl-option-select]"));
    var qtyInput = root.querySelector("[data-sl-qty-input]");
    var addButton = root.querySelector("[data-sl-add-to-cart]");
    var addLabel = root.querySelector("[data-sl-add-to-cart-label]");
    var liveRegion = root.querySelector("[data-sl-live-region]");
    var priceEl = root.querySelector("[data-sl-price]");
    var pricePrimary = root.querySelector("[data-sl-price-primary]");
    var priceSecondary = root.querySelector("[data-sl-price-secondary]");

    if (!addButton || !qtyInput) return;

    function findMatchingVariant() {
      if (optionSelects.length === 0) return variants[0] || null;
      var selected = optionSelects
        .slice()
        .sort(function (a, b) { return Number(a.dataset.optionIndex) - Number(b.dataset.optionIndex); })
        .map(function (select) { return select.value; });

      for (var i = 0; i < variants.length; i++) {
        var options = variants[i].options || [];
        var isMatch = options.length === selected.length;
        if (isMatch) {
          for (var j = 0; j < options.length; j++) {
            if (options[j] !== selected[j]) {
              isMatch = false;
              break;
            }
          }
        }
        if (isMatch) return variants[i];
      }
      return null;
    }

    function updateForSelection() {
      var variant = findMatchingVariant();

      if (!variant) {
        qtyInput.removeAttribute("data-variant-id");
        addButton.disabled = true;
        if (addLabel) addLabel.textContent = soldOutText;
        return;
      }

      qtyInput.dataset.variantId = String(variant.id);

      // The primary price display always needs *a* price to show, even
      // before the buyer has entered a real quantity, so the tier lookup
      // is clamped to at least 1 — but the raw (possibly 0) qty below still
      // drives the Add button's enabled state and its total. When no tier
      // qualifies yet (e.g. a 5+ minimum and qty is still 1), falls back to
      // the real native price — never the stale wholesale figure — so this
      // always matches what checkout will actually charge for that qty.
      var rawQty = Number(qtyInput.value) || 0;
      var tierDollars = pickTierPrice(variant.tiers, Math.max(1, rawQty));
      var effectivePrice = tierDollars != null ? Math.round(tierDollars * 100) : variant.nativePrice;
      qtyInput.dataset.variantPrice = String(effectivePrice);

      if (priceEl && pricePrimary) {
        if (tierDollars != null) {
          pricePrimary.textContent = "WSP " + formatMoney(effectivePrice, moneyFormat);
          if (priceSecondary) {
            priceSecondary.textContent = "MSRP: " + formatMoney(variant.nativePrice, moneyFormat);
            priceSecondary.style.display = "";
          }
        } else {
          pricePrimary.textContent = formatMoney(variant.nativePrice, moneyFormat);
          if (priceSecondary) {
            if (variant.compareAtPrice && variant.compareAtPrice > variant.nativePrice) {
              priceSecondary.textContent = "MSRP: " + formatMoney(variant.compareAtPrice, moneyFormat);
              priceSecondary.style.display = "";
            } else {
              priceSecondary.textContent = "";
              priceSecondary.style.display = "none";
            }
          }
        }
      }

      if (!variant.available) {
        addButton.disabled = true;
        if (addLabel) addLabel.textContent = soldOutText;
      } else {
        addButton.disabled = false;
        if (addLabel) {
          addLabel.textContent = rawQty > 0
            ? addWithPriceTemplate.replace("{{price}}", formatMoney(effectivePrice * rawQty, moneyFormat))
            : addToCartText;
        }
      }
    }

    optionSelects.forEach(function (select) {
      select.addEventListener("change", updateForSelection);
    });

    root.querySelectorAll("[data-sl-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        var step = Number(button.dataset.slStep) || 0;
        var next = (Number(qtyInput.value) || 0) + step;
        qtyInput.value = String(Math.max(1, next));
        updateForSelection();
      });
    });

    qtyInput.addEventListener("input", updateForSelection);

    addButton.addEventListener("click", function () {
      var variantId = qtyInput.dataset.variantId;
      var qty = Number(qtyInput.value) || 0;
      if (!variantId || qty <= 0) return;

      addButton.disabled = true;
      addButton.setAttribute("aria-busy", "true");

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ items: [{ id: Number(variantId), quantity: qty }] }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.status) {
            if (liveRegion) liveRegion.textContent = data.message || "Add to cart failed";
            return;
          }
          qtyInput.value = "1";
          if (liveRegion) liveRegion.textContent = "Added to cart";
          document.dispatchEvent(new CustomEvent("sparklayer:cart:updated"));
        })
        .catch(function () {
          if (liveRegion) liveRegion.textContent = "Network error adding to cart";
        })
        .finally(function () {
          addButton.removeAttribute("aria-busy");
          updateForSelection();
        });
    });

    updateForSelection();
  }

  document.querySelectorAll(ROOT_SELECTOR).forEach(initInstance);
})();
