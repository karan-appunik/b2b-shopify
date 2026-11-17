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

  function formatCustom(cents, symbol) {
    var val = (cents / 100).toFixed(2);
    var parts = val.split(".");
    var withComma = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",") + "." + parts[1];
    return (symbol || "$") + withComma;
  }

  function extractMsrpFromRaw(rawMsrp, targetCurrency) {
    if (!rawMsrp) return null;
    var data = rawMsrp;
    if (typeof data === "string") {
      try {
        data = JSON.parse(data);
      } catch (e) {
        data = null;
      }
    }
    if (Array.isArray(data)) {
      for (var i = 0; i < data.length; i++) {
        if (data[i] && String(data[i].currency_code || "").toLowerCase() === targetCurrency) {
          return Math.round(Number(data[i].value) * 100);
        }
      }
      for (var j = 0; j < data.length; j++) {
        if (data[j] && data[j].value != null) {
          return Math.round(Number(data[j].value) * 100);
        }
      }
    } else if (data && typeof data === "object" && data.value != null) {
      return Math.round(Number(data.value) * 100);
    } else if (typeof data === "number" && data > 0) {
      return Math.round(data * 100);
    }
    return null;
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

  function initInstance(root) {
    // Lets the stylesheet size the widget per theme (e.g. Warehouse fills its info box).
    var schemaName = window.Shopify && Shopify.theme && Shopify.theme.schema_name;
    if (schemaName) root.setAttribute("data-sl-theme", String(schemaName).toLowerCase().replace(/[^a-z0-9]+/g, "-"));
    applyThemeLook(root);
    var infoCol = root.closest(".product__info-wrapper, .product__info-container, .grid__item");
    if (infoCol) {
      infoCol.style.position = "relative";
      infoCol.style.zIndex = "3";
    }

    var moneyFormat = root.dataset.moneyFormat || "${{amount}}";
    var currencySymbol = root.dataset.currencySymbol || "$";
    var urlParams = new URLSearchParams(window.location.search);
    var countryParam = (urlParams.get("country") || "").toUpperCase();
    var currencyParam = (urlParams.get("currency") || "").toUpperCase();
    var eurCountries = ["DE", "FR", "IT", "ES", "NL", "BE", "AT", "IE", "PT", "FI", "GR", "LU"];
    var forcedCurrency = null;

    if (currencyParam === "EUR" || eurCountries.indexOf(countryParam) !== -1) {
      forcedCurrency = "eur";
      currencySymbol = "€";
    } else if (currencyParam === "GBP" || countryParam === "GB" || countryParam === "UK") {
      forcedCurrency = "gbp";
      currencySymbol = "£";
    } else if (currencyParam === "CAD" || countryParam === "CA") {
      forcedCurrency = "cad";
      currencySymbol = "CA$";
    } else if (currencyParam === "USD" || countryParam === "US") {
      forcedCurrency = "usd";
      currencySymbol = "$";
    }

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
    function applyPriceDisplay(container, tierDollars, nativeCents, compareAtCents, customMsrpCents, isSummary) {
      if (!container) return;
      var wspEl = container.querySelector(".sl-wsp-price-wsp");
      var msrpEl = container.querySelector(".sl-wsp-price-msrp");
      var prefix = isSummary ? wspPrefix : "";

      if (tierDollars != null) {
        var tierCents = Math.round(tierDollars * 100);
        if (wspEl) wspEl.textContent = prefix + formatMoney(tierCents, moneyFormat);
        if (msrpEl) {
          if (customMsrpCents != null && customMsrpCents > 0) {
            msrpEl.textContent = msrpPrefix + ": " + formatCustom(customMsrpCents, currencySymbol);
          } else {
            msrpEl.textContent = msrpPrefix + ": " + formatMoney(nativeCents, moneyFormat);
          }
          msrpEl.style.display = "";
        }
        return tierCents;
      }

      if (wspEl) wspEl.textContent = prefix + formatMoney(nativeCents, moneyFormat);
      if (msrpEl) {
        if (customMsrpCents != null && customMsrpCents > 0) {
          msrpEl.textContent = msrpPrefix + ": " + formatCustom(customMsrpCents, currencySymbol);
          msrpEl.style.display = "";
        } else if (compareAtCents > nativeCents) {
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
      var customMsrpCents = input.dataset.msrpPrice ? Number(input.dataset.msrpPrice) : null;

      var row = input.closest("tr");
      var effectiveCents = applyPriceDisplay(row, tierDollars, nativeCents, compareAtCents, customMsrpCents, false);
      input.dataset.variantPrice = String(effectiveCents);

      if (summaryEl && variantId === summaryVariantId) {
        applyPriceDisplay(summaryEl, tierDollars, nativeCents, compareAtCents, customMsrpCents, true);
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

    qtyInputs.forEach(function (input) {
      var customMsrpCents = input.dataset.msrpPrice ? Number(input.dataset.msrpPrice) : null;
      if (forcedCurrency && input.dataset.msrpRaw) {
        var parsedCents = extractMsrpFromRaw(input.dataset.msrpRaw, forcedCurrency);
        if (parsedCents != null) {
          customMsrpCents = parsedCents;
          input.dataset.msrpPrice = String(parsedCents);
        }
      }
      if (customMsrpCents && customMsrpCents > 0) {
        var row = input.closest("tr");
        if (row) {
          var msrpEl = row.querySelector(".sl-wsp-price-msrp");
          if (msrpEl) {
            msrpEl.textContent = msrpPrefix + ": " + formatCustom(customMsrpCents, currencySymbol);
            msrpEl.style.display = "";
          }
        }
      }
    });

    if (summaryEl) {
      var summaryCustomMsrp = null;
      if (forcedCurrency && summaryEl.dataset.summaryMsrpRaw) {
        summaryCustomMsrp = extractMsrpFromRaw(summaryEl.dataset.summaryMsrpRaw, forcedCurrency);
      }
      if (!summaryCustomMsrp) {
        var selectedInput = root.querySelector('[data-sl-qty-input][data-variant-id="' + summaryVariantId + '"]');
        if (selectedInput && selectedInput.dataset.msrpPrice) {
          summaryCustomMsrp = Number(selectedInput.dataset.msrpPrice);
        }
      }
      if (summaryCustomMsrp && summaryCustomMsrp > 0) {
        var sumMsrpEl = summaryEl.querySelector(".sl-wsp-price-msrp");
        if (sumMsrpEl) {
          sumMsrpEl.textContent = msrpPrefix + ": " + formatCustom(summaryCustomMsrp, currencySymbol);
          sumMsrpEl.style.display = "";
        }
      }
    }

    var wishlistBtn = root.querySelector("[data-sl-wishlist]");
    if (wishlistBtn) {
      wishlistBtn.addEventListener("click", function () {
        var isAdded = wishlistBtn.classList.toggle("is-active");
        var icon = wishlistBtn.querySelector("svg");
        if (icon) {
          icon.setAttribute("fill", isAdded ? "currentColor" : "none");
        }
        document.dispatchEvent(new CustomEvent("sparklayer:wishlist:toggle", { detail: { productId: root.id } }));
      });
    }

    updateTotal();
    initImagePreview(root);
  }

  // Floats a single shared preview image on the left of the table card,
  // vertically aligned with whichever variant row is currently hovered.
  function initImagePreview(root) {
    var preview = root.querySelector("[data-sl-preview]");
    var rows = root.querySelectorAll(".sl-wsp-row[data-sl-preview-src]");
    var scrollContainer = root.querySelector(".sl-wsp-scroll");
    var table = root.querySelector(".sl-wsp-table");
    if (!preview || rows.length === 0) return;

    // Out of the widget's stacking context (it is z-index 1), so theme cards that
    // paint later (Warehouse's Description box) cannot cover the preview.
    if (preview.parentNode !== document.body) document.body.appendChild(preview);
    window.addEventListener("scroll", function () { preview.classList.remove("is-visible"); }, { passive: true });

    var previewHeight = 120;

    function show(row) {
      var src = row.dataset.slPreviewSrc;
      if (!src) return;
      if (preview.src !== src) {
        preview.src = src;
      }

      var rootRect = root.getBoundingClientRect();
      var rowRect = row.getBoundingClientRect();
      var h = preview.offsetHeight || previewHeight;
      var w = preview.offsetWidth || previewHeight;

      // viewport coordinates: left of the widget, centred on the hovered row
      var left = rootRect.left - 14 - w;
      if (left < 8) left = 8;
      var top = rowRect.top + (rowRect.height / 2) - (h / 2);
      top = Math.max(8, Math.min(top, window.innerHeight - h - 8));

      preview.style.setProperty("left", Math.round(left) + "px", "important");
      preview.style.setProperty("top", Math.round(top) + "px", "important");
      preview.classList.add("is-visible");
    }

    function hide() {
      preview.classList.remove("is-visible");
    }

    rows.forEach(function (row) {
      row.addEventListener("mouseenter", function () {
        show(row);
      });
      row.addEventListener("mouseleave", function (e) {
        var related = e.relatedTarget;
        if (related && related.closest && related.closest(".sl-wsp-row[data-sl-preview-src]")) {
          return;
        }
        hide();
      });
      row.addEventListener("focusin", function () {
        show(row);
      });
      row.addEventListener("focusout", function (e) {
        var related = e.relatedTarget;
        if (related && related.closest && related.closest(".sl-wsp-row[data-sl-preview-src]")) {
          return;
        }
        hide();
      });
    });

    if (scrollContainer) {
      scrollContainer.addEventListener("mouseleave", hide);
    } else if (table) {
      table.addEventListener("mouseleave", hide);
    }
  }

  document.querySelectorAll(ROOT_SELECTOR).forEach(initInstance);
})();
