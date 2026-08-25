(function () {
  var root = document.getElementById("sparklayer-cart-drawer-root");
  if (!root) return;

  var i18n = {
    title: root.dataset.i18nTitle,
    myAccount: root.dataset.i18nMyAccount,
    expand: root.dataset.i18nExpand,
    minimise: root.dataset.i18nMinimise,
    step1: root.dataset.i18nStep1,
    step2: root.dataset.i18nStep2,
    step3: root.dataset.i18nStep3,
    step4: root.dataset.i18nStep4,
    searchPlaceholder: root.dataset.i18nSearchPlaceholder,
    empty: root.dataset.i18nEmpty,
    subtotal: root.dataset.i18nSubtotal,
    line: root.dataset.i18nLine,
    lines: root.dataset.i18nLines,
    item: root.dataset.i18nItem,
    items: root.dataset.i18nItems,
    searchEmpty: root.dataset.i18nSearchEmpty,
    checkout: root.dataset.i18nCheckout,
    taxNote: root.dataset.i18nTaxNote,
    perUnit: root.dataset.i18nPerUnit,
    msrp: root.dataset.i18nMsrp,
    close: root.dataset.i18nClose,
    remove: root.dataset.i18nRemove,
    additionalInfo: root.dataset.i18nAdditionalInfo,
    orderNotes: root.dataset.i18nOrderNotes,
    shippingAddress: root.dataset.i18nShippingAddress,
    noAddresses: root.dataset.i18nNoAddresses,
    continueLabel: root.dataset.i18nContinue,
    addNewAddress: root.dataset.i18nAddNewAddress,
    editAddressesPrefix: root.dataset.i18nEditAddressesPrefix,
    yourAccount: root.dataset.i18nYourAccount,
    shippingTaxNote: root.dataset.i18nShippingTaxNote,
    addNewAddressTitle: root.dataset.i18nAddNewAddressTitle,
    cancel: root.dataset.i18nCancel,
    firstName: root.dataset.i18nFirstName,
    lastName: root.dataset.i18nLastName,
    company: root.dataset.i18nCompany,
    line1: root.dataset.i18nLine1,
    line2: root.dataset.i18nLine2,
    city: root.dataset.i18nCity,
    zipCode: root.dataset.i18nZipCode,
    phone: root.dataset.i18nPhone,
    saveToAddressBook: root.dataset.i18nSaveToAddressBook,
    continueUseAddress: root.dataset.i18nContinueUseAddress,
    addressSaveError: root.dataset.i18nAddressSaveError,
    checkoutError: root.dataset.i18nCheckoutError,
    shippingMethod: root.dataset.i18nShippingMethod,
    shippingCalculatedNote: root.dataset.i18nShippingCalculatedNote,
    paymentMethod: root.dataset.i18nPaymentMethod,
    payAdvance: root.dataset.i18nPayAdvance,
    payNet30: root.dataset.i18nPayNet30,
    payNow: root.dataset.i18nPayNow,
    chargedImmediately: root.dataset.i18nChargedImmediately,
    continueToCheckout: root.dataset.i18nContinueToCheckout,
    orderCompleteTitle: root.dataset.i18nOrderCompleteTitle,
    orderCompleteMessage: root.dataset.i18nOrderCompleteMessage,
    viewOrder: root.dataset.i18nViewOrder,
    orderStatus: root.dataset.i18nOrderStatus,
    orderPaymentMethod: root.dataset.i18nOrderPaymentMethod,
    orderShippingMethod: root.dataset.i18nOrderShippingMethod,
    orderShippingAddress: root.dataset.i18nOrderShippingAddress,
    orderShipping: root.dataset.i18nOrderShipping,
    orderTax: root.dataset.i18nOrderTax,
    orderTotal: root.dataset.i18nOrderTotal,
    orderLoading: root.dataset.i18nOrderLoading,
    myAccountTitle: root.dataset.i18nMyAccountTitle,
    recentActivity: root.dataset.i18nRecentActivity,
    viewAll: root.dataset.i18nViewAll,
    noOrdersYet: root.dataset.i18nNoOrdersYet,
    shoppingLists: root.dataset.i18nShoppingLists,
    shoppingListsEmpty: root.dataset.i18nShoppingListsEmpty,
    myDetails: root.dataset.i18nMyDetails,
    email: root.dataset.i18nEmail,
    creditLimit: root.dataset.i18nCreditLimit,
    availableCredit: root.dataset.i18nAvailableCredit,
    netPaymentTerms: root.dataset.i18nNetPaymentTerms,
    notSet: root.dataset.i18nNotSet,
    paymentTermsNote: root.dataset.i18nPaymentTermsNote,
    reports: root.dataset.i18nReports,
    reportsNameColumn: root.dataset.i18nReportsNameColumn,
    purchaseHistoryReport: root.dataset.i18nPurchaseHistoryReport,
    addressBook: root.dataset.i18nAddressBook,
    defaultShippingAddress: root.dataset.i18nDefaultShippingAddress,
    defaultBillingAddress: root.dataset.i18nDefaultBillingAddress,
    ordersPlacedIn: root.dataset.i18nOrdersPlacedIn,
    setAsDefaultAddress: root.dataset.i18nSetAsDefaultAddress,
    saveAddress: root.dataset.i18nSaveAddress,
    activityAll: root.dataset.i18nActivityAll,
    activityAwaitingMerchant: root.dataset.i18nActivityAwaitingMerchant,
    activityOrder: root.dataset.i18nActivityOrder,
    activityReference: root.dataset.i18nActivityReference,
    activitySubmittedOn: root.dataset.i18nActivitySubmittedOn,
    activityAmount: root.dataset.i18nActivityAmount,
    activityStatus: root.dataset.i18nActivityStatus,
  };
  var proxyUrl = root.dataset.proxyUrl;
  var addressProxyUrl = root.dataset.addressProxyUrl;
  var checkoutProxyUrl = root.dataset.checkoutProxyUrl;
  var paymentTermsProxyUrl = root.dataset.paymentTermsProxyUrl;
  var orderDetailProxyUrl = root.dataset.orderDetailProxyUrl;
  var ordersProxyUrl = root.dataset.ordersProxyUrl;
  var variantPricingProxyUrl = root.dataset.variantPricingProxyUrl;
  var wholesalePricing = {}; // variant_id (string) -> { price, wholesalePrice } in cents
  var customerId = root.dataset.customerId;
  var hasCustomer = root.dataset.hasCustomer === "true";
  var customerEmail = root.dataset.customerEmail || "";
  var customerName = root.dataset.customerName || "";
  var moneyFormat = root.dataset.moneyFormat || "${{amount}}";

  var COUNTRIES = [
    {
      code: "US",
      name: "United States",
      provinces: [
        ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
        ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
        ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
        ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
        ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
        ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
        ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
        ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
        ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
        ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"],
        ["WY", "Wyoming"],
      ],
    },
    {
      code: "CA",
      name: "Canada",
      provinces: [
        ["AB", "Alberta"], ["BC", "British Columbia"], ["MB", "Manitoba"], ["NB", "New Brunswick"],
        ["NL", "Newfoundland and Labrador"], ["NS", "Nova Scotia"], ["NT", "Northwest Territories"],
        ["NU", "Nunavut"], ["ON", "Ontario"], ["PE", "Prince Edward Island"], ["QC", "Quebec"],
        ["SK", "Saskatchewan"], ["YT", "Yukon"],
      ],
    },
  ];

  var addresses = [];
  var addressesEl = document.getElementById("sparklayer-customer-addresses");
  if (addressesEl) {
    try {
      addresses = JSON.parse(addressesEl.textContent) || [];
    } catch (e) {
      addresses = [];
    }
  }

  var defaultAddressId = null;
  var defaultAddressEl = document.getElementById("sparklayer-customer-default-address-id");
  if (defaultAddressEl) {
    try {
      defaultAddressId = JSON.parse(defaultAddressEl.textContent);
    } catch (e) {
      defaultAddressId = null;
    }
  }

  var selectedAddressId = defaultAddressId != null ? defaultAddressId : (addresses[0] && addresses[0].id) || null;

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
  var ICON_EXPAND =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">' +
      '<path d="M7.5 3.5h-3a1 1 0 0 0-1 1v3M12.5 3.5h3a1 1 0 0 1 1 1v3M7.5 16.5h-3a1 1 0 0 1-1-1v-3M12.5 16.5h3a1 1 0 0 0 1-1v-3" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  var ICON_MINIMIZE =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="14" height="14">' +
      '<path d="M4.5 7.5h3a1 1 0 0 0 1-1v-3M15.5 7.5h-3a1 1 0 0 1-1-1v-3M4.5 12.5h3a1 1 0 0 1 1 1v3M15.5 12.5h-3a1 1 0 0 0-1 1v3" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  var ICON_PLUS_CIRCLE =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">' +
      '<circle cx="10" cy="10" r="7.25"/>' +
      '<path d="M10 7v6M7 10h6" stroke-linecap="round"/>' +
    "</svg>";
  var ICON_TRASH =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">' +
      '<path d="M4.5 5.5h11M8 5.5V4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1.5M6 5.5l.6 10.4a1 1 0 0 0 1 .9h4.8a1 1 0 0 0 1-.9L14 5.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  var ICON_CHECK =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">' +
      '<path d="M4 10.5l4 4 8-9" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  var ICON_BOOKMARK =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">' +
      '<path d="M6 3.5h8a1 1 0 0 1 1 1V17l-5-3.5L5 17V4.5a1 1 0 0 1 1-1Z" stroke-linejoin="round"/>' +
    "</svg>";
  var ICON_CARD =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">' +
      '<rect x="2.5" y="5" width="15" height="10" rx="1.5"/>' +
      '<path d="M2.5 8.5h15" stroke-linecap="round"/>' +
    "</svg>";
  var ICON_CHECK_CIRCLE =
    '<svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" width="48" height="48">' +
      '<circle cx="24" cy="24" r="21"/>' +
      '<path d="M15 24.5l6.5 6.5L34 17" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";

  var STEPS = [i18n.step1, i18n.step2, i18n.step3, i18n.step4];
  var currentStep = 0;
  var isExpanded = false;
  var cartData = { items: [], item_count: 0, total_price: 0, note: "" };
  var isAddingAddress = false;
  var addAddressError = "";
  var isAccountAddressModalOpen = false;
  var accountAddAddressError = "";
  var accountAddAddressSaving = false;
  var checkoutError = "";
  var selectedPaymentMethod = "pay_now";
  var eligiblePaymentTerms = [];
  var netTermsDueInDays = 30;
  var orderConfirmation = null;
  var activeTab = "cart";
  var accountView = "dashboard"; // "dashboard" | "orders" | "order"
  var accountOrders = null;
  var accountOrdersError = "";
  var accountOrderCounts = null;
  var recentActivityFilter = "all";
  var accountOrderYears = null;
  var selectedOrderYear = null;
  var orderDetail = null;
  var orderDetailError = "";

  function renderTabsHtml() {
    return (
      '<span class="sl-cart-tab' + (activeTab === "cart" ? " is-active" : "") + '" data-sl-tab="cart">' +
        ICON_BAG + "<span>" + escapeHtml(i18n.title) + "</span>" +
      "</span>" +
      '<span class="sl-cart-tab' + (activeTab === "account" ? " is-active" : "") + '" data-sl-tab="account">' +
        ICON_USER + "<span>" + escapeHtml(i18n.myAccount) + "</span>" +
      "</span>" +
      '<button type="button" class="sl-cart-tabs-close" data-sl-close aria-label="' + escapeHtml(i18n.close) + '">&times;</button>'
    );
  }

  function renderStepsHtml() {
    return STEPS.map(function (label, i) {
      var state = i === currentStep ? "is-active" : i < currentStep ? "is-done" : "is-upcoming";
      var dotContent = i < currentStep ? ICON_CHECK : String(i + 1);
      return (
        (i > 0 ? '<div class="sl-cart-step-line' + (i <= currentStep ? " is-filled" : "") + '"></div>' : "") +
        '<div class="sl-cart-step ' + state + '" data-sl-step-jump="' + i + '">' +
          '<div class="sl-cart-step-dot">' + dotContent + "</div>" +
          '<span class="sl-cart-step-label">' + escapeHtml(label) + "</span>" +
        "</div>"
      );
    }).join("");
  }

  function renderCartBody() {
    return (
      '<div class="sl-cart-titlebar">' +
        "<h2>" + escapeHtml(i18n.title) + "</h2>" +
        '<button type="button" class="sl-cart-expand" data-sl-expand>' +
          (isExpanded ? ICON_MINIMIZE : ICON_EXPAND) +
          "<span>" + escapeHtml(isExpanded ? i18n.minimise : i18n.expand) + "</span>" +
        "</button>" +
      "</div>" +
      '<div class="sl-cart-search">' +
        '<div class="sl-cart-search-bar">' +
          ICON_PLUS_CIRCLE +
          '<input type="text" class="sl-cart-search-input" placeholder="' + escapeHtml(i18n.searchPlaceholder) + '" autocomplete="off">' +
        "</div>" +
        '<div class="sl-cart-search-results"></div>' +
      "</div>" +
      '<div class="sl-cart-lines"></div>'
    );
  }

  function renderAddressRow(address) {
    var idStr = String(address.id);
    var checked = idStr === String(selectedAddressId);
    var name = address.name || ((address.first_name || "") + " " + (address.last_name || "")).trim();
    var summary = [name, address.address1, address.province || address.province_code, address.zip]
      .filter(Boolean)
      .join(", ");

    return (
      '<label class="sl-cart-address-row' + (checked ? " is-selected" : "") + '">' +
        '<span class="sl-cart-address-badge">' + (checked ? ICON_CHECK : "") + "</span>" +
        '<span class="sl-cart-address-summary">' + escapeHtml(summary) + "</span>" +
        '<input type="radio" name="sl-shipping-address" value="' + escapeHtml(idStr) + '"' + (checked ? " checked" : "") + ' class="sl-cart-address-radio-input" data-sl-address-radio>' +
      "</label>"
    );
  }

  function renderProvinceOptions(countryCode, selectedCode) {
    var country = COUNTRIES.filter(function (c) { return c.code === countryCode; })[0] || COUNTRIES[0];
    return country.provinces
      .map(function (p) {
        return '<option value="' + escapeHtml(p[0]) + '"' + (p[0] === selectedCode ? " selected" : "") + ">" + escapeHtml(p[1]) + "</option>";
      })
      .join("");
  }

  function renderAddressFormFields(defaultCountry) {
    return (
      '<input type="text" class="sl-cart-field" data-field="firstName" placeholder="' + escapeHtml(i18n.firstName) + ' *" required>' +
      '<input type="text" class="sl-cart-field" data-field="lastName" placeholder="' + escapeHtml(i18n.lastName) + ' *" required>' +
      '<input type="text" class="sl-cart-field sl-cart-field-full" data-field="company" placeholder="' + escapeHtml(i18n.company) + '">' +
      '<input type="text" class="sl-cart-field sl-cart-field-full" data-field="address1" placeholder="' + escapeHtml(i18n.line1) + ' *" required>' +
      '<input type="text" class="sl-cart-field sl-cart-field-full" data-field="address2" placeholder="' + escapeHtml(i18n.line2) + '">' +
      '<input type="text" class="sl-cart-field" data-field="city" placeholder="' + escapeHtml(i18n.city) + ' *" required>' +
      '<input type="text" class="sl-cart-field" data-field="zip" placeholder="' + escapeHtml(i18n.zipCode) + '">' +
      '<select class="sl-cart-field" data-field="countryCode" data-sl-country-select>' +
        COUNTRIES.map(function (c) { return '<option value="' + c.code + '"' + (c.code === defaultCountry ? " selected" : "") + ">" + escapeHtml(c.name) + "</option>"; }).join("") +
      "</select>" +
      '<select class="sl-cart-field" data-field="provinceCode">' + renderProvinceOptions(defaultCountry, null) + "</select>" +
      '<input type="tel" class="sl-cart-field sl-cart-field-full" data-field="phone" placeholder="' + escapeHtml(i18n.phone) + '">'
    );
  }

  function renderAddAddressForm() {
    var defaultCountry = COUNTRIES[0].code;
    return (
      '<div class="sl-cart-heading-row">' +
        '<h3 class="sl-cart-heading">' + escapeHtml(i18n.addNewAddressTitle) + "</h3>" +
        '<a href="#" class="sl-cart-add-address" data-sl-cancel-add-address>' + escapeHtml(i18n.cancel) + "</a>" +
      "</div>" +
      (addAddressError ? '<p class="sl-cart-form-error">' + escapeHtml(addAddressError) + "</p>" : "") +
      '<div class="sl-cart-address-form">' +
        renderAddressFormFields(defaultCountry) +
        (hasCustomer
          ? '<label class="sl-cart-checkbox-row"><input type="checkbox" data-sl-save-to-book> ' + escapeHtml(i18n.saveToAddressBook) + "</label>"
          : "") +
      "</div>"
    );
  }

  function renderAccountAddressModal() {
    if (!isAccountAddressModalOpen) return "";
    var defaultCountry = COUNTRIES[0].code;
    return (
      '<div class="sl-cart-modal-wrap">' +
        '<div class="sl-cart-modal-backdrop" data-sl-close-account-address-modal></div>' +
        '<div class="sl-cart-modal" role="dialog" aria-modal="true" aria-label="' + escapeHtml(i18n.addNewAddressTitle) + '">' +
          '<div class="sl-cart-modal-header">' +
            '<h3 class="sl-cart-heading">' + escapeHtml(i18n.addNewAddressTitle) + "</h3>" +
            '<button type="button" class="sl-cart-modal-close" data-sl-close-account-address-modal aria-label="' + escapeHtml(i18n.close) + '">&times;</button>' +
          "</div>" +
          (accountAddAddressError ? '<p class="sl-cart-form-error">' + escapeHtml(accountAddAddressError) + "</p>" : "") +
          '<div class="sl-cart-modal-form">' +
            renderAddressFormFields(defaultCountry) +
            '<label class="sl-cart-checkbox-row sl-cart-field-full"><input type="checkbox" data-sl-set-default-address> ' + escapeHtml(i18n.setAsDefaultAddress) + "</label>" +
          "</div>" +
          '<div class="sl-cart-modal-footer">' +
            '<button type="button" class="sl-cart-modal-cancel" data-sl-close-account-address-modal>' + escapeHtml(i18n.cancel) + "</button>" +
            '<button type="button" class="sl-cart-modal-save" data-sl-save-account-address' + (accountAddAddressSaving ? " disabled" : "") + '>' + escapeHtml(i18n.saveAddress) + "</button>" +
          "</div>" +
        "</div>" +
      "</div>"
    );
  }

  function renderShippingBody() {
    if (isAddingAddress) {
      return '<div class="sl-cart-shipping">' + renderAddAddressForm() + "</div>";
    }

    var addressHtml = addresses.length
      ? '<div class="sl-cart-address-list">' + addresses.map(renderAddressRow).join("") + "</div>"
      : '<p class="sl-cart-address-empty">' + escapeHtml(i18n.noAddresses) + "</p>";
    var addressCaption = addresses.length
      ? '<p class="sl-cart-address-caption">' + escapeHtml(i18n.editAddressesPrefix) + ' <a href="/account/addresses">' + escapeHtml(i18n.yourAccount) + "</a></p>"
      : "";

    return (
      '<div class="sl-cart-shipping">' +
        '<h3 class="sl-cart-heading">' + escapeHtml(i18n.additionalInfo) + "</h3>" +
        '<textarea class="sl-cart-order-notes" rows="3" placeholder="' + escapeHtml(i18n.orderNotes) + '">' + escapeHtml(cartData.note || "") + "</textarea>" +
        '<div class="sl-cart-heading-row sl-cart-heading-spaced">' +
          '<h3 class="sl-cart-heading">' + escapeHtml(i18n.shippingAddress) + "</h3>" +
          '<a href="#" class="sl-cart-add-address" data-sl-add-address>' + escapeHtml(i18n.addNewAddress) + "</a>" +
        "</div>" +
        addressHtml +
        addressCaption +
      "</div>"
    );
  }

  function renderPaymentOption(value, label, icon, disabled) {
    var checked = selectedPaymentMethod === value;
    return (
      '<label class="sl-cart-payment-option' + (checked ? " is-selected" : "") + (disabled ? " is-disabled" : "") + '">' +
        '<span class="sl-cart-payment-radio">' + (checked ? ICON_CHECK : "") + "</span>" +
        '<span class="sl-cart-payment-label">' + escapeHtml(label) + "</span>" +
        icon +
        '<input type="radio" name="sl-payment-method" value="' + value + '"' + (checked ? " checked" : "") + (disabled ? " disabled" : "") + ' class="sl-cart-payment-radio-input" data-sl-payment-radio>' +
      "</label>"
    );
  }

  function renderReviewPayBody() {
    var banner = selectedPaymentMethod === "pay_now"
      ? '<div class="sl-cart-pay-banner">' + ICON_CHECK + " " + escapeHtml(i18n.chargedImmediately) + "</div>"
      : "";

    return (
      '<div class="sl-cart-shipping">' +
        '<h3 class="sl-cart-heading">' + escapeHtml(i18n.shippingMethod) + "</h3>" +
        '<p class="sl-cart-method-note">' + escapeHtml(i18n.shippingCalculatedNote) + "</p>" +
        '<h3 class="sl-cart-heading sl-cart-heading-spaced">' + escapeHtml(i18n.paymentMethod) + "</h3>" +
        '<div class="sl-cart-payment-list">' +
          renderPaymentOption("advance", i18n.payAdvance, ICON_BOOKMARK, eligiblePaymentTerms.indexOf("advance") === -1) +
          renderPaymentOption("net30", payNet30Label(), ICON_BOOKMARK, eligiblePaymentTerms.indexOf("net30") === -1) +
          renderPaymentOption("pay_now", i18n.payNow, ICON_CARD, false) +
        "</div>" +
        banner +
      "</div>"
    );
  }

  function renderCompleteBody() {
    var orderName = (orderConfirmation && orderConfirmation.name) || "";
    var message = (i18n.orderCompleteMessage || "").replace("{{order_number}}", orderName);
    return (
      '<div class="sl-cart-complete">' +
        '<div class="sl-cart-complete-icon">' + ICON_CHECK_CIRCLE + "</div>" +
        '<h2 class="sl-cart-complete-title">' + escapeHtml(i18n.orderCompleteTitle) + "</h2>" +
        '<p class="sl-cart-complete-message">' + escapeHtml(message) + "</p>" +
        (orderConfirmation
          ? '<a href="#" data-sl-view-order class="sl-cart-checkout sl-cart-complete-view-order">' + escapeHtml(i18n.viewOrder) + "</a>"
          : "") +
      "</div>"
    );
  }

  function formatMoneyFromDecimal(amount) {
    if (amount == null) return formatMoney(0);
    return formatMoney(Math.round(parseFloat(amount) * 100));
  }

  function renderAccountLine(item) {
    var showMsrp = item.msrp != null && parseFloat(item.msrp) > parseFloat(item.price);
    return (
      '<div class="sl-cart-account-line">' +
        '<img src="' + escapeHtml(item.image || "") + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
        '<div class="sl-cart-account-line-main">' +
          '<p class="sl-cart-account-line-title">' + escapeHtml(item.title) + "</p>" +
          (item.sku ? '<p class="sl-cart-account-line-meta">SKU: ' + escapeHtml(item.sku) + "</p>" : "") +
        "</div>" +
        '<div class="sl-cart-account-line-price">' +
          '<span class="sl-price">' + item.quantity + " x " + formatMoneyFromDecimal(item.price) + "</span>" +
          (showMsrp ? '<span class="sl-msrp">' + escapeHtml(i18n.msrp) + ": " + formatMoneyFromDecimal(item.msrp) + "</span>" : "") +
        "</div>" +
      "</div>"
    );
  }

  function renderAccountTotalRow(label, amount, isTotal) {
    return (
      '<div class="sl-cart-account-total-row' + (isTotal ? " is-total" : "") + '">' +
        "<span>" + escapeHtml(label) + "</span>" +
        "<span>" + formatMoneyFromDecimal(amount) + "</span>" +
      "</div>"
    );
  }

  function formatOrderDate(iso) {
    if (!iso) return "";
    var d = new Date(iso);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  function renderAccountOrderRow(order) {
    return (
      '<div class="sl-cart-account-order-row" data-sl-order-id="' + escapeHtml(order.id) + '">' +
        '<div class="sl-cart-account-order-main">' +
          '<span class="sl-cart-account-order-name">' + escapeHtml(order.name) + "</span>" +
          '<span class="sl-cart-account-order-date">' + escapeHtml(formatOrderDate(order.date)) + "</span>" +
        "</div>" +
        '<div class="sl-cart-account-order-side">' +
          '<span class="sl-cart-account-status-badge">' + escapeHtml(order.status) + "</span>" +
          '<span class="sl-cart-account-order-total">' + formatMoneyFromDecimal(order.total) + "</span>" +
        "</div>" +
      "</div>"
    );
  }

  function renderActivityTab(filterValue, label, count) {
    var isActive = recentActivityFilter === filterValue;
    var countLabel = typeof count === "number" ? " (" + count + ")" : "";
    return (
      '<button type="button" class="sl-cart-activity-tab' + (isActive ? " is-active" : "") + '" data-sl-activity-filter="' + filterValue + '">' +
        escapeHtml(label) + countLabel +
      "</button>"
    );
  }

  function renderActivityRow(order) {
    var isAwaiting = order.category === "awaiting_merchant";
    return (
      '<tr class="sl-cart-activity-row" data-sl-order-id="' + escapeHtml(order.id) + '">' +
        '<td class="sl-cart-activity-ref">' + escapeHtml(order.name) + "</td>" +
        "<td>" + escapeHtml(formatOrderDate(order.date)) + "</td>" +
        "<td>" + formatMoneyFromDecimal(order.total) + "</td>" +
        '<td><span class="sl-cart-activity-status' + (isAwaiting ? " is-awaiting" : "") + '">' + escapeHtml(order.status) + "</span></td>" +
      "</tr>"
    );
  }

  function renderRecentActivitySection() {
    if (accountOrdersError) {
      return '<p class="sl-cart-form-error">' + escapeHtml(accountOrdersError) + "</p>";
    }
    if (!accountOrders) {
      return '<p class="sl-cart-address-empty">' + escapeHtml(i18n.orderLoading) + "</p>";
    }
    if (!accountOrders.length) {
      return '<p class="sl-cart-address-empty">' + escapeHtml(i18n.noOrdersYet) + "</p>";
    }

    var counts = accountOrderCounts || {
      all: accountOrders.length,
      awaitingMerchant: accountOrders.filter(function (o) { return o.category === "awaiting_merchant"; }).length,
      order: accountOrders.filter(function (o) { return o.category === "order"; }).length,
    };

    var filteredOrders = recentActivityFilter === "all"
      ? accountOrders
      : accountOrders.filter(function (o) { return o.category === recentActivityFilter; });

    var rowsHtml = filteredOrders.length
      ? filteredOrders.map(renderActivityRow).join("")
      : '<tr><td class="sl-cart-activity-empty-cell" colspan="4">' + escapeHtml(i18n.noOrdersYet) + "</td></tr>";

    return (
      '<div class="sl-cart-activity-tabs">' +
        renderActivityTab("all", i18n.activityAll, counts.all) +
        renderActivityTab("awaiting_merchant", i18n.activityAwaitingMerchant, counts.awaitingMerchant) +
        renderActivityTab("order", i18n.activityOrder, counts.order) +
      "</div>" +
      '<div class="sl-cart-activity-table-wrap">' +
        '<table class="sl-cart-activity-table">' +
          "<thead><tr>" +
            "<th>" + escapeHtml(i18n.activityReference) + "</th>" +
            "<th>" + escapeHtml(i18n.activitySubmittedOn) + "</th>" +
            "<th>" + escapeHtml(i18n.activityAmount) + "</th>" +
            "<th>" + escapeHtml(i18n.activityStatus) + "</th>" +
          "</tr></thead>" +
          "<tbody>" + rowsHtml + "</tbody>" +
        "</table>" +
      "</div>"
    );
  }

  function renderOrderYearOptions() {
    return accountOrderYears.map(function (y) {
      return '<option value="' + y + '"' + (y === selectedOrderYear ? " selected" : "") + ">" +
        escapeHtml(i18n.ordersPlacedIn) + " " + y + "</option>";
    }).join("");
  }

  function renderAccountOrdersListBody() {
    var ordersHtml;
    if (accountOrdersError) {
      ordersHtml = '<p class="sl-cart-form-error">' + escapeHtml(accountOrdersError) + "</p>";
    } else if (!accountOrders) {
      ordersHtml = '<p class="sl-cart-address-empty">' + escapeHtml(i18n.orderLoading) + "</p>";
    } else if (!accountOrders.length) {
      ordersHtml = '<p class="sl-cart-address-empty">' + escapeHtml(i18n.noOrdersYet) + "</p>";
    } else {
      ordersHtml = '<div class="sl-cart-account-order-list">' + accountOrders.map(renderAccountOrderRow).join("") + "</div>";
    }

    var yearSelectHtml;
    if (accountOrderYears && accountOrderYears.length) {
      yearSelectHtml = '<select class="sl-cart-field sl-cart-order-year-select" data-sl-order-year>' + renderOrderYearOptions() + "</select>";
    } else if (accountOrderYears === null) {
      // Years list hasn't come back from the server yet — show a disabled
      // placeholder immediately instead of leaving a gap while it loads.
      var fallbackYear = new Date().getFullYear();
      yearSelectHtml = '<select class="sl-cart-field sl-cart-order-year-select" disabled><option>' +
        escapeHtml(i18n.ordersPlacedIn) + " " + fallbackYear + "</option></select>";
    } else {
      yearSelectHtml = "";
    }

    return (
      '<div class="sl-cart-account">' +
        '<div class="sl-cart-account-breadcrumb">' +
          '<a href="#" data-sl-account-home>' + escapeHtml(i18n.myAccountTitle) + "</a>" +
          ' <span>&rsaquo;</span> ' + escapeHtml(i18n.recentActivity) +
        "</div>" +
        yearSelectHtml +
        ordersHtml +
      "</div>"
    );
  }

  function payNet30Label() {
    return (i18n.payNet30 || "Terms Net {{days}} ( CC, ACH )").replace("{{days}}", netTermsDueInDays);
  }

  function netPaymentTermsLabel() {
    if (eligiblePaymentTerms.indexOf("net30") !== -1) return payNet30Label();
    if (eligiblePaymentTerms.indexOf("advance") !== -1) return i18n.payAdvance;
    return i18n.notSet;
  }

  function findDefaultAddress() {
    for (var i = 0; i < addresses.length; i++) {
      if (String(addresses[i].id) === String(defaultAddressId)) return addresses[i];
    }
    return addresses[0] || null;
  }

  function formatAddressSummary(address) {
    if (!address) return "";
    var name = address.name || ((address.first_name || "") + " " + (address.last_name || "")).trim();
    return [name, address.address1, address.city, address.province || address.province_code, address.zip]
      .filter(Boolean)
      .join(", ");
  }

  function renderAccountAddressRow(label, address) {
    return (
      '<div class="sl-cart-account-address-row">' +
        '<div>' +
          '<span class="sl-cart-account-label">' + escapeHtml(label) + "</span>" +
          '<p class="sl-cart-account-address-summary">' + escapeHtml(formatAddressSummary(address) || "—") + "</p>" +
        "</div>" +
        '<a href="/account/addresses" class="sl-cart-remove" aria-label="' + escapeHtml(i18n.addNewAddress) + '">' + ICON_BOOKMARK + "</a>" +
      "</div>"
    );
  }

  function renderAccountDashboardBody() {
    var recentActivityBody = renderRecentActivitySection();
    var defaultAddress = findDefaultAddress();

    return (
      '<div class="sl-cart-account">' +
        '<div class="sl-cart-heading-row sl-cart-account-header">' +
          '<h2 class="sl-cart-account-title">' + escapeHtml(i18n.myAccountTitle) + "</h2>" +
        "</div>" +

        '<div class="sl-cart-heading-row" data-sl-account-orders>' +
          '<h3 class="sl-cart-heading">' + escapeHtml(i18n.recentActivity) + "</h3>" +
          '<a href="#" data-sl-account-orders class="sl-cart-add-address">' + escapeHtml(i18n.viewAll) + "</a>" +
        "</div>" +
        recentActivityBody +

        '<h3 class="sl-cart-heading sl-cart-heading-spaced">' + escapeHtml(i18n.shoppingLists) + "</h3>" +
        '<div class="sl-cart-account-empty-box">' + escapeHtml(i18n.shoppingListsEmpty) + "</div>" +

        '<h3 class="sl-cart-heading sl-cart-heading-spaced">' + escapeHtml(i18n.myDetails) + "</h3>" +
        '<div class="sl-cart-account-summary-box">' +
          '<div class="sl-cart-account-field sl-cart-account-field-full">' +
            '<span class="sl-cart-account-label">' + escapeHtml(i18n.email) + "</span>" +
            "<span>" + escapeHtml(customerEmail) + "</span>" +
          "</div>" +
          '<div class="sl-cart-account-field">' +
            '<span class="sl-cart-account-label">Name</span>' +
            "<span>" + escapeHtml(customerName) + "</span>" +
          "</div>" +
          '<div class="sl-cart-account-field">' +
            '<span class="sl-cart-account-label">' + escapeHtml(i18n.creditLimit) + "</span>" +
            "<span>" + escapeHtml(i18n.notSet) + "</span>" +
          "</div>" +
          '<div class="sl-cart-account-field">' +
            '<span class="sl-cart-account-label">' + escapeHtml(i18n.availableCredit) + "</span>" +
            "<span>" + escapeHtml(i18n.notSet) + "</span>" +
          "</div>" +
          '<div class="sl-cart-account-field sl-cart-account-field-full">' +
            '<span class="sl-cart-account-label">' + escapeHtml(i18n.netPaymentTerms) + "</span>" +
            "<span>" + escapeHtml(netPaymentTermsLabel()) + "</span>" +
            '<p class="sl-cart-account-note">' + escapeHtml(i18n.paymentTermsNote) + "</p>" +
          "</div>" +
        "</div>" +

        '<h3 class="sl-cart-heading sl-cart-heading-spaced">' + escapeHtml(i18n.reports) + "</h3>" +
        '<div class="sl-cart-account-report-row">' + escapeHtml(i18n.purchaseHistoryReport) + "</div>" +

        '<div class="sl-cart-heading-row sl-cart-heading-spaced">' +
          '<h3 class="sl-cart-heading">' + escapeHtml(i18n.addressBook) + "</h3>" +
          '<a href="#" class="sl-cart-add-address" data-sl-open-account-address-modal>' + escapeHtml(i18n.addNewAddress) + "</a>" +
        "</div>" +
        renderAccountAddressRow(i18n.defaultShippingAddress, defaultAddress) +
        renderAccountAddressRow(i18n.defaultBillingAddress, defaultAddress) +
      "</div>"
    );
  }

  function renderAccountOrderDetail() {
    if (orderDetailError) {
      return '<div class="sl-cart-account"><p class="sl-cart-form-error">' + escapeHtml(orderDetailError) + "</p></div>";
    }
    if (!orderDetail) {
      return '<div class="sl-cart-account"><p class="sl-cart-address-empty">' + escapeHtml(i18n.orderLoading) + "</p></div>";
    }
    var od = orderDetail;
    return (
      '<div class="sl-cart-account">' +
        '<div class="sl-cart-account-breadcrumb">' +
          '<a href="#" data-sl-account-home>' + escapeHtml(i18n.myAccount) + "</a>" +
          ' <span>&rsaquo;</span> ' + escapeHtml(od.name) +
        "</div>" +
        '<div class="sl-cart-account-summary-box">' +
          '<div class="sl-cart-account-field">' +
            '<span class="sl-cart-account-label">' + escapeHtml(i18n.orderStatus) + "</span>" +
            '<span class="sl-cart-account-status-badge">' + escapeHtml(od.status) + "</span>" +
          "</div>" +
          '<div class="sl-cart-account-field">' +
            '<span class="sl-cart-account-label">' + escapeHtml(i18n.orderPaymentMethod) + "</span>" +
            "<span>" + escapeHtml(od.paymentMethod) + "</span>" +
          "</div>" +
          '<div class="sl-cart-account-field">' +
            '<span class="sl-cart-account-label">' + escapeHtml(i18n.orderShippingMethod) + "</span>" +
            "<span>" + escapeHtml(od.shippingMethod || "—") + "</span>" +
          "</div>" +
          (od.shippingAddressLine
            ? '<div class="sl-cart-account-field sl-cart-account-field-full">' +
                '<span class="sl-cart-account-label">' + escapeHtml(i18n.orderShippingAddress) + "</span>" +
                "<span>" + escapeHtml(od.shippingAddressLine) + "</span>" +
              "</div>"
            : "") +
        "</div>" +
        '<div class="sl-cart-account-lines">' + od.lineItems.map(renderAccountLine).join("") + "</div>" +
        '<div class="sl-cart-account-totals">' +
          renderAccountTotalRow(i18n.subtotal, od.subtotal) +
          renderAccountTotalRow(i18n.orderShipping, od.shipping) +
          renderAccountTotalRow(i18n.orderTax, od.tax) +
          renderAccountTotalRow(i18n.orderTotal, od.total, true) +
        "</div>" +
      "</div>"
    );
  }

  function renderFooterHtml() {
    if (currentStep === 3) {
      return "";
    }
    if (currentStep === 0) {
      return (
        '<div class="sl-cart-subtotal">' +
          "<span>" + escapeHtml(i18n.subtotal) + ' <span class="sl-cart-subtotal-count"></span></span>' +
          '<span class="sl-cart-subtotal-amount"></span>' +
        "</div>" +
        '<p class="sl-cart-tax-note">' + escapeHtml(i18n.taxNote) + "</p>" +
        '<div class="sl-cart-footer-divider"></div>' +
        '<a href="/checkout" class="sl-cart-checkout" data-sl-checkout>' + escapeHtml(i18n.checkout) + "</a>"
      );
    }
    var errorHtml = checkoutError ? '<p class="sl-cart-form-error">' + escapeHtml(checkoutError) + "</p>" : "";

    if (currentStep === 2) {
      return (
        errorHtml +
        '<a href="#" class="sl-cart-checkout" data-sl-place-order>' + escapeHtml(i18n.continueToCheckout) + "</a>"
      );
    }

    if (isAddingAddress) {
      return (
        errorHtml +
        '<a href="#" class="sl-cart-checkout" data-sl-save-new-address>' + escapeHtml(i18n.continueUseAddress) + "</a>" +
        '<p class="sl-cart-footer-note">' + escapeHtml(i18n.shippingTaxNote) + "</p>"
      );
    }
    return (
      errorHtml +
      '<a href="#" class="sl-cart-checkout" data-sl-continue>' + escapeHtml(i18n.continueLabel) + "</a>" +
      '<p class="sl-cart-footer-note">' + escapeHtml(i18n.shippingTaxNote) + "</p>"
    );
  }

  root.innerHTML =
    '<div class="sl-cart-overlay" data-sl-close></div>' +
    '<aside class="sl-cart-drawer" role="dialog" aria-label="' + escapeHtml(i18n.title) + '">' +
      '<div class="sl-cart-tabs"></div>' +
      '<div class="sl-cart-steps"></div>' +
      '<div class="sl-cart-body"></div>' +
      '<div class="sl-cart-footer"></div>' +
      '<div class="sl-cart-modal-host"></div>' +
    "</aside>";

  var tabsEl = root.querySelector(".sl-cart-tabs");
  var stepsEl = root.querySelector(".sl-cart-steps");
  var bodyEl = root.querySelector(".sl-cart-body");
  var footerEl = root.querySelector(".sl-cart-footer");
  var modalHostEl = root.querySelector(".sl-cart-modal-host");
  tabsEl.innerHTML = renderTabsHtml();

  function updateAccountAddressModal() {
    modalHostEl.innerHTML = renderAccountAddressModal();
  }

  function openAccountAddressModal() {
    isAccountAddressModalOpen = true;
    accountAddAddressError = "";
    accountAddAddressSaving = false;
    updateAccountAddressModal();
  }

  function closeAccountAddressModal() {
    isAccountAddressModalOpen = false;
    accountAddAddressError = "";
    accountAddAddressSaving = false;
    updateAccountAddressModal();
  }

  function setStep(step) {
    activeTab = "cart";
    tabsEl.innerHTML = renderTabsHtml();
    currentStep = step;
    isAddingAddress = false;
    addAddressError = "";
    checkoutError = "";
    closeAccountAddressModal();
    stepsEl.innerHTML = renderStepsHtml();
    if (currentStep === 0) {
      bodyEl.innerHTML = renderCartBody();
    } else if (currentStep === 1) {
      bodyEl.innerHTML = renderShippingBody();
    } else if (currentStep === 2) {
      bodyEl.innerHTML = renderReviewPayBody();
    } else if (currentStep === 3) {
      bodyEl.innerHTML = renderCompleteBody();
    }
    footerEl.innerHTML = renderFooterHtml();
    if (currentStep === 0) renderCartLines();
  }

  function renderShippingStep() {
    bodyEl.innerHTML = renderShippingBody();
    footerEl.innerHTML = renderFooterHtml();
  }

  function renderReviewPayStep() {
    bodyEl.innerHTML = renderReviewPayBody();
    footerEl.innerHTML = renderFooterHtml();
  }

  function fetchAccountOrders(options) {
    options = options || {};
    if (!ordersProxyUrl) return Promise.resolve();
    var params = [];
    if (customerId) params.push("logged_in_customer_id=" + encodeURIComponent(customerId));
    if (options.forList) params.push("list=1");
    if (options.year) params.push("year=" + encodeURIComponent(options.year));
    var url = ordersProxyUrl + (params.length ? (ordersProxyUrl.indexOf("?") === -1 ? "?" : "&") + params.join("&") : "");
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (body) {
        accountOrders = body.orders || [];
        accountOrderCounts = body.counts || null;
        if (options.forList) {
          accountOrderYears = body.years || [];
          selectedOrderYear = options.year || accountOrderYears[0] || null;
        }
        accountOrdersError = "";
      })
      .catch(function () {
        accountOrdersError = i18n.checkoutError;
      })
      .then(function () {
        if (activeTab !== "account") return;
        if (accountView === "dashboard") bodyEl.innerHTML = renderAccountDashboardBody();
        if (accountView === "orders") bodyEl.innerHTML = renderAccountOrdersListBody();
      });
  }

  function fetchOrderDetail(orderId) {
    if (!orderId || !orderDetailProxyUrl) return Promise.resolve();
    var url = orderDetailProxyUrl + "?id=" + encodeURIComponent(orderId);
    if (customerId) {
      url += "&logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (body) {
        if (body.order) {
          orderDetail = body.order;
          orderDetailError = "";
        } else {
          orderDetailError = body.error || i18n.checkoutError;
        }
      })
      .catch(function () {
        orderDetailError = i18n.checkoutError;
      })
      .then(function () {
        if (activeTab === "account" && accountView === "order") bodyEl.innerHTML = renderAccountOrderDetail();
      });
  }

  function showAccountTab() {
    // Guests have no order history to show — send them to sign in, same as
    // the tab's original external link. Everything about pay_now/net30
    // checkout is unaffected.
    if (!hasCustomer) {
      window.location.href = "/account";
      return;
    }
    activeTab = "account";
    accountView = "dashboard";
    recentActivityFilter = "all";
    closeAccountAddressModal();
    tabsEl.innerHTML = renderTabsHtml();
    stepsEl.innerHTML = "";
    footerEl.innerHTML = "";
    bodyEl.innerHTML = renderAccountDashboardBody();
    fetchAccountOrders();
  }

  function showOrdersList() {
    activeTab = "account";
    accountView = "orders";
    tabsEl.innerHTML = renderTabsHtml();
    stepsEl.innerHTML = "";
    footerEl.innerHTML = "";
    bodyEl.innerHTML = renderAccountOrdersListBody();
    if (!accountOrderYears) fetchAccountOrders({ forList: true });
  }

  function showOrderDetail(orderId) {
    activeTab = "account";
    accountView = "order";
    orderDetail = null;
    orderDetailError = "";
    tabsEl.innerHTML = renderTabsHtml();
    stepsEl.innerHTML = "";
    footerEl.innerHTML = "";
    bodyEl.innerHTML = renderAccountOrderDetail();
    fetchOrderDetail(orderId);
  }

  function readAddressFormFields(container) {
    var values = {};
    container.querySelectorAll(".sl-cart-field").forEach(function (field) {
      values[field.dataset.field] = field.value.trim();
    });
    return values;
  }

  function readAddressForm() {
    var values = readAddressFormFields(bodyEl);
    var saveCheckbox = bodyEl.querySelector("[data-sl-save-to-book]");
    values.saveToBook = hasCustomer && !!(saveCheckbox && saveCheckbox.checked);
    return values;
  }

  function readAccountAddressForm() {
    var values = readAddressFormFields(modalHostEl);
    var defaultCheckbox = modalHostEl.querySelector("[data-sl-set-default-address]");
    values.saveToBook = true;
    values.setDefault = !!(defaultCheckbox && defaultCheckbox.checked);
    return values;
  }

  function addAddressFormIsValid(values) {
    return Boolean(values.firstName && values.lastName && values.address1 && values.city);
  }

  function saveNewAddress(values) {
    if (!values.saveToBook) {
      var localAddress = {
        id: "local-" + Date.now(),
        first_name: values.firstName,
        last_name: values.lastName,
        company: values.company,
        address1: values.address1,
        address2: values.address2,
        city: values.city,
        province_code: values.provinceCode,
        zip: values.zip,
        country_code: values.countryCode,
        phone: values.phone,
      };
      addresses.push(localAddress);
      selectedAddressId = localAddress.id;
      return Promise.resolve();
    }

    var url = addressProxyUrl;
    if (customerId) {
      url += (url.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
      .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
      .then(function (result) {
        if (!result.ok || !result.body.address) {
          throw new Error((result.body && result.body.error) || i18n.addressSaveError);
        }
        addresses.push(result.body.address);
        selectedAddressId = result.body.address.id;
      });
  }

  function saveAccountAddress(values) {
    return saveNewAddress(values).then(function () {
      if (values.setDefault) {
        defaultAddressId = addresses[addresses.length - 1].id;
      }
    });
  }

  function fetchPaymentTerms() {
    if (!paymentTermsProxyUrl) return;
    var url = paymentTermsProxyUrl;
    if (customerId) {
      url += (url.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    console.log("[SparkLayer] Fetching payment terms from url:", url, "for customerId:", customerId);
    fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (body) {
        console.log("[SparkLayer] Received payment terms response:", body);
        eligiblePaymentTerms = body.eligibleTerms || [];
        if (body.netTermsDueInDays) netTermsDueInDays = body.netTermsDueInDays;
        if (currentStep === 2) renderReviewPayStep();
      })
      .catch(function (err) {
        console.error("[SparkLayer] Error fetching payment terms:", err);
        eligiblePaymentTerms = [];
      });
  }

  function openDrawer() {
    root.classList.add("is-open");
    document.body.style.overflow = "hidden";
    setStep(0);
    refreshCart();
    fetchPaymentTerms();
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

  // Product cards / embeds (wholesale-pricing-card.js, wholesale-pricing.js,
  // wholesale-pricing-embed.js) add to cart via a raw /cart/add.js fetch that
  // bypasses the native theme cart-add flow, so the MutationObserver above
  // never fires for them. Without this listener the drawer's cart data goes
  // stale until it's closed/reopened (or the page is refreshed).
  document.addEventListener("sparklayer:cart:updated", function () {
    if (root.classList.contains("is-open")) {
      refreshCart();
    } else {
      openDrawer();
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

  // There's no more Shopify-side cart discount (see priceListPush.server.ts),
  // so line.final_price/original_price are always equal now. wholesalePricing
  // (fetched separately via variantPricingProxyUrl) is the actual source of
  // truth for what this line will cost at checkout — fall back to Shopify's
  // own price fields if a variant has no wholesale price on it.
  function lineDisplayPrice(line) {
    var pricing = wholesalePricing[String(line.variant_id)];
    var msrp = line.original_price;
    var unit = line.final_price;
    if (pricing && pricing.price != null) msrp = pricing.price;
    if (pricing && pricing.wholesalePrice != null && pricing.wholesalePrice < msrp) {
      unit = pricing.wholesalePrice;
    } else {
      unit = msrp;
    }
    return { unit: unit, msrp: msrp };
  }

  function renderLine(line) {
    var displayPrice = lineDisplayPrice(line);
    var unitPrice = displayPrice.unit;
    var showMsrp = displayPrice.msrp > unitPrice;
    var lineTotal = unitPrice * line.quantity;
    var meta = [line.variant_title, line.sku ? "SKU: " + line.sku : null]
      .filter(Boolean)
      .join(" | ");

    return (
      '<div class="sl-cart-line" data-line-key="' + escapeHtml(line.key) + '">' +
        '<img src="' + escapeHtml(line.image || "") + '" alt="' + escapeHtml(line.product_title) + '" loading="lazy">' +
        '<div class="sl-cart-line-main">' +
          '<p class="sl-cart-line-title">' + escapeHtml(line.product_title) + "</p>" +
          (meta ? '<p class="sl-cart-line-meta">' + escapeHtml(meta) + "</p>" : "") +
          '<div class="sl-cart-line-actions">' +
            '<div class="sl-cart-qty">' +
              '<button type="button" data-sl-qty="-1">&minus;</button>' +
              '<input type="text" value="' + line.quantity + '" readonly>' +
              '<button type="button" data-sl-qty="1">+</button>' +
            "</div>" +
            '<button type="button" class="sl-cart-remove" data-sl-remove aria-label="' + escapeHtml(i18n.remove) + '">' + ICON_TRASH + "</button>" +
          "</div>" +
        "</div>" +
        '<div class="sl-cart-line-price">' +
          '<span class="sl-price">' + formatMoney(lineTotal) + "</span>" +
          '<span class="sl-per-unit">' + formatMoney(unitPrice) + escapeHtml(i18n.perUnit) + "</span>" +
          (showMsrp ? '<span class="sl-msrp">' + escapeHtml(i18n.msrp) + ": " + formatMoney(displayPrice.msrp) + "</span>" : "") +
        "</div>" +
      "</div>"
    );
  }

  function renderCartLines() {
    var linesEl = bodyEl.querySelector(".sl-cart-lines");
    if (!linesEl) return;

    if (!cartData.items.length) {
      linesEl.innerHTML = '<div class="sl-cart-empty">' + escapeHtml(i18n.empty) + "</div>";
    } else {
      linesEl.innerHTML = cartData.items.map(renderLine).join("");
    }

    var subtotal = (cartData.items || []).reduce(function (sum, line) {
      return sum + lineDisplayPrice(line).unit * line.quantity;
    }, 0);

    var subtotalEl = footerEl.querySelector(".sl-cart-subtotal-amount");
    var subtotalCountEl = footerEl.querySelector(".sl-cart-subtotal-count");
    if (subtotalEl) subtotalEl.textContent = formatMoney(subtotal);
    if (subtotalCountEl) {
      var lineWord = cartData.items.length === 1 ? i18n.line : i18n.lines;
      var itemWord = cartData.item_count === 1 ? i18n.item : i18n.items;
      subtotalCountEl.textContent = "(" + cartData.items.length + " " + lineWord + ", " + cartData.item_count + " " + itemWord + ")";
    }
  }

  function isValidCart(cart) {
    return !!cart && Array.isArray(cart.items);
  }

  function fetchWholesalePricing(variantIds) {
    if (!variantPricingProxyUrl || !variantIds.length) {
      wholesalePricing = {};
      return Promise.resolve();
    }
    var url = variantPricingProxyUrl + "?ids=" + encodeURIComponent(variantIds.join(","));
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (body) {
        var next = {};
        (body.variants || []).forEach(function (v) {
          next[String(v.variantId)] = {
            price: v.price != null ? Math.round(v.price * 100) : null,
            wholesalePrice: v.wholesalePrice != null ? Math.round(v.wholesalePrice * 100) : null,
          };
        });
        wholesalePricing = next;
      })
      .catch(function () {
        wholesalePricing = {};
      });
  }

  // The theme's own header cart-icon custom element (Horizon: cart-icon.js)
  // exposes renderCartBubble() publicly and already handles the DOM update,
  // sessionStorage sync, and animation correctly — we just need to call it
  // whenever we mutate the cart outside the native theme flow, since that
  // element only listens for Shopify's native cart events by default.
  function syncHeaderCartIcon(itemCount) {
    document.querySelectorAll("cart-icon").forEach(function (icon) {
      if (typeof icon.renderCartBubble === "function") {
        icon.renderCartBubble(itemCount);
      }
    });
  }

  // Neither /cart.js nor /cart/change.js requests are sequenced, so quick
  // successive actions (a qty +/- click before the previous one resolves, or
  // a PDP add-to-cart landing mid-edit) can have their responses arrive out
  // of order. Without a guard, a slower, now-stale response can resolve last
  // and clobber cartData/the header count with an outdated total even though
  // a newer request already returned the real one. This counter makes only
  // the most recently *issued* request allowed to apply its result.
  var cartMutationVersion = 0;

  function refreshCart() {
    var requestVersion = ++cartMutationVersion;
    return fetch("/cart.js")
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        if (!isValidCart(cart) || requestVersion !== cartMutationVersion) return;
        cartData = cart;
        syncHeaderCartIcon(cart.item_count);
        var variantIds = (cart.items || []).map(function (item) { return item.variant_id; });
        return fetchWholesalePricing(variantIds).then(function () {
          if (currentStep === 0) renderCartLines();
        });
      });
  }

  function changeLineQuantity(key, quantity) {
    var requestVersion = ++cartMutationVersion;
    fetch("/cart/change.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: key, quantity: quantity }),
    })
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        if (!isValidCart(cart) || requestVersion !== cartMutationVersion) return;
        cartData = cart;
        syncHeaderCartIcon(cart.item_count);
        renderCartLines();
      });
  }

  function findExactMatch(variants, query) {
    var needle = query.trim().toLowerCase();
    for (var i = 0; i < variants.length; i++) {
      if (variants[i].sku && variants[i].sku.toLowerCase() === needle) return variants[i];
    }
    return null;
  }

  function addVariantToCart(variantId) {
    return fetch("/cart/add.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: variantId, quantity: 1 }),
    })
      .then(function (res) { return res.json(); })
      .then(function () {
        var searchInput = bodyEl.querySelector(".sl-cart-search-input");
        var searchResultsEl = bodyEl.querySelector(".sl-cart-search-results");
        if (searchInput) searchInput.value = "";
        if (searchResultsEl) searchResultsEl.classList.remove("is-visible");
        return refreshCart();
      });
  }

  function runSearch(query) {
    return fetch(proxyUrl + "?q=" + encodeURIComponent(query))
      .then(function (res) { return res.json(); })
      .then(function (data) { return data.variants || []; })
      .catch(function () { return []; });
  }

  function renderSearchResults(searchResultsEl, variants) {
    if (!variants.length) {
      searchResultsEl.innerHTML = '<div class="sl-cart-search-empty">' + escapeHtml(i18n.searchEmpty) + "</div>";
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

  function saveCartNote(note) {
    return fetch("/cart/update.js", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ note: note }),
    })
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        if (!isValidCart(cart)) {
          throw new Error((cart && (cart.description || cart.message)) || i18n.checkoutError);
        }
        cartData = cart;
      });
  }

  function findSelectedAddress() {
    for (var i = 0; i < addresses.length; i++) {
      if (String(addresses[i].id) === String(selectedAddressId)) return addresses[i];
    }
    return null;
  }

  function buildShippingAddressPayload() {
    var address = findSelectedAddress();
    if (!address) return null;
    return {
      firstName: address.first_name || null,
      lastName: address.last_name || null,
      company: address.company || null,
      address1: address.address1 || null,
      address2: address.address2 || null,
      city: address.city || null,
      provinceCode: address.province_code || null,
      zip: address.zip || null,
      countryCode: address.country_code || null,
      phone: address.phone || null,
    };
  }

  function goToCheckout(note) {
    return saveCartNote(note).then(function () {
      var url = checkoutProxyUrl;
      if (customerId) {
        url += (url.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
      }
      return fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note,
          shippingAddress: buildShippingAddressPayload(),
          paymentMethod: selectedPaymentMethod,
          currency: cartData.currency || "USD",
          lineItems: (cartData.items || []).map(function (item) {
            // item.price is the pre-discount unit price in Shopify's cart.js;
            // final_price is the unit price after automatic/segment discounts
            // (e.g. the wholesale price). Send both so checkout can show the
            // MSRP struck through with a visible discount, not just the net price.
            return {
              variantId: item.variant_id,
              quantity: item.quantity,
              price: item.final_price,
              originalPrice: item.original_price,
            };
          }),
        }),
      })
        .then(function (res) { return res.json().then(function (body) { return { ok: res.ok, body: body }; }); })
        .then(function (result) {
          if (!result.ok || (!result.body.invoiceUrl && !result.body.order)) {
            throw new Error((result.body && result.body.error) || i18n.checkoutError);
          }
          if (result.body.order) {
            orderConfirmation = result.body.order;
            return fetch("/cart/clear.js", { method: "POST" })
              .catch(function () {})
              .then(function () {
                cartMutationVersion++;
                cartData = { items: [], item_count: 0, total_price: 0, note: "" };
                syncHeaderCartIcon(0);
                setStep(3);
              });
          }
          window.location.href = result.body.invoiceUrl;
        });
    });
  }

  var searchDebounce;

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-sl-close]")) {
      closeDrawer();
      return;
    }

    var expandBtn = event.target.closest("[data-sl-expand]");
    if (expandBtn) {
      isExpanded = !isExpanded;
      root.classList.toggle("is-expanded", isExpanded);
      expandBtn.innerHTML = (isExpanded ? ICON_MINIMIZE : ICON_EXPAND) +
        "<span>" + escapeHtml(isExpanded ? i18n.minimise : i18n.expand) + "</span>";
      return;
    }

    var stepJump = event.target.closest("[data-sl-step-jump]");
    if (stepJump) {
      var target = parseInt(stepJump.dataset.slStepJump, 10);
      if (target <= currentStep) setStep(target);
      return;
    }

    var tabEl = event.target.closest("[data-sl-tab]");
    if (tabEl) {
      event.preventDefault();
      if (tabEl.dataset.slTab === "account") {
        showAccountTab();
      } else {
        setStep(0);
      }
      return;
    }

    var viewOrderBtn = event.target.closest("[data-sl-view-order]");
    if (viewOrderBtn) {
      event.preventDefault();
      if (orderConfirmation && orderConfirmation.id) showOrderDetail(orderConfirmation.id);
      return;
    }

    var accountHomeLink = event.target.closest("[data-sl-account-home]");
    if (accountHomeLink) {
      event.preventDefault();
      showAccountTab();
      return;
    }

    var accountOrdersLink = event.target.closest("[data-sl-account-orders]");
    if (accountOrdersLink) {
      event.preventDefault();
      showOrdersList();
      return;
    }

    var activityTab = event.target.closest("[data-sl-activity-filter]");
    if (activityTab) {
      event.preventDefault();
      recentActivityFilter = activityTab.dataset.slActivityFilter;
      if (activeTab === "account" && accountView === "dashboard") {
        bodyEl.innerHTML = renderAccountDashboardBody();
      }
      return;
    }

    var orderRow = event.target.closest("[data-sl-order-id]");
    if (orderRow) {
      event.preventDefault();
      showOrderDetail(orderRow.dataset.slOrderId);
      return;
    }

    var checkoutBtn = event.target.closest("[data-sl-checkout]");
    if (checkoutBtn) {
      event.preventDefault();
      setStep(1);
      return;
    }

    var continueBtn = event.target.closest("[data-sl-continue]");
    if (continueBtn) {
      event.preventDefault();
      var notesEl = bodyEl.querySelector(".sl-cart-order-notes");
      var note = notesEl ? notesEl.value : cartData.note || "";
      checkoutError = "";
      saveCartNote(note)
        .then(function () {
          setStep(2);
        })
        .catch(function (err) {
          checkoutError = err.message || i18n.checkoutError;
          renderShippingStep();
        });
      return;
    }

    var placeOrderBtn = event.target.closest("[data-sl-place-order]");
    if (placeOrderBtn) {
      event.preventDefault();
      checkoutError = "";
      goToCheckout(cartData.note || "").catch(function (err) {
        checkoutError = err.message || i18n.checkoutError;
        renderReviewPayStep();
      });
      return;
    }

    var paymentOption = event.target.closest(".sl-cart-payment-option");
    if (paymentOption && !paymentOption.classList.contains("is-disabled")) {
      var radio = paymentOption.querySelector("[data-sl-payment-radio]");
      if (radio && radio.value !== selectedPaymentMethod) {
        selectedPaymentMethod = radio.value;
        renderReviewPayStep();
      }
      return;
    }

    var addAddressLink = event.target.closest("[data-sl-add-address]");
    if (addAddressLink) {
      event.preventDefault();
      isAddingAddress = true;
      addAddressError = "";
      renderShippingStep();
      return;
    }

    var cancelAddAddress = event.target.closest("[data-sl-cancel-add-address]");
    if (cancelAddAddress) {
      event.preventDefault();
      isAddingAddress = false;
      addAddressError = "";
      renderShippingStep();
      return;
    }

    var saveNewAddressBtn = event.target.closest("[data-sl-save-new-address]");
    if (saveNewAddressBtn) {
      event.preventDefault();
      var values = readAddressForm();
      if (!addAddressFormIsValid(values)) {
        addAddressError = i18n.addressSaveError;
        renderShippingStep();
        return;
      }
      var notesEl2 = bodyEl.querySelector(".sl-cart-order-notes");
      var note2 = notesEl2 ? notesEl2.value : cartData.note || "";
      saveNewAddress(values)
        .then(function () {
          return saveCartNote(note2);
        })
        .then(function () {
          isAddingAddress = false;
          addAddressError = "";
          setStep(2);
        })
        .catch(function (err) {
          addAddressError = err.message || i18n.addressSaveError;
          renderShippingStep();
        });
      return;
    }

    var openAccountAddressLink = event.target.closest("[data-sl-open-account-address-modal]");
    if (openAccountAddressLink) {
      event.preventDefault();
      openAccountAddressModal();
      return;
    }

    var closeAccountAddressTarget = event.target.closest("[data-sl-close-account-address-modal]");
    if (closeAccountAddressTarget) {
      event.preventDefault();
      closeAccountAddressModal();
      return;
    }

    var saveAccountAddressBtn = event.target.closest("[data-sl-save-account-address]");
    if (saveAccountAddressBtn) {
      event.preventDefault();
      if (accountAddAddressSaving) return;
      var accountValues = readAccountAddressForm();
      if (!addAddressFormIsValid(accountValues)) {
        accountAddAddressError = i18n.addressSaveError;
        updateAccountAddressModal();
        return;
      }
      accountAddAddressSaving = true;
      accountAddAddressError = "";
      updateAccountAddressModal();
      saveAccountAddress(accountValues)
        .then(function () {
          closeAccountAddressModal();
          if (activeTab === "account" && accountView === "dashboard") {
            bodyEl.innerHTML = renderAccountDashboardBody();
          }
        })
        .catch(function (err) {
          accountAddAddressSaving = false;
          accountAddAddressError = err.message || i18n.addressSaveError;
          updateAccountAddressModal();
        });
      return;
    }

    var lineEl = event.target.closest(".sl-cart-line");
    if (lineEl) {
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
        return;
      }
    }

    var resultEl = event.target.closest("[data-variant-id]");
    if (resultEl) {
      addVariantToCart(resultEl.dataset.variantId);
      return;
    }

    var searchResultsEl = bodyEl.querySelector(".sl-cart-search-results");
    var searchInput = bodyEl.querySelector(".sl-cart-search-input");
    if (searchResultsEl && !searchResultsEl.contains(event.target) && event.target !== searchInput) {
      searchResultsEl.classList.remove("is-visible");
    }
  });

  root.addEventListener("input", function (event) {
    if (!event.target.classList.contains("sl-cart-search-input")) return;
    var searchInput = event.target;
    var searchResultsEl = bodyEl.querySelector(".sl-cart-search-results");
    var query = searchInput.value.trim();
    clearTimeout(searchDebounce);
    if (!query) {
      searchResultsEl.classList.remove("is-visible");
      return;
    }
    searchDebounce = setTimeout(function () {
      runSearch(query).then(function (variants) {
        renderSearchResults(searchResultsEl, variants);
      });
    }, 300);
  });

  root.addEventListener("keydown", function (event) {
    if (event.key !== "Enter" || !event.target.classList.contains("sl-cart-search-input")) return;
    var searchInput = event.target;
    var searchResultsEl = bodyEl.querySelector(".sl-cart-search-results");
    var query = searchInput.value.trim();
    if (!query) return;
    event.preventDefault();
    clearTimeout(searchDebounce);
    runSearch(query).then(function (variants) {
      var exactMatch = findExactMatch(variants, query);
      if (exactMatch) {
        addVariantToCart(exactMatch.id);
      } else if (variants.length === 1) {
        addVariantToCart(variants[0].id);
      } else {
        renderSearchResults(searchResultsEl, variants);
      }
    });
  });

  root.addEventListener("change", function (event) {
    if (event.target.matches("[data-sl-order-year]")) {
      selectedOrderYear = parseInt(event.target.value, 10);
      accountOrders = null;
      bodyEl.innerHTML = renderAccountOrdersListBody();
      fetchAccountOrders({ forList: true, year: selectedOrderYear });
      return;
    }

    if (event.target.matches("[data-sl-country-select]")) {
      var formContainer = event.target.closest(".sl-cart-address-form, .sl-cart-modal-form");
      var provinceSelect = formContainer && formContainer.querySelector('[data-field="provinceCode"]');
      if (provinceSelect) provinceSelect.innerHTML = renderProvinceOptions(event.target.value, null);
      return;
    }

    if (!event.target.matches("[data-sl-address-radio]")) return;
    selectedAddressId = event.target.value;
    bodyEl.querySelectorAll(".sl-cart-address-row").forEach(function (row) {
      row.classList.remove("is-selected");
      var badge = row.querySelector(".sl-cart-address-badge");
      if (badge) badge.innerHTML = "";
    });
    var selectedRow = event.target.closest(".sl-cart-address-row");
    selectedRow.classList.add("is-selected");
    var selectedBadge = selectedRow.querySelector(".sl-cart-address-badge");
    if (selectedBadge) selectedBadge.innerHTML = ICON_CHECK;
  });

  root.addEventListener("focusout", function (event) {
    if (!event.target.classList.contains("sl-cart-order-notes")) return;
    saveCartNote(event.target.value);
  });

  document.addEventListener("click", function (event) {
    var searchResultsEl = bodyEl.querySelector(".sl-cart-search-results");
    var searchInput = bodyEl.querySelector(".sl-cart-search-input");
    if (searchResultsEl && !searchResultsEl.contains(event.target) && event.target !== searchInput) {
      searchResultsEl.classList.remove("is-visible");
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeDrawer();
  });
})();
