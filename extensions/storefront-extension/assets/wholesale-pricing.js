(function () {
  var ROOT_SELECTOR = ".sparklayer-wholesale-pricing";

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

  function initInstance(root) {
    var moneyFormat = root.dataset.moneyFormat || "${{amount}}";
    var addToCartText = root.dataset.i18nAddToCart || "Add to cart";
    var wspPrefix = root.dataset.i18nWspPrefix || "";
    var msrpPrefix = root.dataset.i18nMsrp || "MSRP";
    var qtyInputs = root.querySelectorAll("[data-sl-qty-input]");
    var addButton = root.querySelector("[data-sl-add-to-cart]");
    var addLabel = root.querySelector("[data-sl-add-to-cart-label]");
    var liveRegion = root.querySelector("[data-sl-live-region]");

    if (!addButton || !addLabel || qtyInputs.length === 0) return;

    var tiersScript = root.querySelector("[data-sl-tiers]");
    var tiersByVariant = {};
    if (tiersScript) {
      try {
        tiersByVariant = JSON.parse(tiersScript.textContent) || {};
      } catch (e) {
        tiersByVariant = {};
      }
    }

    var summaryVariantId = root.dataset.summaryVariantId;
    var summaryEl = root.querySelector("[data-sl-summary]");

    // Writes the WSP/MSRP price into a row (or the page-level summary,
    // which mirrors whichever row is the "selected" variant) for the given
    // tier price. Passing tierDollars === null means no tier qualifies yet,
    // so it falls back to the real native/compare-at price instead of
    // leaving a wholesale figure that quantity no longer actually gets.
    function applyPriceDisplay(container, tierDollars, nativeCents, compareAtCents) {
      if (!container) return;
      var wspEl = container.querySelector(".sl-wsp-price-wsp");
      var msrpEl = container.querySelector(".sl-wsp-price-msrp");

      if (tierDollars != null) {
        var tierCents = Math.round(tierDollars * 100);
        if (wspEl) wspEl.textContent = wspPrefix + formatMoney(tierCents, moneyFormat);
        if (msrpEl) {
          msrpEl.textContent = msrpPrefix + ": " + formatMoney(nativeCents, moneyFormat);
          msrpEl.style.display = "";
        }
        return tierCents;
      }

      if (wspEl) wspEl.textContent = formatMoney(nativeCents, moneyFormat);
      if (msrpEl) {
        if (compareAtCents > nativeCents) {
          msrpEl.textContent = msrpPrefix + ": " + formatMoney(compareAtCents, moneyFormat);
          msrpEl.style.display = "";
        } else {
          msrpEl.textContent = "";
          msrpEl.style.display = "none";
        }
      }
      return nativeCents;
    }

    // Re-derives each row's price (in cents) from its quantity-break
    // schedule for the qty currently in its stepper, so the shown price
    // (and the running total) always match what checkout will actually
    // charge for that quantity — never just the "1+" price. Also mirrors
    // the page-level summary line whenever this row is the selected variant.
    function updateRowPrice(input) {
      var variantId = input.dataset.variantId;
      var tiers = tiersByVariant[variantId];
      var qty = Math.max(1, Number(input.value) || 1);
      var tierDollars = tiers && tiers.length ? pickTierPrice(tiers, qty) : null;
      var nativeCents = Number(input.dataset.nativePrice) || 0;
      var compareAtCents = Number(input.dataset.compareAtPrice) || 0;

      var row = input.closest("tr");
      var effectiveCents = applyPriceDisplay(row, tierDollars, nativeCents, compareAtCents);
      input.dataset.variantPrice = String(effectiveCents);

      if (summaryEl && variantId === summaryVariantId) {
        applyPriceDisplay(summaryEl, tierDollars, nativeCents, compareAtCents);
      }
    }

    function updateTotal() {
      var totalCents = 0;
      var totalQty = 0;
      qtyInputs.forEach(function (input) {
        updateRowPrice(input);
        var qty = Number(input.value) || 0;
        var priceCents = Number(input.dataset.variantPrice) || 0;
        totalCents += qty * priceCents;
        totalQty += qty;
      });
      addLabel.textContent = addToCartText + " (" + formatMoney(totalCents, moneyFormat) + ")";
      addButton.disabled = totalQty === 0;
    }

    root.querySelectorAll("[data-sl-step]").forEach(function (button) {
      button.addEventListener("click", function () {
        var variantId = button.dataset.variantId;
        var input = root.querySelector('[data-sl-qty-input][data-variant-id="' + variantId + '"]');
        if (!input) return;
        var step = Number(button.dataset.slStep) || 0;
        var min = Number(input.min) || 0;
        var next = (Number(input.value) || 0) + step;
        input.value = String(Math.max(min, next));
        updateTotal();
      });
    });

    qtyInputs.forEach(function (input) {
      input.addEventListener("input", updateTotal);
    });

    addButton.addEventListener("click", function () {
      var items = [];
      qtyInputs.forEach(function (input) {
        var qty = Number(input.value) || 0;
        if (qty > 0) {
          items.push({ id: Number(input.dataset.variantId), quantity: qty });
        }
      });
      if (items.length === 0) return;

      addButton.disabled = true;
      addButton.setAttribute("aria-busy", "true");

      fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ items: items }),
      })
        .then(function (res) {
          return res.json();
        })
        .then(function (data) {
          if (data.status) {
            if (liveRegion) liveRegion.textContent = data.message || "Add to cart failed";
            return;
          }
          qtyInputs.forEach(function (input) {
            input.value = "0";
          });
          if (liveRegion) liveRegion.textContent = "Added to cart";
          document.dispatchEvent(new CustomEvent("sparklayer:cart:updated"));
        })
        .catch(function () {
          if (liveRegion) liveRegion.textContent = "Network error adding to cart";
        })
        .finally(function () {
          addButton.removeAttribute("aria-busy");
          updateTotal();
        });
    });

    updateTotal();
    initImagePreview(root);
  }

  // Floats a single shared preview image outside the table entirely (fixed
  // to the viewport, positioned to the left of the whole widget) instead of
  // an absolutely-positioned tooltip, which would get clipped by the table's
  // own horizontal-scroll container.
  function initImagePreview(root) {
    var preview = root.querySelector("[data-sl-preview]");
    var thumbs = root.querySelectorAll("[data-sl-preview-src]");
    if (!preview || thumbs.length === 0) return;

    var GAP = 16;
    var MARGIN = 10;

    function show(thumb) {
      var src = thumb.dataset.slPreviewSrc;
      if (!src) return;
      preview.src = src;

      var rootRect = root.getBoundingClientRect();
      var thumbRect = thumb.getBoundingClientRect();
      var previewSize = preview.offsetWidth || 120;

      var left = rootRect.left - previewSize - GAP;
      if (left < MARGIN) left = MARGIN;

      var top = thumbRect.top + thumbRect.height / 2 - previewSize / 2;
      var maxTop = window.innerHeight - previewSize - MARGIN;
      if (top < MARGIN) top = MARGIN;
      if (top > maxTop) top = Math.max(MARGIN, maxTop);

      preview.style.left = left + "px";
      preview.style.top = top + "px";
      preview.classList.add("is-visible");
    }

    function hide() {
      preview.classList.remove("is-visible");
    }

    thumbs.forEach(function (thumb) {
      thumb.addEventListener("mouseenter", function () { show(thumb); });
      thumb.addEventListener("mouseleave", hide);
      thumb.addEventListener("focus", function () { show(thumb); });
      thumb.addEventListener("blur", hide);
    });
  }

  document.querySelectorAll(ROOT_SELECTOR).forEach(initInstance);
})();
