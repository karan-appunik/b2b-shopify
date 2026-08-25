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

  function initInstance(root) {
    var moneyFormat = root.dataset.moneyFormat || "${{amount}}";
    var addToCartText = root.dataset.i18nAddToCart || "Add to cart";
    var qtyInputs = root.querySelectorAll("[data-sl-qty-input]");
    var addButton = root.querySelector("[data-sl-add-to-cart]");
    var addLabel = root.querySelector("[data-sl-add-to-cart-label]");
    var liveRegion = root.querySelector("[data-sl-live-region]");

    if (!addButton || !addLabel || qtyInputs.length === 0) return;

    function updateTotal() {
      var totalCents = 0;
      var totalQty = 0;
      qtyInputs.forEach(function (input) {
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
