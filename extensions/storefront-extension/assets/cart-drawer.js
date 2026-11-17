/* eslint-disable */
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
    payOnAccount: root.dataset.i18nPayOnAccount,
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
    setAsDefaultShipping: root.dataset.i18nSetAsDefaultShipping,
    setAsDefaultBilling: root.dataset.i18nSetAsDefaultBilling,
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
  var validateCouponProxyUrl = root.dataset.validateCouponProxyUrl;
  // Derived from validateCouponProxyUrl (same "/apps/sparklayer/..." proxy
  // base, just a different path segment) rather than relying solely on the
  // theme block having redeployed with a new data-coupon-availability-proxy-url
  // attribute — the JS asset and the liquid block that renders its data-*
  // attributes can land on the storefront at different times, so this keeps
  // the feature working the moment cart-drawer.js itself updates.
  var couponAvailabilityProxyUrl = root.dataset.couponAvailabilityProxyUrl ||
    (validateCouponProxyUrl ? validateCouponProxyUrl.replace(/\/validate-coupon$/, "/coupon-availability") : undefined);
  var paymentTermsProxyUrl = root.dataset.paymentTermsProxyUrl;
  var creditInfoProxyUrl = root.dataset.creditInfoProxyUrl;
  var orderDetailProxyUrl = root.dataset.orderDetailProxyUrl;
  var ordersProxyUrl = root.dataset.ordersProxyUrl;
  var variantPricingProxyUrl = root.dataset.variantPricingProxyUrl;
  var agentSessionProxyUrl = root.dataset.agentSessionProxyUrl;
  var agentAddressesProxyUrl = root.dataset.agentAddressesProxyUrl;
  var agentCartProxyUrl = root.dataset.agentCartProxyUrl;
  var agentContextProxyUrl = root.dataset.agentContextProxyUrl;
  var agentSearchProxyUrl = root.dataset.agentSearchProxyUrl;
  var agentDashboardProxyUrl = root.dataset.agentDashboardProxyUrl;
  var agentOverrideProxyUrl = root.dataset.agentOverrideProxyUrl;
  var agentApprovalsProxyUrl = root.dataset.agentApprovalsProxyUrl;
  var agentQuoteProxyUrl = root.dataset.agentQuoteProxyUrl;
  var agentQuoteApprovalsProxyUrl = root.dataset.agentQuoteApprovalsProxyUrl;
  var agentPaymentLinksProxyUrl = root.dataset.agentPaymentLinksProxyUrl;
  var agentNewCustomerProxyUrl = root.dataset.agentNewCustomerProxyUrl;
  var quickOrderProxyUrl = root.dataset.quickOrderProxyUrl;
  var agentNotificationsProxyUrl = root.dataset.agentNotificationsProxyUrl;
  var reorderProxyUrl = root.dataset.reorderProxyUrl;
  var agentSummaryProxyUrl = root.dataset.agentSummaryProxyUrl;
  var agentPinsProxyUrl = root.dataset.agentPinsProxyUrl;
  // Derived from the session address when the theme block has not been updated yet.
  var agentDelegationsProxyUrl = root.dataset.agentDelegationsProxyUrl ||
    (agentSessionProxyUrl ? agentSessionProxyUrl.replace(/agent-session$/, "agent-delegations") : undefined);
  var agentOfflineProxyUrl = root.dataset.agentOfflineProxyUrl ||
    (agentSessionProxyUrl ? agentSessionProxyUrl.replace(/agent-session$/, "agent-offline") : undefined);
  var customerQuoteProxyUrl = root.dataset.customerQuoteProxyUrl;
  var shoppingListsProxyUrl = root.dataset.shoppingListsProxyUrl;
  var shoppingLists = null; // saved lists of the signed-in customer, newest first; null until loaded
  var shoppingListMenuId = null; // id of the list whose row "Actions" menu is open (account tab)
  var listAddedBanner = false; // the green "Items have been successfully added" notice on the cart
  // Theme cart drawer SparkLayer mounts into. Dawn: <cart-drawer> + .drawer__inner.
  // Horizon: <cart-drawer-component> whose <dialog> is the sliding panel.
  var nativeFailed = false; // set when the theme drawer mounts but renders at 0 size
  function getNativeHost() {
    if (nativeFailed) return null;
    var dawn = document.querySelector("cart-drawer");
    if (dawn) {
      var dawnInner = dawn.querySelector(".drawer__inner");
      // Prestige: <cart-drawer> is itself a shadow-DOM dialog (header/footer
      // slots, panel in ::part), with no .drawer__inner. Light-DOM children land
      // in its body slot, so the root mounts straight into the element.
      if (!dawnInner && (dawn.shadowRoot || dawn.querySelector("[slot]"))) {
        return { kind: "prestige", el: dawn, inner: dawn };
      }
      // Dawn-family drawers contain #CartDrawer* ids. A <cart-drawer> with a
      // .drawer__inner panel but no such ids (Broadcast) opens through its own
      // classes, not Dawn's .active, so it must not get Dawn's visibility rules.
      if (dawnInner && !dawn.querySelector('[id^="CartDrawer"]')) {
        return { kind: "inner", el: dawn, inner: dawnInner };
      }
      return { kind: "dawn", el: dawn, inner: dawnInner };
    }
    var horizon = document.querySelector("cart-drawer-component");
    // The <dialog> wraps the component (theme-drawer > dialog > cart-drawer-component).
    if (horizon) return { kind: "horizon", el: horizon, inner: horizon.closest("dialog") || horizon.querySelector("dialog") };
    // Impulse: the #CartDrawer div is itself the sliding panel (it gets .drawer--is-open).
    var impulse = document.getElementById("CartDrawer");
    if (impulse && impulse.classList.contains("drawer")) return { kind: "impulse", el: impulse, inner: impulse };
    // Warehouse: <form id="mini-cart" class="mini-cart"> is a small header dropdown
    // (open when aria-hidden="false"). CSS turns it into the same side panel the
    // other themes get; the theme's own toggle still opens and closes it.
    var warehouse = document.getElementById("mini-cart");
    if (warehouse && warehouse.classList.contains("mini-cart")) return { kind: "warehouse", el: warehouse, inner: warehouse };
    return null;
  }
  function isNativeDawnActive() {
    return !!getNativeHost();
  }
  if (!isNativeDawnActive()) {
    root.classList.remove("sl-native-mode");
  }
  var wholesalePricing = {}; // variant_id (string) -> { price, tiers: [{minQuantity, price}] } in cents
  var wholesalePricingAt = {}; // variant_id (string) -> when its price was last fetched
  var pricingPending = false; // lines are drawn but their wholesale prices are still loading

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

  // The shopper's own addresses, kept so they can be restored when an agent
  // leaves a customer's context (addresses is swapped for the customer's
  // while ordering on their behalf).
  var ownAddresses = addresses;
  var ownDefaultAddressId = defaultAddressId;

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
    '<svg xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24" width="24" height="24">' +
    '<path stroke-linecap="round" stroke-linejoin="round" d="M15.8 10.5V6a3.8 3.8 0 1 0-7.6 0v4.5m11.4-2 1.3 12c0 .7-.5 1.2-1.1 1.2H4.2a1.1 1.1 0 0 1-1-1.2l1.2-12a1.1 1.1 0 0 1 1.1-1h13c.6 0 1 .4 1.1 1zm-11 2a.4.4 0 1 1-.7 0 .4.4 0 0 1 .7 0zm7.5 0a.4.4 0 1 1-.7 0 .4.4 0 0 1 .7 0z"/>' +
    "</svg>";
  var ICON_USER =
    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">' +
    '<path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.5 20.12a7.5 7.5 0 0 1 15 0 17.93 17.93 0 0 1-15 0Z"/>' +
    "</svg>";
  var ICON_EXPAND =
    '<svg width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M9.29 13.29L4 18.59V17C4 16.7348 3.89464 16.4804 3.70711 16.2929C3.51957 16.1054 3.26522 16 3 16C2.73478 16 2.48043 16.1054 2.29289 16.2929C2.10536 16.4804 2 16.7348 2 17V21C2.00158 21.1307 2.02876 21.2598 2.08 21.38C2.18147 21.6243 2.37565 21.8185 2.62 21.92C2.74022 21.9712 2.86932 21.9984 3 22H7C7.26522 22 7.51957 21.8946 7.70711 21.7071C7.89464 21.5196 8 21.2652 8 21C8 20.7348 7.89464 20.4804 7.70711 20.2929C7.51957 20.1054 7.26522 20 7 20H5.41L10.71 14.71C10.8983 14.5217 11.0041 14.2663 11.0041 14C11.0041 13.7337 10.8983 13.4783 10.71 13.29C10.5217 13.1017 10.2663 12.9959 10 12.9959C9.7337 12.9959 9.4783 13.1017 9.29 13.29V13.29ZM5.41 4H7C7.26522 4 7.51957 3.89464 7.70711 3.70711C7.89464 3.51957 8 3.26522 8 3C8 2.73478 7.89464 2.48043 7.70711 2.29289C7.51957 2.10536 7.26522 2 7 2H3C2.86932 2.00158 2.74022 2.02876 2.62 2.08C2.37565 2.18147 2.18147 2.37565 2.08 2.62C2.02876 2.74022 2.00158 2.86932 2 3V7C2 7.26522 2.10536 7.51957 2.29289 7.70711C2.48043 7.89464 2.73478 8 3 8C3.26522 8 3.51957 7.89464 3.70711 7.70711C3.89464 7.51957 4 7.26522 4 7V5.41L9.29 10.71C9.38296 10.8037 9.49356 10.8781 9.61542 10.9289C9.73728 10.9797 9.86799 11.0058 10 11.0058C10.132 11.0058 10.2627 10.9797 10.3846 10.9289C10.5064 10.8781 10.617 10.8037 10.71 10.71C10.8037 10.617 10.8781 10.5064 10.9289 10.3846C10.9797 10.2627 11.0058 10.132 11.0058 10C11.0058 9.86799 10.9797 9.73728 10.9289 9.61542C10.8781 9.49356 10.8037 9.38296 10.71 9.29L5.41 4ZM21 16C20.7348 16 20.4804 16.1054 20.2929 16.2929C20.1054 16.4804 20 16.7348 20 17V18.59L14.71 13.29C14.5217 13.1017 14.2663 12.9959 14 12.9959C13.7337 12.9959 13.4783 13.1017 13.29 13.29C13.1017 13.4783 12.9959 13.7337 12.9959 14C12.9959 14.2663 13.1017 14.5217 13.29 14.71L18.59 20H17C16.7348 20 16.4804 20.1054 16.2929 20.2929C16.1054 20.4804 16 20.7348 16 21C16 21.2652 16.1054 21.5196 16.2929 21.7071C16.4804 21.8946 16.7348 22 17 22H21C21.1307 21.9984 21.2598 21.9712 21.38 21.92C21.6243 21.8185 21.8185 21.6243 21.92 21.38C21.9712 21.2598 21.9984 21.1307 22 21V17C22 16.7348 21.8946 16.4804 21.7071 16.2929C21.5196 16.1054 21.2652 16 21 16ZM21.92 2.62C21.8185 2.37565 21.6243 2.18147 21.38 2.08C21.2598 2.02876 21.1307 2.00158 21 2H17C16.7348 2 16.4804 2.10536 16.2929 2.29289C16.1054 2.48043 16 2.73478 16 3C16 3.26522 16.1054 3.51957 16.2929 3.70711C16.4804 3.89464 16.7348 4 17 4H18.59L13.29 9.29C13.1963 9.38296 13.1219 9.49356 13.0711 9.61542C13.0203 9.73728 12.9942 9.86799 12.9942 10C12.9942 10.132 13.0203 10.2627 13.0711 10.3846C13.1219 10.5064 13.1963 10.617 13.29 10.71C13.383 10.8037 13.4936 10.8781 13.6154 10.9289C13.7373 10.9797 13.868 11.0058 14 11.0058C14.132 11.0058 14.2627 10.9797 14.3846 10.9289C14.5064 10.8781 14.617 10.8037 14.71 10.71L20 5.41V7C20 7.26522 20.1054 7.51957 20.2929 7.70711C20.4804 7.89464 20.7348 8 21 8C21.2652 8 21.5196 7.89464 21.7071 7.70711C21.8946 7.51957 22 7.26522 22 7V3C21.9984 2.86932 21.9712 2.74022 21.92 2.62V2.62Z" fill="currentColor"/>' +
    "</svg>";
  // Same icon for Expand and Minimise, so only the label changes.
  var ICON_MINIMIZE = ICON_EXPAND;
  var ICON_PLUS_CIRCLE =
    '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16">' +
    '<circle cx="10" cy="10" r="7.25"/>' +
    '<path d="M10 7v6M7 10h6" stroke-linecap="round"/>' +
    "</svg>";
  var ICON_TRASH =
    '<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' +
    '<path d="M2.5 5H17.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M6.66675 5V3.33333C6.66675 2.89131 6.84234 2.46738 7.15491 2.15482C7.46746 1.84226 7.89139 1.66666 8.33342 1.66666H11.6667C12.1087 1.66666 12.5327 1.84226 12.8452 2.15482C13.1578 2.46738 13.3334 2.89131 13.3334 3.33333V5H6.66675ZM15.8334 5V16.6667C15.8334 17.1087 15.6578 17.5326 15.3452 17.8452C15.0327 18.1577 14.6087 18.3333 14.1667 18.3333H5.83341C5.39139 18.3333 4.96746 18.1577 4.65491 17.8452C4.34234 17.5326 4.16675 17.1087 4.16675 16.6667V5H15.8334Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M8.33325 9.16666V14.1667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<path d="M11.6667 9.16666V14.1667" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>' +
    "</svg>";
  var ICON_SYNC =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M21 12a9 9 0 0 0-15-6.7L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 15 6.7l3-2.7"/><path d="M16 16h5v5"/>' +
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
  // While ordering for a customer the agent also confirms the buyer's PO
  // reference and the delivery date they asked for (spec §3.2 step 8).
  // Set when checkout was refused because a manager must approve the order first.
  var orderApprovalNeeded = false;
  // The agent has said they know some items would be backordered.
  var backorderConfirmed = false;
  // The agent has seen that a price changed and agreed to the new one.
  var priceChangeConfirmed = false;
  var orderPo = "";
  // A note for the team on this order; the customer never sees it.
  var orderInternalNote = "";
  var orderDeliveryDate = "";
  var isAddingAddress = false;
  var addAddressError = "";
  var accountAddAddressError = "";
  var accountAddAddressSaving = false;
  var checkoutError = "";
  var appliedCouponCodes = [];
  var MAX_COUPON_CODES = 3;
  var couponError = "";
  var couponValidating = false;
  // docs.sparklayer.io/discounts: "The coupon code box will only show for
  // your customers if there is an 'active' discount code that is 'enabled'"
  // — starts hidden until fetchCouponAvailability confirms one exists.
  var hasActiveCoupons = false;
  var selectedPaymentMethod = "pay_now";
  var eligiblePaymentTerms = [];
  var netTermsDueInDays = null;
  var customerCreditLimit = null;
  var customerCreditBalance = 0;
  var customerOnAccountEnabled = false;
  var orderConfirmation = null;
  // Set instead of an order when an agent's order was sent to the customer as
  // a secure payment link.
  var paymentLinkSent = null;
  var activeTab = "cart";
  var accountView = "dashboard"; // "dashboard" | "orders" | "order" | "addAddress" | "reports"
  var reportPeriod = "quarter"; // "quarter" | "month" | "week"
  var accountOrders = null;
  var accountOrdersError = "";
  var accountOrderCounts = null;
  var recentActivityFilter = "all";
  var accountOrderYears = null;
  var selectedOrderYear = null;
  var orderDetail = null;
  var orderDetailError = "";
  var orderDetailId = null;
  // Reorder (spec §3.5): what an earlier order's lines would be today.
  var reorder = null;

  // The signed-in person's menu in the header: their initial, name, kind of
  // account, and Log out. Only when someone is signed in.
  var userMenuOpen = false;

  function renderUserMenuHtml() {
    if (!customerId) return "";

    var label = customerName || customerEmail || "";
    var initial = (label.trim().charAt(0) || "?").toUpperCase();
    var isAgent = typeof agentPanel !== "undefined" && agentPanel && agentPanel.isAgent;
    var kind = isAgent ? "Sales agent" : "B2B Account";

    return (
      '<div class="sl-cart-usermenu">' +
      '<button type="button" class="sl-cart-avatar" data-sl-usermenu aria-haspopup="menu" aria-expanded="' + (userMenuOpen ? "true" : "false") + '" aria-label="Account menu">' +
      "<span>" + escapeHtml(initial) + "</span>" +
      '<svg width="12" height="12" viewBox="0 0 20 20" aria-hidden="true"><path d="M5 7l5 5 5-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      "</button>" +
      (userMenuOpen
        ? '<div class="sl-cart-usermenu-pop" role="menu">' +
        '<div class="sl-cart-usermenu-head">' +
        '<span class="sl-cart-avatar sl-cart-avatar-lg" aria-hidden="true"><span>' + escapeHtml(initial) + "</span></span>" +
        "<div><strong>" + escapeHtml(label) + "</strong><span>" + escapeHtml(kind) + "</span></div>" +
        "</div>" +
        '<a role="menuitem" class="sl-cart-usermenu-logout" href="/account/logout">' +
        '<svg width="16" height="16" viewBox="0 0 20 20" aria-hidden="true"><path d="M8 4H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3M12 6l4 4-4 4M16 10H8" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
        "<span>Log out</span>" +
        "</a>" +
        "</div>"
        : "") +
      "</div>"
    );
  }

  function renderTabsHtml() {
    return (
      '<span class="sl-cart-tab' + (activeTab === "cart" ? " is-active" : "") + '" data-sl-tab="cart">' +
      ICON_BAG + "<span>" + escapeHtml(i18n.title) + "</span>" +
      "</span>" +
      '<span class="sl-cart-tab' + (activeTab === "account" ? " is-active" : "") + '" data-sl-tab="account">' +
      ICON_USER + "<span>" + escapeHtml(i18n.myAccount) + "</span>" +
      "</span>" +
      renderUserMenuHtml() +
      '<button type="button" class="sl-cart-tabs-close" data-sl-close onclick="console.log(\'🔴 [Close Button inline onclick]\'); if(window.__slCloseDrawer){window.__slCloseDrawer(event);}else if(this.closest(\'cart-drawer\')){this.closest(\'cart-drawer\').close();}" aria-label="' + escapeHtml(i18n.close) + '">&times;</button>'
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
      '<div class="sl-cart-search-row">' +
      '<div class="sl-cart-search-bar">' +
      ICON_PLUS_CIRCLE +
      '<input type="text" class="sl-cart-search-input" placeholder="' + escapeHtml(i18n.searchPlaceholder) + '" autocomplete="off">' +
      "</div>" +
      '<div class="sl-qo-actions" data-sl-qo-actions>' + quickOrderActionsInner() + "</div>" +
      "</div>" +
      '<div class="sl-cart-search-results"></div>' +
      "</div>" +
      quickOrderHtml() +
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
      '<select class="sl-cart-field" data-field="provinceCode">' + renderProvinceOptions(defaultCountry, null) + "</select>" +
      '<select class="sl-cart-field" data-field="countryCode" data-sl-country-select>' +
      COUNTRIES.map(function (c) { return '<option value="' + c.code + '"' + (c.code === defaultCountry ? " selected" : "") + ">" + escapeHtml(c.name) + "</option>"; }).join("") +
      "</select>" +
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

  // Full-page "Add new address" view within the My Account tab — reached
  // from the Address Book's "Add a new address" link or the bookmark icon
  // on an existing address row (see showAccountAddAddress).
  function renderAccountAddAddressBody() {
    var defaultCountry = COUNTRIES[0].code;
    return (
      '<div class="sl-cart-account">' +
      '<div class="sl-cart-account-breadcrumb">' +
      '<a href="#" data-sl-account-home>' + escapeHtml(i18n.myAccountTitle) + "</a>" +
      ' <span>&rsaquo;</span> ' + escapeHtml(i18n.addressBook) +
      "</div>" +
      '<h3 class="sl-cart-heading">' + escapeHtml(i18n.addNewAddressTitle) + "</h3>" +
      (accountAddAddressError ? '<p class="sl-cart-form-error">' + escapeHtml(accountAddAddressError) + "</p>" : "") +
      '<div class="sl-cart-address-form">' +
      renderAddressFormFields(defaultCountry) +
      '<label class="sl-cart-checkbox-row sl-cart-field-full"><input type="checkbox" data-sl-set-default-shipping> ' + escapeHtml(i18n.setAsDefaultShipping) + "</label>" +
      '<label class="sl-cart-checkbox-row sl-cart-field-full"><input type="checkbox" data-sl-set-default-billing> ' + escapeHtml(i18n.setAsDefaultBilling) + "</label>" +
      "</div>" +
      '<button type="button" class="sl-cart-checkout" data-sl-save-account-address' + (accountAddAddressSaving ? " disabled" : "") + '>' + escapeHtml(i18n.saveAddress) + "</button>" +
      '<a href="#" class="sl-cart-account-cancel-link" data-sl-account-home>' + escapeHtml(i18n.cancel) + "</a>" +
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
      (window.sparklayerAgentContextId
        ? '<div class="sl-agent-po">' +
        '<label>Internal note <span class="sl-agent-row-meta">(only your team sees this)</span><textarea rows="2" maxlength="500" data-sl-internal-note>' + escapeHtml(orderInternalNote) + "</textarea></label>" +
        '<label>PO reference<input type="text" maxlength="64" data-sl-po value="' + escapeHtml(orderPo) + '" placeholder="Customer\u2019s purchase order number"></label>' +
        '<label>Requested delivery date<input type="date" data-sl-delivery value="' + escapeHtml(orderDeliveryDate) + '" min="' + new Date().toISOString().slice(0, 10) + '"></label>' +
        "</div>"
        : "") +
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
    var isAgent = !!window.sparklayerAgentContextId;
    var banner = selectedPaymentMethod === "pay_now"
      ? '<div class="sl-cart-pay-banner">' + ICON_CHECK + " " + escapeHtml(isAgent ? "A secure payment link will be emailed to the customer to pay." : i18n.chargedImmediately) + "</div>"
      : "";

    var payNowLabel = isAgent ? "Send payment link ( CC )" : i18n.payNow;

    return (
      '<div class="sl-cart-shipping">' +
      '<h3 class="sl-cart-heading">' + escapeHtml(i18n.shippingMethod) + "</h3>" +
      '<p class="sl-cart-method-note">' + escapeHtml(i18n.shippingCalculatedNote) + "</p>" +
      '<h3 class="sl-cart-heading sl-cart-heading-spaced">' + escapeHtml(i18n.paymentMethod) + "</h3>" +
      '<div class="sl-cart-payment-list">' +
      renderPaymentOption("advance", i18n.payAdvance, ICON_BOOKMARK, eligiblePaymentTerms.indexOf("advance") === -1) +
      renderPaymentOption("net30", payNet30Label(), ICON_BOOKMARK, eligiblePaymentTerms.indexOf("net30") === -1) +
      renderPaymentOption("pay_now", payNowLabel, ICON_CARD, false) +
      (customerOnAccountEnabled ? renderPaymentOption("account", i18n.payOnAccount, ICON_BOOKMARK, false) : "") +
      "</div>" +
      banner +
      "</div>"
    );
  }

  function renderCompleteBody() {
    var orderName = (orderConfirmation && orderConfirmation.name) || "";
    var message = (i18n.orderCompleteMessage || "").replace("{{order_number}}", orderName);
    if (paymentLinkSent) {
      return (
        '<div class="sl-cart-complete">' +
        '<div class="sl-cart-complete-icon">' + ICON_CHECK_CIRCLE + "</div>" +
        '<h2 class="sl-cart-complete-title">Payment link sent</h2>' +
        '<p class="sl-cart-complete-message">A secure link for ' + escapeHtml(formatMoney(paymentLinkSent.amount, paymentLinkSent.currency)) +
        " was emailed to " + escapeHtml(paymentLinkSent.sentTo || "the customer") +
        ". The order is created once they pay. You can withdraw the link under My Account \u2192 Payment links.</p>" +
        "</div>"
      );
    }
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

  function renderReportDataHtml(orders, period) {
    if (!orders || !orders.length) return "";
    var groups = {};
    var orderKeys = [];
    orders.forEach(function (order) {
      var d = order.date ? new Date(order.date) : null;
      if (!d || isNaN(d.getTime())) return;
      var key = "";
      if (period === "quarter") {
        var q = Math.floor(d.getMonth() / 3) + 1;
        key = "Q" + q + " " + d.getFullYear();
      } else if (period === "week") {
        var startOfYear = new Date(d.getFullYear(), 0, 1);
        var pastDaysOfYear = (d - startOfYear) / 86400000;
        var weekNum = Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
        key = "Week " + weekNum + ", " + d.getFullYear();
      } else {
        var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        key = months[d.getMonth()] + " " + d.getFullYear();
      }
      if (!groups[key]) {
        groups[key] = { period: key, count: 0, total: 0 };
        orderKeys.push(key);
      }
      groups[key].count += 1;
      groups[key].total += (Number(order.total) || 0);
    });

    var rows = orderKeys.map(function (k) { return groups[k]; });
    if (!rows.length) return "";

    return (
      '<div class="sl-report-data-wrap">' +
      '<table class="sl-cart-activity-table">' +
      '<thead><tr><th>Period</th><th>Orders</th><th style="text-align:right;">Total Spend</th></tr></thead>' +
      '<tbody>' +
      rows.map(function (r) {
        return (
          '<tr class="sl-cart-activity-row">' +
          '<td class="sl-cart-activity-ref"><strong>' + escapeHtml(r.period) + '</strong></td>' +
          '<td>' + r.count + ' ' + (r.count === 1 ? 'order' : 'orders') + '</td>' +
          '<td style="text-align:right;">' + formatMoneyFromDecimal(r.total) + '</td>' +
          '</tr>'
        );
      }).join("") +
      '</tbody>' +
      '</table>' +
      '</div>'
    );
  }

  function renderAccountReportsBody() {
    var hasOrders = accountOrders && accountOrders.length > 0;
    var dataHtml = hasOrders ? renderReportDataHtml(accountOrders, reportPeriod) : "";
    var contentHtml = dataHtml || (
      '<div class="sl-report-empty-box">' +
      '<div class="sl-report-empty-icon">' +
      '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' +
      '<rect x="4" y="3" width="16" height="11" rx="1"/>' +
      '<line x1="8" y1="11" x2="8" y2="8.5"/>' +
      '<line x1="12" y1="11" x2="12" y2="6"/>' +
      '<line x1="16" y1="11" x2="16" y2="7.5"/>' +
      '<line x1="2" y1="14" x2="22" y2="14"/>' +
      '<line x1="7" y1="14" x2="5" y2="21"/>' +
      '<line x1="17" y1="14" x2="19" y2="21"/>' +
      '<line x1="12" y1="14" x2="12" y2="21"/>' +
      '<line x1="6" y1="19" x2="18" y2="19"/>' +
      '</svg>' +
      '</div>' +
      '<p class="sl-report-empty-text">There is currently no data to display. Reports will show once you place your first order.</p>' +
      '</div>'
    );

    return (
      '<div class="sl-cart-account">' +
      '<div class="sl-cart-heading-row sl-cart-account-header">' +
      '<div class="sl-cart-account-breadcrumb">' +
      '<a href="#" data-sl-account-home>' + escapeHtml(i18n.myAccountTitle || "My Account") + '</a>' +
      ' <span>&rsaquo;</span> ' + escapeHtml(i18n.reports || "Reports") +
      '</div>' +
      '<button type="button" class="sl-cart-expand" data-sl-expand>' +
      (isExpanded ? ICON_MINIMIZE : ICON_EXPAND) +
      '<span>' + escapeHtml(isExpanded ? i18n.minimise : i18n.expand) + '</span>' +
      '</button>' +
      '</div>' +
      '<div class="sl-report-controls-row">' +
      '<h4 class="sl-report-title">' + escapeHtml(i18n.purchaseHistoryReport || "Purchase history by time period") + '</h4>' +
      '<div class="sl-report-select-wrap">' +
      '<select class="sl-report-period-select" data-sl-report-period>' +
      '<option value="quarter"' + (reportPeriod === "quarter" ? " selected" : "") + '>By quarter</option>' +
      '<option value="month"' + (reportPeriod === "month" ? " selected" : "") + '>By month</option>' +
      '<option value="week"' + (reportPeriod === "week" ? " selected" : "") + '>By week</option>' +
      '</select>' +
      '<span class="sl-report-select-arrow">&#9662;</span>' +
      '</div>' +
      '</div>' +
      contentHtml +
      '</div>'
    );
  }

  function payNet30Label() {
    return (i18n.payNet30 || "Terms Net {{days}} ( CC, ACH )").replace("{{days}}", netTermsDueInDays || 30);
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
      '<a href="#" class="sl-cart-remove" data-sl-open-account-address-modal aria-label="' + escapeHtml(i18n.addNewAddress) + '">' + ICON_BOOKMARK + "</a>" +
      "</div>"
    );
  }

  var agentAccountSubTab = "agent";

  function renderAccountDashboardBody() {
    var recentActivityBody = renderRecentActivitySection();
    var defaultAddress = findDefaultAddress();
    var isAgent = !!agentPanel.isAgent;

    var subtabsHtml = isAgent
      ? '<div class="sl-agent-subtabs">' +
      '<button type="button" class="sl-agent-subtab' + (agentAccountSubTab === "agent" ? " is-active" : "") + '" data-sl-acc-subtab="agent">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:-2px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>' +
      'Agent Workspace' +
      '</button>' +
      '<button type="button" class="sl-agent-subtab' + (agentAccountSubTab === "customer" ? " is-active" : "") + '" data-sl-acc-subtab="customer">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:-2px;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>' +
      'Customer Details & Orders' +
      '</button>' +
      '</div>'
      : "";

    var agentContentHtml = agentPanelHtml();

    var customerContentHtml = (
      buyerQuotesHtml() +
      '<div class="sl-cart-heading-row" data-sl-account-orders>' +
      '<h3 class="sl-cart-heading">' + escapeHtml(i18n.recentActivity) + "</h3>" +
      '<a href="#" data-sl-account-orders class="sl-cart-add-address">' + escapeHtml(i18n.viewAll) + "</a>" +
      "</div>" +
      recentActivityBody +

      renderShoppingListsSection() +

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
      "<span>" + escapeHtml(customerCreditLimit != null ? String(customerCreditLimit) : i18n.notSet) + "</span>" +
      "</div>" +
      '<div class="sl-cart-account-field">' +
      '<span class="sl-cart-account-label">' + escapeHtml(i18n.availableCredit) + "</span>" +
      "<span>" + escapeHtml(customerCreditLimit != null ? String(Math.max(customerCreditLimit - customerCreditBalance, 0)) : i18n.notSet) + "</span>" +
      "</div>" +
      '<div class="sl-cart-account-field sl-cart-account-field-full">' +
      '<span class="sl-cart-account-label">' + escapeHtml(i18n.netPaymentTerms) + "</span>" +
      "<span>" + escapeHtml(netPaymentTermsLabel()) + "</span>" +
      '<p class="sl-cart-account-note">' + escapeHtml(i18n.paymentTermsNote) + "</p>" +
      "</div>" +
      "</div>" +

      '<h3 class="sl-cart-heading sl-cart-heading-spaced">' + escapeHtml(i18n.reports) + "</h3>" +
      '<div class="sl-cart-reports-table">' +
      '<div class="sl-cart-reports-header">' + escapeHtml(i18n.reportsNameColumn || "Name") + "</div>" +
      '<a href="#" class="sl-cart-reports-row" data-sl-open-reports>' +
      '<span>' + escapeHtml(i18n.purchaseHistoryReport) + '</span>' +
      '<span class="sl-cart-reports-arrow">&rsaquo;</span>' +
      '</a>' +
      '</div>' +

      '<div class="sl-cart-heading-row sl-cart-heading-spaced">' +
      '<h3 class="sl-cart-heading">' + escapeHtml(i18n.addressBook) + "</h3>" +
      '<a href="#" class="sl-cart-add-address" data-sl-open-account-address-modal>' + escapeHtml(i18n.addNewAddress) + "</a>" +
      "</div>" +
      renderAccountAddressRow(i18n.defaultShippingAddress, defaultAddress) +
      renderAccountAddressRow(i18n.defaultBillingAddress, defaultAddress)
    );

    var mainContentHtml = (!isAgent || agentAccountSubTab === "customer") ? customerContentHtml : agentContentHtml;

    return (
      '<div class="sl-cart-account">' +
      '<div class="sl-cart-heading-row sl-cart-account-header">' +
      '<h2 class="sl-cart-account-title">' + escapeHtml(i18n.myAccountTitle) + "</h2>" +
      "</div>" +
      subtabsHtml +
      mainContentHtml +
      "</div>"
    );
  }

  var REORDER_TEXT = { ADDED: "Will be added", QUANTITY_ADJUSTED: "Quantity changed", UNAVAILABLE: "Can't be added", RESTRICTED: "Can't be ordered", SUBSTITUTED: "Substitute offered" };

  // A substitute is only added when the agent has said yes to it.
  function reorderAddable(r) {
    return r.quantity > 0 && !r.added && (r.status !== "SUBSTITUTED" || r.accepted === true);
  }

  function reorderHtml() {
    // Offered to a sales agent ordering for a customer.
    if (!window.sparklayerAgentContextId || !reorderProxyUrl || !orderDetailId) return "";

    if (!reorder) {
      return '<div class="sl-reorder"><button type="button" class="sl-agent-start" data-sl-reorder>Reorder these items</button></div>';
    }
    if (reorder.busy) return '<div class="sl-reorder"><p class="sl-agent-hint">Checking today\u2019s prices and stock\u2026</p></div>';
    if (reorder.error) return '<div class="sl-reorder"><p class="sl-agent-error" role="alert">' + escapeHtml(reorder.error) + '</p><button type="button" class="sl-agent-link" data-sl-reorder>Try again</button></div>';

    var addable = reorder.rows.filter(reorderAddable);
    var changed = reorder.rows.some(function (r) { return r.status !== "ADDED"; });

    return (
      '<div class="sl-reorder"><strong>Reorder from ' + escapeHtml(reorder.orderName) + "</strong>" +
      '<p class="sl-agent-hint">Prices are today\u2019s prices for this customer, not what was paid before.' +
      (changed ? " Some lines are different \u2014 check them before adding." : "") + "</p>" +
      '<table class="sl-qo-table"><tbody>' + reorder.rows.map(function (r) {
        var state = r.added ? "Added" : REORDER_TEXT[r.status] || r.status;
        var cls = r.added ? "is-ok" : r.status === "ADDED" ? "" : "is-bad";
        return '<tr class="' + cls + '"><td>' + escapeHtml(r.title) + (r.sku ? '<br><span class="sl-agent-row-meta">' + escapeHtml(r.sku) + "</span>" : "") +
          "</td><td>" + (r.quantity ? "x " + escapeHtml(r.quantity) + (r.requested !== r.quantity ? ' <span class="sl-agent-row-meta">(was ' + escapeHtml(r.requested) + ")</span>" : "") : "") +
          (r.unitPrice != null && r.quantity ? "<br>" + formatMoney(Math.round(r.unitPrice * 100)) + " each" : "") +
          "</td><td>" + escapeHtml(state) + (r.note ? '<br><span class="sl-agent-row-meta">' + escapeHtml(r.note) + "</span>" : "") +
          (r.status === "SUBSTITUTED" && !r.added
            ? '<br><label class="sl-nc-check"><input type="checkbox" data-sl-reorder-accept="' + escapeHtml(r.variantId) + '"' + (r.accepted ? " checked" : "") + "> Use this instead</label>"
            : "") + "</td></tr>";
      }).join("") + "</tbody></table>" +
      '<div class="sl-nc-actions">' +
      (addable.length
        ? '<button type="button" class="sl-agent-start" data-sl-reorder-add>' + (changed ? "Confirm and add " : "Add ") + addable.length + " to cart</button> "
        : "") +
      '<a href="#" class="sl-agent-link" data-sl-tab="cart">Go to cart</a></div></div>'
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
      reorderHtml() +
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
      // Up to MAX_COUPON_CODES codes stack per order (docs.sparklayer.io/discounts)
      // — once the cap is hit the input hides and only Remove stays available.
      // Also hidden entirely when no active coupon discount exists at all
      // (docs.sparklayer.io/discounts "the coupon code box will only show
      // ... if there is an 'active' discount code that is 'enabled'").
      var couponInputHtml = (hasActiveCoupons && appliedCouponCodes.length < MAX_COUPON_CODES)
        ? '<div class="sl-cart-coupon">' +
        '<input type="text" class="sl-cart-coupon-input" data-sl-coupon-input placeholder="Coupon code"' + (couponValidating ? " disabled" : "") + '>' +
        '<button type="button" class="sl-cart-coupon-apply" data-sl-coupon-apply' + (couponValidating ? " disabled" : "") + '>' + (couponValidating ? "Applying…" : "Apply") + "</button>" +
        "</div>"
        : "";
      var couponErrorHtml = couponError
        ? '<p class="sl-cart-form-error">' + escapeHtml(couponError) + "</p>"
        : "";
      var couponAppliedHtml = appliedCouponCodes.map(function (code) {
        return (
          '<p class="sl-cart-coupon-applied">Code "' + escapeHtml(code) + '" will be applied at checkout ' +
          '<button type="button" class="sl-cart-coupon-remove" data-sl-coupon-remove data-code="' + escapeHtml(code) + '">Remove</button></p>'
        );
      }).join("");

      var subtotal = (cartData.items || []).reduce(function (sum, line) {
        return sum + lineDisplayPrice(line).unit * line.quantity;
      }, 0);
      var lineWord = (cartData.items || []).length === 1 ? i18n.line : i18n.lines;
      var itemWord = (cartData.item_count || 0) === 1 ? i18n.item : i18n.items;
      var countStr = "(" + (cartData.items || []).length + " " + lineWord + ", " + (cartData.item_count || 0) + " " + itemWord + ")";

      var hasTerms = Boolean(eligiblePaymentTerms && eligiblePaymentTerms.length > 0);
      var isNet = hasTerms && (eligiblePaymentTerms.indexOf("NET_30") !== -1 || eligiblePaymentTerms.indexOf("NET_60") !== -1 || eligiblePaymentTerms.indexOf("NET_90") !== -1 || eligiblePaymentTerms.indexOf("net30") !== -1 || (netTermsDueInDays && netTermsDueInDays > 0));
      var termsName = isNet ? ("Net " + (netTermsDueInDays || 30)) : (hasTerms ? "Pay on Account" : "");
      var termsNoticeHtml = termsName
        ? '<div class="sl-b2b-terms-notice">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>' +
          '<span>B2B Payment Terms: <strong>' + escapeHtml(termsName) + ' (Pay on Account)</strong></span>' +
          '</div>'
        : "";

      return (
        couponInputHtml +
        couponErrorHtml +
        couponAppliedHtml +
        '<div class="sl-cart-subtotal">' +
        "<span>" + escapeHtml(i18n.subtotal) + ' <span class="sl-cart-subtotal-count">' + escapeHtml(countStr) + "</span></span>" +
        '<span class="sl-cart-subtotal-amount">' + escapeHtml(formatMoney(subtotal)) + "</span>" +
        "</div>" +
        '<p class="sl-cart-tax-note">' + escapeHtml(i18n.taxNote) + "</p>" +
        '<div class="sl-cart-footer-divider"></div>' +
        footerActionsHtml()
      );
    }
    var errorHtml = checkoutError ? '<p class="sl-cart-form-error">' + escapeHtml(checkoutError) + "</p>" : "";
    if (checkoutError && orderApprovalNeeded) {
      errorHtml += '<button type="button" class="sl-agent-start" data-sl-order-approval>Ask a manager to approve this order</button>';
    }

    if (currentStep === 2) {
      var isAgent = !!window.sparklayerAgentContextId;
      var checkoutBtnText = (isAgent && selectedPaymentMethod === "pay_now")
        ? "Send payment link"
        : i18n.continueToCheckout;
      return (
        errorHtml +
        '<a href="#" class="sl-cart-checkout" data-sl-place-order>' + escapeHtml(checkoutBtnText) + "</a>"
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
    '<div class="sl-cart-agent-banner" role="status" hidden></div>' +
    '<div class="sl-cart-tabs"></div>' +
    '<div class="sl-cart-steps"></div>' +
    '<div class="sl-cart-body"></div>' +
    '<div class="sl-cart-footer"></div>' +
    '<div class="sl-cart-modal-host"></div>' +
    "</aside>";

  var agentBannerEl = root.querySelector(".sl-cart-agent-banner");
  var tabsEl = root.querySelector(".sl-cart-tabs");
  var stepsEl = root.querySelector(".sl-cart-steps");
  var bodyEl = root.querySelector(".sl-cart-body");
  var footerEl = root.querySelector(".sl-cart-footer");
  tabsEl.innerHTML = renderTabsHtml();

  function resetAccountAddAddressState() {
    accountAddAddressError = "";
    accountAddAddressSaving = false;
  }

  function showAccountAddAddress() {
    activeTab = "account";
    accountView = "addAddress";
    resetAccountAddAddressState();
    tabsEl.innerHTML = renderTabsHtml();
    stepsEl.innerHTML = "";
    footerEl.innerHTML = "";
    bodyEl.innerHTML = renderAccountAddAddressBody();
  }

  function setStep(step) {
    overrideForm = null;
    exForm = null;
    activeTab = "cart";
    tabsEl.innerHTML = renderTabsHtml();
    currentStep = step;
    isAddingAddress = false;
    addAddressError = "";
    checkoutError = "";
    resetAccountAddAddressState();
    // The progress bar only appears once checkout starts (Shipping onwards),
    // not on the cart step — same in the theme's drawer and SparkLayer's own.
    stepsEl.hidden = currentStep === 0;
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
    if (typeof syncDawnNativeDrawer === "function" && isNativeDawnActive()) syncDawnNativeDrawer();
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
    return safeFetchJson(url)
      .then(function (result) {
        var body = result.body || {};
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
        if (accountView === "reports") bodyEl.innerHTML = renderAccountReportsBody();
      });
  }

  function fetchOrderDetail(orderId) {
    if (!orderId || !orderDetailProxyUrl) return Promise.resolve();
    orderDetailId = orderId;
    reorder = null;
    var url = orderDetailProxyUrl + "?id=" + encodeURIComponent(orderId);
    if (customerId) {
      url += "&logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    return safeFetchJson(url)
      .then(function (result) {
        var body = result.body || {};
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
    overrideForm = null;
    exForm = null;
    activeTab = "account";
    accountView = "dashboard";
    listAddedBanner = false;
    recentActivityFilter = "all";
    resetAccountAddAddressState();
    tabsEl.innerHTML = renderTabsHtml();
    stepsEl.innerHTML = "";
    footerEl.innerHTML = "";
    bodyEl.innerHTML = renderAccountDashboardBody();
    fetchAccountOrders();
    if (typeof syncDawnNativeDrawer === "function" && isNativeDawnActive()) syncDawnNativeDrawer();
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

  function showReportsView() {
    activeTab = "account";
    accountView = "reports";
    tabsEl.innerHTML = renderTabsHtml();
    stepsEl.innerHTML = "";
    footerEl.innerHTML = "";
    bodyEl.innerHTML = renderAccountReportsBody();
    if (!accountOrders) fetchAccountOrders();
  }

  function showReorder() {
    if (activeTab === "account" && accountView === "order") bodyEl.innerHTML = renderAccountOrderDetail();
  }

  root.addEventListener("change", function (event) {
    if (event.target && event.target.matches && event.target.matches("[data-sl-report-period]")) {
      reportPeriod = event.target.value;
      if (activeTab === "account" && accountView === "reports") {
        bodyEl.innerHTML = renderAccountReportsBody();
      }
      return;
    }
    var accept = event.target.closest && event.target.closest("[data-sl-reorder-accept]");
    if (!accept || !reorder || !reorder.rows) return;
    var id = accept.getAttribute("data-sl-reorder-accept");
    reorder.rows.forEach(function (r) {
      if (String(r.variantId) === id && r.status === "SUBSTITUTED") r.accepted = accept.checked;
    });
    showReorder();
  });

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-sl-reorder]")) {
      reorder = { busy: true };
      showReorder();
      postJson(reorderProxyUrl, { orderId: orderDetailId, currency: cartData.currency || "USD" }).then(function (result) {
        var body = result.body || {};
        reorder = result.ok && body.rows ? { orderName: body.orderName, rows: body.rows } : { error: body.error || "Couldn't check that order." };
        showReorder();
      });
    } else if (event.target.closest("[data-sl-reorder-add]")) {
      var rows = (reorder.rows || []).filter(reorderAddable);
      reorder.busy = true;
      showReorder();
      restoreAgentCartLines(rows.map(function (r) { return { variantId: r.variantId, quantity: r.quantity }; })).then(function (results) {
        var done = results.added.map(function (l) { return String(l.variantId); });
        reorder.rows.forEach(function (r) {
          if (done.indexOf(String(r.variantId)) !== -1) r.added = true;
          else if (reorderAddable(r)) { r.status = "UNAVAILABLE"; r.note = "Couldn't be added (stock?)."; r.quantity = 0; }
        });
        reorder.busy = false;
        showReorder();
        return refreshCart();
      });
    }
  });

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
    var values = readAddressFormFields(bodyEl);
    var shippingCheckbox = bodyEl.querySelector("[data-sl-set-default-shipping]");
    var billingCheckbox = bodyEl.querySelector("[data-sl-set-default-billing]");
    values.saveToBook = true;
    // Shopify only stores one default address per customer — checking
    // either box sets it, since there's no separate shipping/billing
    // default at the API level.
    values.setDefault = !!((shippingCheckbox && shippingCheckbox.checked) || (billingCheckbox && billingCheckbox.checked));
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
    return safeFetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    })
      .then(function (result) {
        if (!result.ok || !result.body || !result.body.address) {
          throw new Error((result.body && result.body.error) || i18n.addressSaveError);
        }
        addresses.push(result.body.address);
        selectedAddressId = result.body.address.id;
      });
  }

  function safeFetchJson(url, options) {
    return fetch(url, options).then(function (res) {
      return res.text().then(function (text) {
        var body = null;
        try {
          body = text ? JSON.parse(text) : null;
        } catch (e) {
          body = null;
        }
        return { ok: res.ok, status: res.status, body: body, rawText: text };
      });
    });
  }

  function saveAccountAddress(values) {
    return saveNewAddress(values).then(function () {
      if (values.setDefault) {
        defaultAddressId = addresses[addresses.length - 1].id;
      }
    });
  }

  var isFetchingPaymentTerms = false;
  function fetchPaymentTerms() {
    if (!paymentTermsProxyUrl || isFetchingPaymentTerms) return;
    isFetchingPaymentTerms = true;
    var url = paymentTermsProxyUrl;
    if (customerId) {
      url += (url.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    console.log("[SparkLayer] Fetching payment terms from url:", url, "for customerId:", customerId);
    safeFetchJson(url)
      .then(function (result) {
        isFetchingPaymentTerms = false;
        var body = result.body || {};
        console.log("[SparkLayer] Received payment terms response:", body);
        eligiblePaymentTerms = body.eligibleTerms || [];
        netTermsDueInDays = typeof body.netTermsDueInDays === "number" ? body.netTermsDueInDays : null;
        if (currentStep === 0 && activeTab === "cart") footerEl.innerHTML = renderFooterHtml();
        if (currentStep === 2) renderReviewPayStep();
        if (typeof hookDawnFooter === "function" && isNativeDawnActive()) {
          var dawn = document.querySelector("cart-drawer");
          if (dawn) hookDawnFooter(dawn);
        }
      })
      .catch(function (err) {
        isFetchingPaymentTerms = false;
        console.error("[SparkLayer] Error fetching payment terms:", err);
        eligiblePaymentTerms = [];
      });
  }

  // Checked the moment the buyer clicks Apply, rather than only surfacing an
  // invalid/used-up code later when the full checkout runs its own copy of
  // this same eligibility logic.
  function validateCouponCode(code) {
    if (!validateCouponProxyUrl) return Promise.resolve({ valid: true });
    var url = validateCouponProxyUrl;
    if (customerId) {
      url += (url.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    return safeFetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        couponCode: code,
        currency: cartData.currency || "USD",
        lineItems: (cartData.items || []).map(function (item) {
          return { variantId: item.variant_id, quantity: item.quantity };
        }),
      }),
    }).then(function (result) {
      return result.body || { valid: false, error: "Could not validate coupon code." };
    });
  }

  var isFetchingCreditInfo = false;
  function fetchCreditInfo() {
    if (!creditInfoProxyUrl || !customerId || isFetchingCreditInfo) return;
    isFetchingCreditInfo = true;
    var url = creditInfoProxyUrl + "?logged_in_customer_id=" + encodeURIComponent(customerId);
    safeFetchJson(url)
      .then(function (result) {
        isFetchingCreditInfo = false;
        var body = result.body || {};
        customerCreditLimit = typeof body.creditLimit === "number" ? body.creditLimit : null;
        customerCreditBalance = typeof body.balance === "number" ? body.balance : 0;
        customerOnAccountEnabled = !!body.onAccountEnabled;
        if (activeTab === "account" && accountView === "dashboard") {
          bodyEl.innerHTML = renderAccountDashboardBody();
        }
        if (currentStep === 2) renderReviewPayStep();
        if (typeof hookDawnFooter === "function" && isNativeDawnActive()) {
          var dawn = document.querySelector("cart-drawer");
          if (dawn) hookDawnFooter(dawn);
        }
      })
      .catch(function () {
        isFetchingCreditInfo = false;
        customerCreditLimit = null;
        customerCreditBalance = 0;
        customerOnAccountEnabled = false;
      });
  }

  var isFetchingCoupons = false;
  function fetchCouponAvailability() {
    if (!couponAvailabilityProxyUrl || isFetchingCoupons) return;
    isFetchingCoupons = true;
    safeFetchJson(couponAvailabilityProxyUrl)
      .then(function (result) {
        isFetchingCoupons = false;
        hasActiveCoupons = !!(result.body && (result.body.hasCoupons || result.body.hasActiveDiscounts));
        // Only while the cart tab is showing — the reply can arrive after the
        // shopper has already switched to My Account.
        if (currentStep === 0 && activeTab === "cart") footerEl.innerHTML = renderFooterHtml();
      })
      .catch(function () {
        isFetchingCoupons = false;
        hasActiveCoupons = false;
        if (currentStep === 0 && activeTab === "cart") footerEl.innerHTML = renderFooterHtml();
      });
  }

  // Agent Mode: when a sales agent has entered a customer context (the
  // server holds it), show who the order is for. The checkout sends this
  // context id so the server can confirm the order is for that customer.
  var originalTitle = null;
  var announcedFor = null;

  // A hidden live region: what is said here is read out by screen readers.
  function announce(text) {
    var live = root.querySelector("[data-sl-live]");
    if (!live) {
      live = document.createElement("div");
      live.className = "sl-sr-only";
      live.setAttribute("role", "status");
      live.setAttribute("aria-live", "polite");
      live.setAttribute("data-sl-live", "");
      root.appendChild(live);
    }
    live.textContent = "";
    setTimeout(function () { live.textContent = text; }, 50);
  }

  function renderAgentBanner(session) {
    var newContext = session ? session.contextId : null;
    if (!newContext) {
      orderPo = "";
      orderInternalNote = "";
      orderDeliveryDate = "";
      agentCartVersion = null;
      agentCartSavedAt = null;
      agentCartConflict = null;
    } else if (newContext !== window.sparklayerAgentContextId) {
      orderPo = "";
      orderInternalNote = "";
      orderDeliveryDate = "";
      var prevCust = window.sparklayerAgentCustomerId;
      var newCust = session && session.customer ? (session.customer.id || session.customer._id || session.customer.email) : null;
      if (prevCust && newCust && prevCust !== newCust) {
        agentCartConflict = null;
        agentCartVersion = null;
      }
      window.sparklayerAgentCustomerId = newCust;
    }
    window.sparklayerAgentContextId = newContext;

    // Page title: "Agent Mode · Karine Ruby — <store title>".
    if (originalTitle === null) originalTitle = document.title;
    var who = session && session.customer ? session.customer.company || session.customer.name : null;
    document.title = who ? "Agent Mode \u00B7 " + who + " \u2014 " + originalTitle : originalTitle;

    // Said once per change of customer, not on every redraw.
    var now = session ? session.contextId : null;
    if (announcedFor !== now) {
      if (announcedFor !== null || now !== null) {
        announce(session ? "Agent Mode. Now ordering for " + who + "." : "Agent Mode ended. You are no longer ordering for a customer.");
      }
      announcedFor = now;
    }

    if (!agentBannerEl) return;
    agentBannerEl.setAttribute("role", "region");
    agentBannerEl.setAttribute("aria-label", "Agent Mode");

    if (!session) {
      agentBannerEl.hidden = true;
      agentBannerEl.innerHTML = "";
      return;
    }

    var customer = session.customer || {};
    function agentCurrency() {
      return (cartData && cartData.currency) || (window.Shopify && window.Shopify.currency && window.Shopify.currency.active) || "";
    }
    agentBannerEl.hidden = false;
    agentBannerEl.innerHTML =
      '<span class="sl-cart-agent-label">Agent Mode</span>' +
      '<span class="sl-cart-agent-text">Ordering for: <strong>' + escapeHtml(customer.name) +
      (customer.company ? " (" + escapeHtml(customer.company) + ")" : "") +
      "</strong>" +
      (customer.code ? ' <span class="sl-cart-agent-detail">Code ' + escapeHtml(customer.code) + "</span>" : "") +
      (customer.legalEntity ? ' <span class="sl-cart-agent-detail">' + escapeHtml(customer.legalEntity) + "</span>" : "") +
      (agentCurrency() ? ' <span class="sl-cart-agent-detail">' + escapeHtml(agentCurrency()) + "</span>" : "") +
      (session.state === "STALE" ? " \u2014 your access changed" : "") + "</span>" +
      (session.state === "STALE" ? '<button type="button" class="sl-cart-agent-exit" data-sl-agent-refresh>Refresh</button>' : "") +
      '<button type="button" class="sl-cart-agent-exit" data-sl-agent-exit>Exit</button>';
  }

  // While ordering for a customer, the cart is saved on the server (per
  // customer) so it survives closing the browser, another device, or
  // switching to a different customer and back. The storefront cart stays
  // the working copy; this is its backup.
  var agentCartSaveTimer = null;

  // The version of the saved cart this browser last saw. If another device
  // saved in between, the server refuses ours and we ask the agent which to
  // keep, instead of one silently overwriting the other (spec §4.6, §12).
  var agentCartVersion = null;
  var agentCartSavedAt = null;
  var agentCartConflict = null;

  function cartDiffText(mine, theirs) {
    var m = {};
    (mine || []).forEach(function (i) { m[String(i.variantId)] = i.quantity; });
    var t = {};
    (theirs || []).forEach(function (i) { t[String(i.variantId)] = i.quantity; });

    var notes = [];
    Object.keys(t).forEach(function (id) {
      if (m[id] === undefined) notes.push("only there: item " + id + " x " + t[id]);
      else if (m[id] !== t[id]) notes.push("item " + id + ": " + m[id] + " here, " + t[id] + " there");
    });
    Object.keys(m).forEach(function (id) {
      if (t[id] === undefined) notes.push("only here: item " + id + " x " + m[id]);
    });
    return notes;
  }

  // One save at a time: a second change made while a save is on its way is
  // sent after it, with the version the first one returned. Otherwise our own
  // two saves would look like two devices.
  var agentCartInFlight = null;
  var agentCartAgain = false;

  function saveAgentCart() {
    clearTimeout(agentCartSaveTimer);
    if (!agentCartProxyUrl || !window.sparklayerAgentContextId) return Promise.resolve();
    // Nothing more is saved until the agent has chosen.
    if (agentCartConflict) return Promise.resolve();

    if (agentCartInFlight) {
      agentCartAgain = true;
      return agentCartInFlight;
    }

    agentCartInFlight = sendAgentCart().then(function () {
      agentCartInFlight = null;
      if (agentCartAgain) {
        agentCartAgain = false;
        return saveAgentCart();
      }
    });
    return agentCartInFlight;
  }

  function sendAgentCart() {

    var items = (cartData.items || []).map(function (item) {
      return { variantId: String(item.variant_id), quantity: item.quantity };
    });
    return safeFetchJson(agentCartProxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items, currency: cartData.currency || null, expectedVersion: agentCartVersion === null ? undefined : agentCartVersion }),
    })
      .then(function (result) {
        if (result.status === 409 && result.body && (result.body.conflict || result.body.code === "VERSION_CONFLICT" || result.body.items)) {
          agentCartConflict = { items: result.body.items || [], version: result.body.version, mine: items };
          renderCartLines();
          return null;
        }
        if (result.ok && result.body && result.body.version != null) {
          agentCartVersion = result.body.version;
          agentCartSavedAt = new Date();
          if (activeTab === "cart" && currentStep === 0) renderCartLines();
        }
        // A changed cart can make an earlier approval stale — look again.
        return loadAgentOverrides();
      })
      .catch(function () { });
  }

  // Which cart wins: the other device's, or this one.
  root.addEventListener("click", function (event) {
    var mine = event.target.closest("[data-sl-cart-mine]");
    var theirs = event.target.closest("[data-sl-cart-theirs]");
    if (!mine && !theirs) return;
    if (!agentCartConflict) return;

    var conflict = agentCartConflict;
    agentCartVersion = conflict.version;
    agentCartConflict = null;

    if (mine) {
      saveAgentCart().then(function () { renderCartLines(); });
      return;
    }

    safeFetchJson(agentCartProxyUrl).then(function (res) {
      var latestItems = (res.ok && res.body && res.body.items) ? res.body.items : conflict.items;
      if (res.ok && res.body && res.body.version != null) agentCartVersion = res.body.version;
      return fetch("/cart/clear.js", { method: "POST" }).catch(function () { }).then(function () {
        return restoreAgentCartLines(latestItems);
      }).then(function () {
        cartMutationVersion++;
        return refreshCart();
      }).then(function () { renderCartLines(); });
    });
  });

  function cartConflictHtml() {
    if (!agentCartConflict) return "";
    var notes = cartDiffText(agentCartConflict.mine, agentCartConflict.items);
    return (
      '<div class="sl-agent-conflict" role="alert">' +
      "<strong>This cart was changed on another device.</strong>" +
      (notes.length ? "<ul>" + notes.slice(0, 6).map(function (n) { return "<li>" + escapeHtml(n) + "</li>"; }).join("") + "</ul>" : "") +
      '<button type="button" class="sl-agent-start" data-sl-cart-theirs>Use the other cart</button> ' +
      '<button type="button" class="sl-agent-link" data-sl-cart-mine>Keep this cart</button>' +
      "</div>"
    );
  }

  window.sparklayerTestConflict = function (simulateOtherItems) {
    if (!root.classList.contains("is-open")) {
      root.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    var sampleTheirs = simulateOtherItems;
    if (!sampleTheirs) {
      if (cartData && cartData.items && cartData.items.length) {
        sampleTheirs = cartData.items.map(function (i) {
          return { variantId: String(i.variant_id), quantity: (i.quantity || 1) + 3 };
        });
      } else {
        sampleTheirs = [{ variantId: "sample_item", quantity: 5 }];
      }
    }
    var mine = (cartData && cartData.items || []).map(function (i) {
      return { variantId: String(i.variant_id), quantity: i.quantity };
    });
    agentCartConflict = { items: sampleTheirs, version: (agentCartVersion || 1) + 1, mine: mine };
    setStep(0);
    return "Conflict banner activated! Check the cart drawer on your screen.";
  };

  function cartSavedHtml() {
    if (!agentCartSavedAt || !window.sparklayerAgentContextId) return "";
    return '<p class="sl-agent-row-meta sl-agent-saved">Saved ' + escapeHtml(agentCartSavedAt.toLocaleTimeString()) + "</p>";
  }

  function scheduleAgentCartSave() {
    if (!window.sparklayerAgentContextId) return;
    clearTimeout(agentCartSaveTimer);
    agentCartSaveTimer = setTimeout(saveAgentCart, 800);
  }

  // ---- Sales agent section of the My Account tab -------------------------
  // For signed-in sales agents only (the server decides): search the
  // accounts they may act for, start an order for one, and answer the
  // authenticator-app check when their role needs it. Everything customer
  // related is decided on the server; this only draws it.

  var agentPanel = {
    isAgent: false,
    activeView: "order",
    accounts: [],
    results: null,
    query: "",
    error: "",
    notice: "",
    busy: false,
    mfa: null,
    canCreateCustomer: false,
    newCustomer: null,
    metrics: null,
    assignedCount: 0,
    pinned: [],
    recent: [],
    cartAccounts: [],
    selectedCustomerId: null,
  };

  function applyDashboard(dashboard) {
    var body = dashboard && dashboard.ok && dashboard.body ? dashboard.body : null;
    if (!body) return;

    if (body.accounts) agentPanel.accounts = body.accounts;
    agentPanel.canCreateCustomer = !!body.canCreateCustomer;
    agentPanel.metrics = body.metrics || null;
    agentPanel.assignedCount = body.assignedCount || 0;
    agentPanel.month = body.month || null;
    agentPanel.pinned = body.pinned || [];
    agentPanel.recent = body.recent || [];
    agentPanel.cartAccounts = body.cartAccounts || [];
    if (typeof offlineCacheAccounts === "function") offlineCacheAccounts();
    updateAgentPanel();
  }

  function agentSessionPost(payload) {
    return safeFetchJson(agentSessionProxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  function agentAccountRow(account) {
    var meta = [account.email, account.company, account.territory].filter(Boolean).map(escapeHtml).join(" · ");
    return (
      '<div class="sl-agent-row">' +
      '<div class="sl-agent-row-main">' +
      '<span class="sl-agent-row-name">' + escapeHtml(account.name) + "</span>" +
      '<span class="sl-agent-row-meta">' + meta + "</span>" +
      "</div>" +
      '<button type="button" class="sl-agent-pin" data-sl-pin="' + escapeHtml(account.id) + '" data-pinned="' + (account.pinned ? "1" : "0") + '" aria-pressed="' + (account.pinned ? "true" : "false") + '" aria-label="' + (account.pinned ? "Unpin " : "Pin ") + escapeHtml(account.company || account.name) + '" title="' + (account.pinned ? "Unpin" : "Pin to the top") + '">' + (account.pinned ? "\u2605" : "\u2606") + "</button>" +
      (account.status && account.status !== "active" ? '<span class="sl-agent-flag is-bad">' + (account.status === "merged" ? "Merged" : "Suspended") + "</span>" : "") +
      (account.similar ? '<span class="sl-agent-flag" title="Another account has a very similar name">Similar name</span>' : "") +
      '<button type="button" class="sl-agent-start" data-sl-agent-start="' + escapeHtml(account.id) + '"' +
      // Only the account being opened looks busy; a click on another one is ignored while it works.
      ((agentPanel.busy && String(agentPanel.busyId) === String(account.id)) || (account.status && account.status !== "active") ? " disabled" : "") + ">Start order</button>" +
      "</div>"
    );
  }

  function agentList(accounts, emptyText) {
    if (!accounts.length) return '<div class="sl-agent-empty">' + escapeHtml(emptyText) + "</div>";
    return accounts.map(agentAccountRow).join("");
  }

  function agentMfaHtml() {
    var m = agentPanel.mfa;
    if (!m) return "";

    var setup = "";
    if (!m.enrolled) {
      setup =
        "<p>Your role needs an authenticator app. Add this key to Google Authenticator, Microsoft Authenticator, 1Password or similar:</p>" +
        '<p><code class="sl-agent-secret">' + escapeHtml(m.secret || "…") + "</code></p>" +
        (m.otpauthUrl ? '<p><a href="' + escapeHtml(m.otpauthUrl) + '">Open in my authenticator app</a></p>' : "");
    }

    return (
      '<div class="sl-agent-mfa">' +
      "<strong>Verify it's you</strong>" +
      setup +
      "<p>Enter the 6-digit code from your authenticator app.</p>" +
      '<input type="text" class="sl-agent-mfa-code" data-sl-agent-mfa-code aria-label="6-digit authenticator code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456">' +
      ' <button type="button" class="sl-agent-start" data-sl-agent-mfa-submit' + (m.busy ? " disabled" : "") + ">Verify</button>" +
      ' <button type="button" class="sl-agent-link" data-sl-agent-mfa-cancel>Cancel</button>' +
      (m.error ? '<p class="sl-agent-error" role="alert">' + escapeHtml(m.error) + "</p>" : "") +
      "</div>"
    );
  }

  // ---- new customer (spec §3.4): a privileged agent adds a provisional account
  // at a trade event. The server checks the role, the authenticator step-up,
  // the mandatory fields, consent and duplicates; this only collects and sends.

  var NC_FIELDS = [
    ["companyName", "Company name *", "text"],
    ["firstName", "First name *", "text"],
    ["lastName", "Last name *", "text"],
    ["email", "Email *", "email"],
    ["phone", "Phone", "tel"],
    ["taxId", "Tax ID", "text"],
    ["legalEntity", "Legal entity", "text"],
    ["address1", "Address *", "text"],
    ["address2", "Apartment, suite", "text"],
    ["city", "City *", "text"],
    ["zip", "Postal code *", "text"],
    ["provinceCode", "State / province code", "text"],
    ["countryCode", "Country code * (e.g. US)", "text"],
  ];

  function newCustomerState() {
    return { values: {}, consent: false, marketing: false, errors: {}, message: "", duplicates: null, stepUp: false, code: "", busy: false };
  }

  function newCustomerHtml() {
    var nc = agentPanel.newCustomer;
    if (!nc) return "";

    var fields = NC_FIELDS.map(function (f) {
      var err = nc.errors[f[0]];
      return (
        '<label class="sl-nc-field"><span>' + escapeHtml(f[1]) + "</span>" +
        '<input type="' + f[2] + '" data-sl-nc-field="' + f[0] + '" value="' + escapeHtml(nc.values[f[0]] || "") + '">' +
        (err ? '<em class="sl-agent-error" role="alert">' + escapeHtml(err) + "</em>" : "") + "</label>"
      );
    }).join("");

    var dup = "";
    if (nc.duplicates) {
      dup =
        '<div class="sl-agent-mfa"><strong>Similar customers already exist</strong>' +
        nc.duplicates.map(function (d) {
          return "<p>" + escapeHtml(d.name) + " (" + escapeHtml(d.email) + ") \u2014 " + escapeHtml(d.reasons.join(", ")) + "</p>";
        }).join("") +
        '<button type="button" class="sl-agent-start" data-sl-nc-submit="confirm"' + (nc.busy ? " disabled" : "") + ">This is a different business, create anyway</button></div>";
    }

    var stepUp = "";
    if (nc.stepUp) {
      stepUp =
        '<div class="sl-agent-mfa"><strong>Confirm it\u2019s you</strong>' +
        "<p>Creating a customer needs a fresh code from your authenticator app.</p>" +
        '<input type="text" class="sl-agent-mfa-code" data-sl-nc-code aria-label="6-digit authenticator code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456" value="' + escapeHtml(nc.code) + '">' +
        ' <button type="button" class="sl-agent-start" data-sl-nc-verify' + (nc.busy ? " disabled" : "") + ">Verify and create</button></div>";
    }

    return (
      '<div class="sl-nc-form"><div class="sl-agent-list-title">New customer</div>' +
      fields +
      (nc.errors.consent ? '<em class="sl-agent-error" role="alert">' + escapeHtml(nc.errors.consent) + "</em>" : "") +
      '<label class="sl-nc-check"><input type="checkbox" data-sl-nc-consent' + (nc.consent ? " checked" : "") + "> The customer agrees to be contacted and to their details being stored. *</label>" +
      '<label class="sl-nc-check"><input type="checkbox" data-sl-nc-marketing' + (nc.marketing ? " checked" : "") + "> The customer agrees to marketing emails.</label>" +
      (nc.message ? '<p class="sl-agent-error" role="alert">' + escapeHtml(nc.message) + "</p>" : "") +
      dup + stepUp +
      '<div class="sl-nc-actions"><button type="button" class="sl-agent-start" data-sl-nc-submit="create"' + (nc.busy ? " disabled" : "") + ">Create customer</button> " +
      '<button type="button" class="sl-agent-link" data-sl-nc-cancel>Cancel</button></div>' +
      "</div>"
    );
  }

  function newCustomerPayload(nc) {
    var v = nc.values;
    return {
      companyName: v.companyName, firstName: v.firstName, lastName: v.lastName, email: v.email,
      phone: v.phone, taxId: v.taxId, legalEntity: v.legalEntity,
      consent: nc.consent, marketingConsent: nc.marketing,
      address: { address1: v.address1, address2: v.address2, city: v.city, zip: v.zip, provinceCode: v.provinceCode, countryCode: v.countryCode },
    };
  }

  function submitNewCustomer(confirm) {
    var nc = agentPanel.newCustomer;
    if (!nc || nc.busy) return;

    nc.busy = true;
    nc.message = "";
    nc.errors = {};
    updateAgentPanel();

    postJson(agentNewCustomerProxyUrl, { customer: newCustomerPayload(nc), confirmNotDuplicate: !!confirm }).then(function (result) {
      nc.busy = false;
      var body = result.body || {};

      if (result.ok) {
        agentPanel.newCustomer = null;
        agentPanel.notice = (body.company || body.name) + " was added as a provisional customer. Find them under Your accounts to start an order.";
        return safeFetchJson(agentDashboardProxyUrl).then(function (d) {
          if (d.ok && d.body && d.body.accounts) agentPanel.accounts = d.body.accounts;
          updateAgentPanel();
        });
      }

      nc.duplicates = body.code === "POSSIBLE_DUPLICATE" ? body.duplicates : null;
      nc.stepUp = body.code === "STEP_UP_REQUIRED";
      if (body.code === "VALIDATION") nc.errors = body.fields || {};
      if (body.code !== "VALIDATION" && !nc.duplicates && !nc.stepUp) nc.message = body.message || "Could not create the customer.";
      updateAgentPanel();
    });
  }

  root.addEventListener("input", function (event) {
    var nc = agentPanel.newCustomer;
    if (!nc) return;

    var field = event.target.closest && event.target.closest("[data-sl-nc-field]");
    if (field) nc.values[field.getAttribute("data-sl-nc-field")] = field.value;

    if (event.target.matches && event.target.matches("[data-sl-nc-code]")) nc.code = event.target.value;
  });

  root.addEventListener("change", function (event) {
    var nc = agentPanel.newCustomer;
    if (!nc || !event.target.matches) return;
    if (event.target.matches("[data-sl-nc-consent]")) nc.consent = event.target.checked;
    if (event.target.matches("[data-sl-nc-marketing]")) nc.marketing = event.target.checked;
  });

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-sl-nc-open]")) {
      agentPanel.newCustomer = newCustomerState();
      updateAgentPanel();
      return;
    }
    if (event.target.closest("[data-sl-nc-cancel]")) {
      agentPanel.newCustomer = null;
      updateAgentPanel();
      return;
    }

    var submit = event.target.closest("[data-sl-nc-submit]");
    if (submit) {
      submitNewCustomer(submit.getAttribute("data-sl-nc-submit") === "confirm");
      return;
    }

    if (event.target.closest("[data-sl-nc-verify]")) {
      var nc = agentPanel.newCustomer;
      var code = nc ? nc.code.split(" ").join("") : "";
      if (code.length !== 6) {
        nc.message = "Enter the 6-digit code.";
        updateAgentPanel();
        return;
      }
      nc.busy = true;
      nc.message = "";
      updateAgentPanel();
      agentSessionPost({ intent: "mfa_verify", code: code, purpose: "step_up" }).then(function (result) {
        nc.busy = false;
        if (!result.ok) {
          nc.message = "That code isn't right. Check your authenticator app and try again.";
          updateAgentPanel();
          return;
        }
        nc.stepUp = false;
        nc.code = "";
        submitNewCustomer(!!nc.duplicates);
      });
    }
  });

  // ---- the agent's alerts (spec §10.2): approvals waiting, quotes answered or
  // about to expire, the daily summary. Made on the server; this only lists them.

  var agentNotifications = { items: [], unread: 0 };

  function loadAgentNotifications() {
    if (!agentNotificationsProxyUrl) return Promise.resolve();
    return safeFetchJson(agentNotificationsProxyUrl).then(function (result) {
      var body = result.ok && result.body ? result.body : null;
      agentNotifications = { items: body && body.notifications ? body.notifications : [], unread: body ? body.unread || 0 : 0 };
      updateAgentPanel();
    });
  }

  function notificationsHtml() {
    var list = agentNotifications.items.slice(0, 6);
    if (!list.length) return "";

    var rows = list.map(function (n) {
      return (
        '<div class="sl-agent-appr' + (n.read ? "" : " is-unread") + '">' +
        '<div class="sl-agent-appr-main">' +
        (n.read ? "" : "<strong>") + escapeHtml(n.title) + (n.read ? "" : "</strong>") +
        (n.body ? '<br><span class="sl-agent-row-meta">' + escapeHtml(n.body) + "</span>" : "") +
        '<br><span class="sl-agent-row-meta">' + escapeHtml(new Date(n.createdAt).toLocaleString()) + "</span>" +
        "</div>" +
        "</div>"
      );
    }).join("");

    return (
      '<div class="sl-agent-list-title">Notifications' + (agentNotifications.unread ? " (" + agentNotifications.unread + " new)" : "") +
      (agentNotifications.unread ? ' <button type="button" class="sl-agent-link" data-sl-notif-read>Mark all as read</button>' : "") +
      '</div><div class="sl-agent-list">' + rows + "</div>"
    );
  }

  root.addEventListener("click", function (event) {
    if (!event.target.closest("[data-sl-notif-read]")) return;
    postJson(agentNotificationsProxyUrl, {}).then(loadAgentNotifications);
  });

  var agentSummary = null;
  // The customer named by the active agent session; the "Ordering for" bar has
  // it before the fuller summary arrives (or if the summary call fails).
  var agentSessionCustomer = null;

  function loadAgentSummary() {
    if (!agentSummaryProxyUrl || !window.sparklayerAgentContextId) {
      agentSummary = null;
      return Promise.resolve();
    }
    return safeFetchJson(agentSummaryProxyUrl).then(function (result) {
      agentSummary = result.ok && result.body ? result.body.summary : null;
      updateAgentPanel();
    });
  }

  function summaryHtml() {
    var s = agentSummary;
    if (!s || !window.sparklayerAgentContextId) return "";

    var terms = [];
    if (s.terms.card) terms.push("Card");
    if (s.terms.payByInvoice) terms.push("Invoice");
    if (s.terms.payOnAccount) terms.push("On account");
    if (s.terms.requestForQuote) terms.push("Request for quote");

    var rows = [
      ["Customer", escapeHtml(s.customer.company || s.customer.name) + (s.customer.provisional ? " (new, awaiting approval)" : "")],
      ["Contact", escapeHtml(s.customer.name) + " \u00b7 " + escapeHtml(s.customer.email) + (s.customer.phone ? " \u00b7 " + escapeHtml(s.customer.phone) : "")],
      ["Group", escapeHtml(s.customer.group) + (s.customer.territory ? " \u00b7 " + escapeHtml(s.customer.territory) : "")],
      ["Can pay by", escapeHtml(terms.join(", ") || "\u2014")],
      ["Credit", s.credit ? formatMoney(Math.round(s.credit.available * 100)) + " left of " + formatMoney(Math.round(s.credit.limit * 100)) : "No credit limit"],
      ["Orders", s.orders.total + " in all, " + s.orders.open + " open" + (s.orders.last ? " \u00b7 last " + escapeHtml(s.orders.last.name) + " on " + escapeHtml(new Date(s.orders.last.orderedAt).toLocaleDateString()) : "")],
      ["Quotes", s.openQuotes + " open"],
    ];
    if (s.internalNotes) rows.push(["Internal note", escapeHtml(s.internalNotes)]);

    return (
      '<div class="sl-agent-summary"><div class="sl-agent-list-title">About this customer</div><dl>' +
      rows.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("") +
      "</dl></div>"
    );
  }

  function dashboardHtml() {
    var m = agentPanel.metrics;
    if (!m) return "";

    function tile(label, value, iconSvg) {
      return (
        '<div class="sl-agent-tile">' +
        '<div class="sl-agent-tile-icon">' + iconSvg + '</div>' +
        '<div class="sl-agent-tile-info">' +
        '<strong>' + escapeHtml(value) + '</strong>' +
        '<span>' + escapeHtml(label) + '</span>' +
        '</div>' +
        '</div>'
      );
    }

    var month = agentPanel.month;
    var revenue = month && month.revenue && month.revenue.length
      ? month.revenue.map(function (r) { return formatMoney(Math.round(r.amount * 100)); }).join(" + ")
      : "$0.00";

    var iconAccounts = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>';
    var iconCart = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
    var iconQuote = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>';
    var iconApprove = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 14 14"/></svg>';
    var iconOrders = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/></svg>';
    var iconRev = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';

    return (
      '<div class="sl-agent-tiles">' +
      tile("Accounts", agentPanel.assignedCount, iconAccounts) +
      tile("Open carts", m.openCarts, iconCart) +
      tile("Quotes waiting", m.pendingQuotes, iconQuote) +
      tile("To approve", m.approvalsToDecide, iconApprove) +
      tile("Orders this month", month ? month.orders : 0, iconOrders) +
      tile("Revenue this month", revenue, iconRev) +
      '</div>'
    );
  }

  function accountListHtml(title, list) {
    if (!list || !list.length) return "";
    return '<div class="sl-agent-list-title">' + escapeHtml(title) + '</div><div class="sl-agent-list">' + list.map(agentAccountRow).join("") + "</div>";
  }

  function customerDropdownHtml() {
    var allAccounts = agentPanel.accounts || [];
    var pinned = (agentPanel.pinned || []).map(function (p) { return typeof p === "object" ? p : findAccount(p); }).filter(Boolean);
    var selectedId = agentPanel.selectedCustomerId ? String(agentPanel.selectedCustomerId) : "";

    var optionsHtml = "";
    if (allAccounts.length === 0) {
      optionsHtml = '<option value="" disabled>No customer accounts available</option>';
    } else {
      if (pinned.length > 0) {
        optionsHtml += '<optgroup label="Pinned Customers">';
        pinned.forEach(function (acc) {
          var label = acc.name + (acc.company ? " - " + acc.company : "") + (acc.email ? " (" + acc.email + ")" : "");
          var isSelected = String(acc.id) === selectedId ? " selected" : "";
          var isDisabled = acc.status && acc.status !== "active" ? " disabled" : "";
          optionsHtml += '<option value="' + escapeHtml(acc.id) + '"' + isSelected + isDisabled + '>★ ' + escapeHtml(label) + (isDisabled ? " [" + acc.status + "]" : "") + '</option>';
        });
        optionsHtml += '</optgroup>';
      }

      optionsHtml += '<optgroup label="Customers">';
      allAccounts.forEach(function (acc) {
        var label = acc.name + (acc.company ? " - " + acc.company : "") + (acc.email ? " (" + acc.email + ")" : "");
        var isSelected = String(acc.id) === selectedId ? " selected" : "";
        var isDisabled = acc.status && acc.status !== "active" ? " disabled" : "";
        optionsHtml += '<option value="' + escapeHtml(acc.id) + '"' + isSelected + isDisabled + '>' + escapeHtml(label) + (isDisabled ? " [" + acc.status + "]" : "") + '</option>';
      });
      optionsHtml += '</optgroup>';
    }

    return (
      '<div class="sl-agent-dropdown-box" style="border-radius:0!important;">' +
      '<div class="sl-agent-dropdown-title">' +
      '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:6px;vertical-align:-2px;"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
      '<span>Select Customer to Start Order</span>' +
      '</div>' +
      '<div class="sl-agent-dropdown-row">' +
      '<div class="sl-agent-select-wrap" style="border-radius:0!important;">' +
      '<select class="sl-agent-select" data-sl-customer-select aria-label="Select Customer" style="border-radius:0!important;border:1px solid #334155!important;outline:none!important;box-shadow:none!important;-webkit-box-shadow:none!important;">' +
      '<option value="">Select your Customer</option>' +
      optionsHtml +
      '</select>' +
      '<div class="sl-agent-select-chevron" aria-hidden="true">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="6 9 12 15 18 9"/></svg>' +
      '</div>' +
      '</div>' +
      '<button type="button" class="sl-agent-start-action-btn" data-sl-dropdown-start style="border-radius:0!important;"' + (!agentPanel.selectedCustomerId || agentPanel.busy ? " disabled" : "") + ' title="' + (agentPanel.selectedCustomerId ? 'Start order for selected customer' : 'Select a customer from dropdown first') + '">' +
      '<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none" style="margin-right:5px;vertical-align:-1px;"><polygon points="5 3 19 12 5 21 5 3"/></svg>' +
      'Start Order' +
      '</button>' +
      '</div>' +
      '</div>'
    );
  }

  // Quick actions (spec §4.2). Scanning and quotes work on a customer's cart,
  // so without an order started they say what to do first.
  root.addEventListener("click", function (event) {
    var quick = event.target.closest("[data-sl-quick]");
    if (!quick) return;

    var action = quick.getAttribute("data-sl-quick");
    agentPanel.error = "";
    agentPanel.notice = "";

    if (action === "resume") {
      var first = agentPanel.cartAccounts[0];
      if (first) startAgentOrder(first);
      return;
    }

    if (!window.sparklayerAgentContextId) {
      agentPanel.notice = action === "scan"
        ? "Start an order for a customer first, then scan barcodes into their cart."
        : "Start an order for a customer first. Then use Save as quote under their cart.";
      updateAgentPanel();
      return;
    }

    setStep(0);
    if (action === "scan") {
      qo.scan = true;
      qo.scanMessage = "";
      renderQuickOrder();
    } else {
      var save = bodyEl.querySelector("[data-sl-quote-create]") || footerEl.querySelector("[data-sl-quote-create]");
      if (save) save.click();
    }
  });

  root.addEventListener("click", function (event) {
    var viewBtn = event.target.closest("[data-sl-agent-view]");
    if (viewBtn) {
      agentPanel.activeView = viewBtn.getAttribute("data-sl-agent-view");
      updateAgentPanel();
      return;
    }

    var exitBtn = event.target.closest("[data-sl-agent-exit]");
    if (exitBtn) {
      var contextId = window.sparklayerAgentContextId;
      var saved = contextId ? saveAgentCart() : Promise.resolve();
      renderAgentBanner(null);
      syncAgentAddresses(false);
      if (contextId) {
        saved
          .then(function () {
            return safeFetchJson(agentSessionProxyUrl, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ intent: "exit", contextId: contextId }),
            });
          })
          .then(function () {
            return fetch("/cart/clear.js", { method: "POST" }).catch(function () { });
          })
          .then(function () {
            cartMutationVersion++;
            setStep(0);
            updateAgentPanel();
            return refreshCart();
          });
      } else {
        updateAgentPanel();
      }
      return;
    }

    var subtab = event.target.closest("[data-sl-acc-subtab]");
    if (subtab) {
      agentAccountSubTab = subtab.getAttribute("data-sl-acc-subtab");
      if (activeTab === "account" && accountView === "dashboard") {
        bodyEl.innerHTML = renderAccountDashboardBody();
      }
      return;
    }

    var pin = event.target.closest("[data-sl-pin]");
    if (!pin) return;

    var next = pin.getAttribute("data-pinned") !== "1";
    postJson(agentPinsProxyUrl, { customerId: pin.getAttribute("data-sl-pin"), pinned: next }).then(function (result) {
      if (!result.ok) {
        agentPanel.error = (result.body && result.body.message) || "Couldn't change the pin.";
        updateAgentPanel();
        return;
      }
      return safeFetchJson(agentDashboardProxyUrl).then(applyDashboard);
    });
  });

  function agentPanelInner() {
    var activeView = agentPanel.activeView || "order";
    var m = agentPanel.metrics || {};
    var pendingCount = (m.approvalsToDecide || 0) + (m.pendingQuotes || 0) + (agentNotifications.unread || 0);

    // Segmented View Switcher
    var switchHtml =
      '<div class="sl-agent-view-switch">' +
      '<button type="button" class="sl-agent-view-btn' + (activeView === "order" ? " is-active" : "") + '" data-sl-agent-view="order">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
      '<span>Order for Customer</span>' +
      '</button>' +
      '<button type="button" class="sl-agent-view-btn' + (activeView === "overview" ? " is-active" : "") + '" data-sl-agent-view="overview">' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>' +
      '<span>Dashboard & Tasks</span>' +
      (pendingCount > 0 ? ' <span class="sl-agent-view-badge">' + pendingCount + '</span>' : '') +
      '</button>' +
      '</div>';

    var html = switchHtml;

    // Security / MFA (always top priority)
    html += agentMfaHtml();

    // Alert Messages
    if (agentPanel.error) {
      html += '<div class="sl-agent-alert is-error" role="alert">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>' +
        '<span>' + escapeHtml(agentPanel.error) + '</span>' +
        '</div>';
    }
    if (agentPanel.notice) {
      html += '<div class="sl-agent-alert is-info">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>' +
        '<span>' + escapeHtml(agentPanel.notice) + '</span>' +
        '</div>';
    }

    if (activeView === "overview") {
      html +=
        '<div class="sl-agent-order-header">' +
        '<div>' +
        '<h3 class="sl-agent-order-title">Agent Overview</h3>' +
        '<p class="sl-agent-order-sub">Performance metrics and pending approvals</p>' +
        '</div>' +
        '</div>' +
        dashboardHtml() +
        agentApprovalsHtml() +
        quoteApprovalsHtml() +
        agentQuotesHtml() +
        paymentLinksHtml() +
        notificationsHtml();
      return html;
    }

    // --- Order for Customer View ---
    if (window.sparklayerAgentContextId) {
      var cust = (agentSummary && agentSummary.customer) || agentSessionCustomer || {};
      var custTitle = cust.company || cust.name || "Customer Session Active";
      var custSubtitle = [cust.name, cust.email, cust.group].filter(Boolean).join(" · ");

      html +=
        '<div class="sl-agent-active-card">' +
        '<div class="sl-agent-active-top">' +
        '<div class="sl-agent-active-badge"><span class="sl-agent-live-dot"></span> Active Ordering Session</div>' +
        '<button type="button" class="sl-agent-exit-btn" data-sl-agent-exit>Exit Session</button>' +
        '</div>' +
        '<div class="sl-agent-active-details">' +
        '<span class="sl-agent-active-avatar" aria-hidden="true">' +
        escapeHtml(custTitle.split(/\s+/).slice(0, 2).map(function (w) { return w.charAt(0); }).join("").toUpperCase()) +
        '</span>' +
        '<div class="sl-agent-active-text">' +
        '<h4 class="sl-agent-active-name">' + escapeHtml(custTitle) + '</h4>' +
        (custSubtitle ? '<p class="sl-agent-active-meta">' + escapeHtml(custSubtitle) + '</p>' : '') +
        '</div>' +
        '</div>' +
        '<div class="sl-agent-active-actions">' +
        '<button type="button" class="sl-agent-btn-primary" data-sl-tab="cart">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>' +
        '<span>Go to Cart</span>' +
        '</button>' +
        '<button type="button" class="sl-agent-btn-secondary" data-sl-quick="scan">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>' +
        '<span>Scan Barcode</span>' +
        '</button>' +
        '<button type="button" class="sl-agent-btn-secondary" data-sl-quick="quote">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>' +
        '<span>Create Quote</span>' +
        '</button>' +
        '</div>' +
        '</div>' +
        summaryHtml();

      return html;
    }

    // No customer selected yet -> search & select customer
    html +=
      '<div class="sl-agent-order-header">' +
      '<div class="sl-agent-order-header-text">' +
      '<h3 class="sl-agent-order-title">Select Customer</h3>' +
      '<p class="sl-agent-order-sub">Choose an account to start an order</p>' +
      '</div>' +
      (agentPanel.canCreateCustomer
        ? '<button type="button" class="sl-agent-nc-btn" data-sl-nc-open>' +
        '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="margin-right:5px;vertical-align:-1px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>' +
        'New Customer' +
        '</button>'
        : '') +
      '</div>';

    // If an open cart is available to resume
    if (agentPanel.cartAccounts && agentPanel.cartAccounts.length) {
      html +=
        '<div class="sl-agent-resume-banner">' +
        '<div class="sl-agent-resume-info">' +
        '<strong>Unfinished Cart</strong>' +
        '<span>You have ' + agentPanel.cartAccounts.length + ' open customer cart(s)</span>' +
        '</div>' +
        '<button type="button" class="sl-agent-btn-primary sl-agent-btn-sm" data-sl-quick="resume">Resume Cart</button>' +
        '</div>';
    }

    // New Customer Inline Form (when opened)
    html += newCustomerHtml();

    // Customer Dropdown to Start Order
    html += customerDropdownHtml();

    return html;
  }

  // ---- Phase 4: delegation, temporary access and offline capture ------------
  // Delegation: an agent hands their approvals (and, if they choose, access to
  // their customers) to a colleague for a while. The server decides everything;
  // this only shows and sends clicks.
  // Offline capture: while the connection is down the agent can note what a
  // customer wants. It is kept on this device and sent when the connection is
  // back; nothing is priced or ordered until the agent opens it again.

  var delegationState = { loaded: false, list: [], agents: [], form: null, error: "" };
  var offlineState = { enabled: false, days: 7, loaded: false, queue: [], server: [], form: null, error: "", message: "", syncing: false, activeCaptureId: null };

  function p4Key(name) { return name + ":" + (customerId || "x"); }
  function p4Get(name, fallback) {
    try { var v = localStorage.getItem(p4Key(name)); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function p4Set(name, value) { try { localStorage.setItem(p4Key(name), JSON.stringify(value)); } catch (e) { } }
  function p4Del(name) { try { localStorage.removeItem(p4Key(name)); } catch (e) { } }

  function p4Date(iso) {
    var d = new Date(iso);
    return isNaN(d.getTime()) ? "" : d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }

  // ---- delegation

  function loadDelegations() {
    return Promise.resolve();
  }

  function delegationRowHtml(d) {
    var given = d.direction === "given";
    var who = given ? "To " + escapeHtml(d.delegate.name) : "From " + escapeHtml(d.delegator.name);
    var meta = (d.status === "scheduled" ? "Starts " + p4Date(d.startsAt) + " · " : "") + "until " + p4Date(d.endsAt) +
      (d.coverAccess ? " · with access to their customers" : "") + (d.includeQuotes ? "" : " · exceptions only");
    return (
      '<div class="sl-agent-appr">' +
      '<div class="sl-agent-appr-main"><strong>' + who + "</strong>" +
      '<br><span class="sl-agent-row-meta">' + meta + " · " + escapeHtml(d.reason || "") + "</span></div>" +
      '<div class="sl-agent-appr-buttons"><button type="button" class="sl-agent-link" data-sl-deleg-end="' + escapeHtml(d.id) + '">' + (given ? "End" : "Hand back") + "</button></div>" +
      "</div>"
    );
  }

  function delegationFormHtml() {
    var f = delegationState.form;
    var tomorrow = new Date(Date.now() + 24 * 3600 * 1000).toISOString().slice(0, 10);
    return (
      '<div class="sl-nc-form">' +
      '<label class="sl-nc-field"><span>Delegate to</span><select data-sl-deleg-field="delegateId">' +
      '<option value="">Choose a colleague</option>' +
      delegationState.agents.map(function (a) { return '<option value="' + escapeHtml(a.id) + '"' + (f.delegateId === a.id ? " selected" : "") + ">" + escapeHtml(a.name) + "</option>"; }).join("") +
      "</select></label>" +
      '<label class="sl-nc-field"><span>Until (end of day)</span><input type="date" data-sl-deleg-field="until" min="' + tomorrow.slice(0, 10) + '" value="' + escapeHtml(f.until || "") + '"></label>' +
      '<label class="sl-nc-field"><span>Reason</span><input type="text" maxlength="300" data-sl-deleg-field="reason" value="' + escapeHtml(f.reason || "") + '" placeholder="For example: on holiday"></label>' +
      '<label class="sl-nc-check"><input type="checkbox" data-sl-deleg-field="includeQuotes"' + (f.includeQuotes !== false ? " checked" : "") + "> Include quote approvals</label>" +
      '<label class="sl-nc-check"><input type="checkbox" data-sl-deleg-field="coverAccess"' + (f.coverAccess ? " checked" : "") + "> Also give access to my customers</label>" +
      (delegationState.error ? '<p class="sl-agent-error" role="alert">' + escapeHtml(delegationState.error) + "</p>" : "") +
      '<div class="sl-nc-actions"><button type="button" class="sl-agent-start" data-sl-deleg-save' + (f.busy ? " disabled" : "") + ">Delegate</button> " +
      '<button type="button" class="sl-agent-link" data-sl-deleg-cancel>Cancel</button></div>' +
      "</div>"
    );
  }

  function delegationsHtml() {
    return "";
  }

  function submitDelegation() {
    var f = delegationState.form;
    if (!f || f.busy) return;
    if (!f.delegateId || !f.until || !String(f.reason || "").trim()) {
      delegationState.error = "Choose a colleague, an end date and a reason.";
      updateAgentPanel();
      return;
    }

    f.busy = true;
    delegationState.error = "";
    updateAgentPanel();

    var endsAt = new Date(f.until + "T23:59:00");
    safeFetchJson(agentDelegationsProxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "create", delegateId: f.delegateId, endsAt: endsAt.toISOString(), reason: f.reason, coverAccess: !!f.coverAccess, includeQuotes: f.includeQuotes !== false }),
    }).then(function (result) {
      if (result.ok) {
        delegationState.form = null;
        return loadDelegations();
      }
      f.busy = false;
      delegationState.error = (result.body && result.body.message) || "Could not delegate. Try again.";
    }).catch(function () {
      f.busy = false;
      delegationState.error = "No connection. Try again when you are online.";
    }).then(function () { updateAgentPanel(); });
  }

  // ---- offline capture

  function offlineQueue() { return p4Get("slOfflineQueue", []); }
  function saveOfflineQueue(queue) { offlineState.queue = queue; p4Set("slOfflineQueue", queue); }

  // The account names kept for use without a connection: names only, for the
  // number of days the merchant allows, and removed when the agent logs out.
  function offlineCacheAccounts() {
    if (!offlineState.enabled) return;
    var seen = {};
    var list = [];
    (agentPanel.accounts || []).concat(agentPanel.pinned || [], agentPanel.recent || []).forEach(function (a) {
      if (!a || seen[a.id] || (a.status && a.status !== "active")) return;
      seen[a.id] = true;
      list.push({ id: String(a.id), name: a.company || a.name });
    });
    if (list.length) p4Set("slOfflineAccounts", { at: Date.now(), accounts: list.slice(0, 300) });
  }

  function offlineAccounts() {
    var live = [];
    var seen = {};
    (agentPanel.accounts || []).forEach(function (a) {
      if (a && !seen[a.id] && (!a.status || a.status === "active")) { seen[a.id] = true; live.push({ id: String(a.id), name: a.company || a.name }); }
    });
    if (live.length) return live;

    var cached = p4Get("slOfflineAccounts", null);
    var maxAge = offlineState.days * 24 * 3600 * 1000;
    return cached && Date.now() - cached.at < maxAge ? cached.accounts : [];
  }

  function clearOfflineData() {
    p4Del("slOfflineAccounts");
    p4Del("slOfflineQueue");
    p4Del("slOfflineEnabled");
  }

  function loadOfflineState() {
    offlineState.queue = offlineQueue();
    var remembered = p4Get("slOfflineEnabled", null);
    if (remembered) { offlineState.enabled = !!remembered.enabled; offlineState.days = remembered.days || 7; }

    if (!agentOfflineProxyUrl) return Promise.resolve();
    var offlineUrl = agentOfflineProxyUrl;
    if (customerId) {
      offlineUrl += (offlineUrl.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    return safeFetchJson(offlineUrl).then(function (result) {
      if (!(result.ok && result.body)) return;
      offlineState.enabled = !!result.body.enabled;
      offlineState.server = result.body.captures || [];
      offlineState.loaded = true;
      if (offlineState.enabled) p4Set("slOfflineEnabled", { enabled: true, days: offlineState.days });
      else clearOfflineData();
      offlineCacheAccounts();
      return syncOfflineQueue();
    }).catch(function () { });
  }

  // Sends what was saved while offline. A capture that was received, or was
  // already received, leaves the device; one the server refused stays, with the reason.
  function syncOfflineQueue() {
    var queue = offlineQueue().filter(function (c) { return !c.error; });
    if (!queue.length || offlineState.syncing || !agentOfflineProxyUrl || navigator.onLine === false) return Promise.resolve();

    var offlineUrl = agentOfflineProxyUrl;
    if (customerId) {
      offlineUrl += (offlineUrl.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
    }

    offlineState.syncing = true;
    return safeFetchJson(offlineUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "send", captures: queue }),
    }).then(function (result) {
      offlineState.syncing = false;
      if (!(result.ok && result.body && result.body.results)) {
        if (result.body && result.body.code === "OFFLINE_DISABLED") { clearOfflineData(); offlineState.enabled = false; offlineState.queue = []; }
        return;
      }

      var byId = {};
      result.body.results.forEach(function (r) { byId[r.clientId] = r; });
      var next = offlineQueue().filter(function (c) {
        var r = byId[c.clientId];
        if (!r) return true;
        if (r.status === "rejected") { c.error = r.message || "Refused"; return true; }
        return false;
      });
      saveOfflineQueue(next);
      offlineState.message = result.body.results.some(function (r) { return r.status === "accepted"; }) ? "Sent. Open it below when you are ready." : "";
      return safeFetchJson(offlineUrl).then(function (again) {
        if (again.ok && again.body) offlineState.server = again.body.captures || [];
      });
    }).catch(function () {
      offlineState.syncing = false;
    }).then(function () { updateAgentPanel(); });
  }

  function parseOfflineLines(text) {
    var lines = [];
    String(text || "").split(/\r?\n/).forEach(function (row) {
      var raw = row.trim();
      if (!raw) return;
      var m = raw.match(/^(.+?)[\s,;x×]+(\d{1,6})$/i);
      var code = m ? m[1].trim() : raw;
      var qty = m ? parseInt(m[2], 10) : 1;
      if (!code) return;
      lines.push({ sku: code, quantity: qty > 0 ? qty : 1 });
    });
    return lines.slice(0, 100);
  }

  function saveOfflineCapture() {
    var f = offlineState.form;
    if (!f) return;
    var lines = parseOfflineLines(f.text);
    if (!f.customerId || !lines.length) {
      offlineState.error = "Choose a customer and write at least one item, one per line, like: B-1, 3";
      updateAgentPanel();
      return;
    }

    var account = offlineAccounts().filter(function (a) { return a.id === f.customerId; })[0];
    var id = "dev-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
    saveOfflineQueue(offlineQueue().concat([{
      clientId: id,
      customerId: f.customerId,
      customerName: account ? account.name : "",
      capturedAt: new Date().toISOString(),
      lines: lines,
      note: f.note || "",
      po: f.po || "",
    }]));
    offlineState.form = null;
    offlineState.error = "";
    offlineState.message = navigator.onLine === false ? "Saved on this device. It will be sent when you are back online." : "Saved.";
    updateAgentPanel();
    syncOfflineQueue();
  }

  function offlineHtml() {
    return ""; // Temporarily removed for now
    if (!offlineState.enabled) return "";
    var offline = navigator.onLine === false;
    var queue = offlineQueue();

    var html = '<div class="sl-agent-list-title">Offline capture</div>' +
      '<p class="sl-agent-hint">' + (offline
        ? "No connection. What you capture stays on this device and is sent when you are back online."
        : "Note what a customer wants even when the signal drops. You review it before anything is ordered.") + "</p>";

    if (offlineState.message) html += '<p class="sl-agent-hint" role="status">' + escapeHtml(offlineState.message) + "</p>";

    if (queue.length) {
      html += '<div class="sl-agent-list-title">On this device</div><div class="sl-agent-list">' + queue.map(function (c) {
        return '<div class="sl-agent-appr"><div class="sl-agent-appr-main"><strong>' + escapeHtml(c.customerName || "Customer") + "</strong> · " + c.lines.length + (c.lines.length === 1 ? " item" : " items") +
          '<br><span class="sl-agent-row-meta">' + (c.error ? escapeHtml(c.error) : "Waiting for a connection") + "</span></div>" +
          '<div class="sl-agent-appr-buttons"><button type="button" class="sl-agent-link" data-sl-offline-drop="' + escapeHtml(c.clientId) + '">Discard</button></div></div>';
      }).join("") + "</div>";
    }

    if (offlineState.server.length) {
      html += '<div class="sl-agent-list-title">Captured, waiting for you</div><div class="sl-agent-list">' + offlineState.server.map(function (c) {
        return '<div class="sl-agent-appr"><div class="sl-agent-appr-main"><strong>' + escapeHtml(c.customerName) + "</strong> · " + c.lines.length + (c.lines.length === 1 ? " item" : " items") +
          '<br><span class="sl-agent-row-meta">Captured ' + p4Date(c.capturedAt) + (c.po ? " · PO " + escapeHtml(c.po) : "") + "</span></div>" +
          '<div class="sl-agent-appr-buttons"><button type="button" class="sl-agent-start" data-sl-offline-review="' + escapeHtml(c.id) + '"' + (agentPanel.busy ? " disabled" : "") + '>Review</button> ' +
          '<button type="button" class="sl-agent-link" data-sl-offline-discard="' + escapeHtml(c.id) + '">Discard</button></div></div>';
      }).join("") + "</div>";
    }

    if (offlineState.form) {
      var f = offlineState.form;
      var accounts = offlineAccounts();
      html += '<div class="sl-nc-form">' +
        '<label class="sl-nc-field"><span>Customer</span><select data-sl-offline-field="customerId">' +
        '<option value="">Choose a customer</option>' +
        accounts.map(function (a) { return '<option value="' + escapeHtml(a.id) + '"' + (f.customerId === a.id ? " selected" : "") + ">" + escapeHtml(a.name) + "</option>"; }).join("") +
        "</select></label>" +
        '<label class="sl-nc-field"><span>Items: a SKU or barcode and a quantity, one per line</span><textarea rows="4" data-sl-offline-field="text" placeholder="B-1, 3&#10;5901234123457, 1">' + escapeHtml(f.text || "") + "</textarea></label>" +
        '<label class="sl-nc-field"><span>PO reference (optional)</span><input type="text" maxlength="64" data-sl-offline-field="po" value="' + escapeHtml(f.po || "") + '"></label>' +
        '<label class="sl-nc-field"><span>Note (optional)</span><input type="text" maxlength="500" data-sl-offline-field="note" value="' + escapeHtml(f.note || "") + '"></label>' +
        (offlineState.error ? '<p class="sl-agent-error" role="alert">' + escapeHtml(offlineState.error) + "</p>" : "") +
        '<div class="sl-nc-actions"><button type="button" class="sl-agent-start" data-sl-offline-save>Save</button> <button type="button" class="sl-agent-link" data-sl-offline-cancel>Cancel</button></div></div>';
    } else {
      html += '<div class="sl-nc-actions"><button type="button" class="sl-agent-link" data-sl-offline-open>Capture what a customer wants…</button></div>';
    }
    return html;
  }

  // Opens a captured list: starts the order for that customer and puts the
  // items in the quick-order check, so today's price, stock and access are
  // checked before anything reaches the cart.
  function reviewOfflineCapture(id) {
    var capture = offlineState.server.filter(function (c) { return c.id === id; })[0];
    if (!capture) return;

    startAgentOrder(capture.customerId).then(function () {
      if (!window.sparklayerAgentContextId) return;
      offlineState.activeCaptureId = capture.id;
      qo.text = capture.lines.map(function (l) { return (l.sku || l.barcode || l.variantId) + ", " + l.quantity; }).join("\n");
      qo.rows = null;
      qo.open = true;
      qo.message = "";
      activeTab = "cart";
      renderQuickOrder();
      var check = bodyEl.querySelector("[data-sl-qo-check]");
      if (check) check.click();
    });
  }

  function finishOfflineCapture(outcome, id) {
    if (!id || !agentOfflineProxyUrl) return Promise.resolve();
    var offlineUrl = agentOfflineProxyUrl;
    if (customerId) {
      offlineUrl += (offlineUrl.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    return safeFetchJson(offlineUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ intent: "resolve", id: id, outcome: outcome }),
    }).then(function () {
      offlineState.server = offlineState.server.filter(function (c) { return c.id !== id; });
      updateAgentPanel();
    }).catch(function () { });
  }

  root.addEventListener("click", function (event) {
    var t = event.target;
    var el;

    if ((el = t.closest("[data-sl-deleg-open]"))) {
      delegationState.form = { includeQuotes: true, coverAccess: false };
      delegationState.error = "";
      updateAgentPanel();
    } else if (t.closest("[data-sl-deleg-cancel]")) {
      delegationState.form = null;
      delegationState.error = "";
      updateAgentPanel();
    } else if (t.closest("[data-sl-deleg-save]")) {
      submitDelegation();
    } else if ((el = t.closest("[data-sl-deleg-end]"))) {
      safeFetchJson(agentDelegationsProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "revoke", id: el.getAttribute("data-sl-deleg-end") }),
      }).then(loadDelegations).catch(function () { }).then(function () { updateAgentPanel(); });
    } else if (t.closest("[data-sl-offline-open]")) {
      offlineState.form = { customerId: "", text: "", note: "", po: "" };
      offlineState.error = "";
      offlineState.message = "";
      updateAgentPanel();
    } else if (t.closest("[data-sl-offline-cancel]")) {
      offlineState.form = null;
      offlineState.error = "";
      updateAgentPanel();
    } else if (t.closest("[data-sl-offline-save]")) {
      saveOfflineCapture();
    } else if ((el = t.closest("[data-sl-offline-drop]"))) {
      var gone = el.getAttribute("data-sl-offline-drop");
      saveOfflineQueue(offlineQueue().filter(function (c) { return c.clientId !== gone; }));
      updateAgentPanel();
    } else if ((el = t.closest("[data-sl-offline-review]"))) {
      reviewOfflineCapture(el.getAttribute("data-sl-offline-review"));
    } else if ((el = t.closest("[data-sl-offline-discard]"))) {
      finishOfflineCapture("DISCARDED", el.getAttribute("data-sl-offline-discard"));
    } else if (t.closest("[data-sl-qo-add]") && offlineState.activeCaptureId) {
      // The agent has added the checked items: the captured list is done.
      var doneId = offlineState.activeCaptureId;
      offlineState.activeCaptureId = null;
      finishOfflineCapture("ADDED", doneId);
    } else if (t.closest(".sl-cart-usermenu-logout")) {
      clearOfflineData();
    }
  });

  // What is typed is kept in state, not the page, so a redraw doesn't wipe it.
  function p4Input(event) {
    var el = event.target;
    var key = el.getAttribute && el.getAttribute("data-sl-deleg-field");
    if (key && delegationState.form) {
      delegationState.form[key] = el.type === "checkbox" ? el.checked : el.value;
      return;
    }
    key = el.getAttribute && el.getAttribute("data-sl-offline-field");
    if (key && offlineState.form) offlineState.form[key] = el.value;
  }
  root.addEventListener("input", p4Input);
  root.addEventListener("change", p4Input);

  window.addEventListener("online", function () {
    offlineState.message = "";
    syncOfflineQueue();
  });
  window.addEventListener("offline", function () {
    if (offlineState.enabled) updateAgentPanel();
  });

  function agentPanelHtml() {
    if (!agentPanel.isAgent) return "";
    return '<div class="sl-agent-panel" data-sl-agent-panel>' + agentPanelInner() + "</div>";
  }

  // Redraws only the agent section, keeping what was typed in the search box.
  function updateAgentPanel() {
    var panel = bodyEl.querySelector("[data-sl-agent-panel]");
    if (!panel) return;

    var search = panel.querySelector("[data-sl-agent-search]");
    var typed = search ? search.value : agentPanel.query;
    var searchHadFocus = search && document.activeElement === search;

    panel.innerHTML = agentPanelInner();

    var newSearch = panel.querySelector("[data-sl-agent-search]");
    if (newSearch) {
      newSearch.value = typed;
      if (searchHadFocus) newSearch.focus();
    }

    var code = panel.querySelector("[data-sl-agent-mfa-code]");
    if (code && agentPanel.mfa) {
      code.value = agentPanel.mfa.code || "";
      if (agentPanel.mfa.focus) {
        code.focus();
        agentPanel.mfa.focus = false;
      }
    }
  }

  function loadAgentPanel() {
    if (!agentContextProxyUrl || !agentDashboardProxyUrl || !hasCustomer) return Promise.resolve();

    return safeFetchJson(agentContextProxyUrl).then(function (context) {
      if (!(context.ok && context.body && context.body.isAgent)) return null;

      agentPanel.isAgent = true;
      // The menu says "Sales agent" instead of "B2B Account".
      if (typeof tabsEl !== "undefined" && tabsEl) tabsEl.innerHTML = renderTabsHtml();
      renderQuickOrder();
      return safeFetchJson(agentDashboardProxyUrl).then(function (dashboard) {
        applyDashboard(dashboard);

        // Draw it if the My Account tab is already showing.
        if (activeTab === "account" && accountView === "dashboard") {
          bodyEl.innerHTML = renderAccountDashboardBody();
        }

        return Promise.all([loadAgentApprovals(), loadQuoteApprovals(), loadAgentQuotes(), loadPaymentLinks(), loadAgentNotifications(), loadDelegations(), loadOfflineState()]).then(function () {
          return checkAgentMfaSetup();
        });
      });
    });
  }

  // Adds lines one at a time so one sold-out item doesn't block the rest.
  function restoreAgentCartLines(lines) {
    var results = { added: [], failed: [] };
    var chain = Promise.resolve();

    lines.forEach(function (line) {
      chain = chain.then(function () {
        return fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Number(line.variantId), quantity: line.quantity }),
        })
          .then(function (res) { (res.ok ? results.added : results.failed).push(line); })
          .catch(function () { results.failed.push(line); });
      });
    });

    return chain.then(function () { return results; });
  }

  // Onboarding (spec §3.1): a role that requires MFA is activated by setting up
  // the authenticator, so it is offered as soon as the agent section opens.
  var agentMfaSetupChecked = false;

  function checkAgentMfaSetup() {
    if (agentMfaSetupChecked || agentPanel.mfa) return Promise.resolve();
    agentMfaSetupChecked = true;

    return agentSessionPost({ intent: "mfa_status" }).then(function (status) {
      var s = status.body || {};
      if (s.required && !s.enrolled) return beginAgentMfa(null, s);
    });
  }

  // Asked first, so nothing is touched if an authenticator code is still needed.
  function findAccount(customerId) {
    var all = (agentPanel.accounts || []).concat(agentPanel.results || []);
    return all.filter(function (a) { return String(a.id) === String(customerId); })[0] || null;
  }

  function startAgentOrder(customerId) {
    agentPanel.busy = true;
    agentPanel.busyId = customerId;
    agentPanel.error = "";
    agentPanel.notice = "";
    updateAgentPanel();

    return agentSessionPost({ intent: "mfa_status" }).then(function (status) {
      var s = status.body || {};
      if (s.required && !s.verified) {
        agentPanel.busy = false;
        return beginAgentMfa(customerId, s);
      }
      return proceedAgentOrder(customerId);
    });
  }

  function beginAgentMfa(customerId, status) {
    agentPanel.mfa = { customerId: customerId, enrolled: !!status.enrolled, code: "", error: "", focus: true };
    updateAgentPanel();

    if (status.enrolled) return Promise.resolve();

    return agentSessionPost({ intent: "mfa_enroll" }).then(function (result) {
      if (result.ok && result.body) {
        agentPanel.mfa.secret = result.body.secret;
        agentPanel.mfa.otpauthUrl = result.body.otpauthUrl;
      } else {
        agentPanel.mfa.error = "Could not start the setup. Please try again.";
      }
      updateAgentPanel();
    });
  }

  function submitAgentMfa() {
    var m = agentPanel.mfa;
    if (!m || m.busy) return;

    var code = (m.code || "").split(" ").join("");
    if (code.length !== 6) {
      m.error = "Enter the 6-digit code.";
      updateAgentPanel();
      return;
    }

    m.busy = true;
    m.error = "";
    updateAgentPanel();

    agentSessionPost({ intent: "mfa_verify", code: code }).then(function (result) {
      if (result.ok) {
        var customerId = m.customerId;
        agentPanel.mfa = null;
        if (customerId) {
          proceedAgentOrder(customerId);
        } else {
          // Set-up on arrival (no order was being started): access is now active.
          agentPanel.notice = "Two-step verification is set up. Your access is active.";
          updateAgentPanel();
        }
        return;
      }

      var reason = result.body && result.body.code;
      m.busy = false;
      m.code = "";
      m.focus = true;
      m.error = reason === "LOCKED"
        ? "Too many wrong codes. Try again in a few minutes."
        : "That code isn't right. Check your authenticator app and try again.";
      updateAgentPanel();
    });
  }

  // Switching customers: the cart built for the current customer is saved
  // first, the storefront cart is emptied, and the next customer's saved cart
  // (if any) is restored — nothing leaks between accounts.
  function proceedAgentOrder(customerId) {
    agentPanel.busy = true;
    agentPanel.busyId = customerId;
    updateAgentPanel();

    var saved = window.sparklayerAgentContextId ? saveAgentCart() : Promise.resolve();

    return saved
      .then(function () { return fetch("/cart/clear.js", { method: "POST" }).catch(function () { }); })
      .then(function () { return agentSessionPost({ intent: "enter", customerId: customerId }); })
      .then(function (result) {
        if (!result.ok) {
          agentPanel.busy = false;
          if (result.body && result.body.code === "MFA_REQUIRED") {
            // The check lapsed between the status read and now: ask again.
            return beginAgentMfa(customerId, { enrolled: true }).then(function () { return null; });
          }
          agentPanel.error = "You no longer have access to this customer.";
          updateAgentPanel();
          return null;
        }

        return safeFetchJson(agentCartProxyUrl).then(function (saved) {
          var lines = saved.ok && saved.body ? saved.body.items || [] : [];
          agentCartVersion = saved.ok && saved.body && saved.body.version != null ? saved.body.version : null;
          agentCartConflict = null;
          return restoreAgentCartLines(lines);
        });
      })
      .then(function (results) {
        if (!results) return null;

        agentPanel.busy = false;
        agentPanel.results = null;

        return loadAgentSession().then(function () {
          cartMutationVersion++;
          return refreshCart();
        }).then(function () {
          if (results.failed.length) {
            agentPanel.notice = results.failed.length + " saved item(s) could not be restored (unavailable or not enough stock).";
            updateAgentPanel();
            return;
          }
          // Straight to the customer's cart.
          activeTab = "cart";
          tabsEl.innerHTML = renderTabsHtml();
          setStep(0);
        });
      })
      .catch(function () {
        agentPanel.busy = false;
        agentPanel.error = "Something went wrong. Please try again.";
        updateAgentPanel();
      });
  }

  var agentSearchTimer = null;
  var agentSearchRequest = 0;

  root.addEventListener("input", function (event) {
    if (event.target.matches("[data-sl-agent-mfa-code]") && agentPanel.mfa) {
      agentPanel.mfa.code = event.target.value;
      return;
    }

    if (!event.target.matches("[data-sl-agent-search]")) return;

    var query = event.target.value.trim();
    agentPanel.query = event.target.value;
    clearTimeout(agentSearchTimer);

    if (!query) {
      agentPanel.results = null;
      updateAgentPanel();
      return;
    }

    agentSearchTimer = setTimeout(function () {
      var current = ++agentSearchRequest;
      safeFetchJson(agentSearchProxyUrl + "?q=" + encodeURIComponent(query)).then(function (result) {
        if (current !== agentSearchRequest) return;
        agentPanel.results = result.ok && result.body ? result.body.customers || [] : [];
        updateAgentPanel();
      });
    }, 300);
  });

  root.addEventListener("change", function (event) {
    if (event.target.matches("[data-sl-customer-select]")) {
      agentPanel.selectedCustomerId = event.target.value || null;
      var btn = bodyEl.querySelector("[data-sl-dropdown-start]");
      if (btn) {
        btn.disabled = !agentPanel.selectedCustomerId || agentPanel.busy;
        btn.title = agentPanel.selectedCustomerId ? "Start order for selected customer" : "Select a customer from dropdown first";
      }
    }
  });

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-sl-dropdown-start]")) {
      if (agentPanel.selectedCustomerId && !agentPanel.busy) {
        startAgentOrder(agentPanel.selectedCustomerId);
      }
      return;
    }

    var start = event.target.closest("[data-sl-agent-start]");
    if (start && !agentPanel.busy) {
      startAgentOrder(start.getAttribute("data-sl-agent-start"));
      return;
    }

    if (event.target.closest("[data-sl-agent-mfa-submit]")) {
      submitAgentMfa();
      return;
    }

    if (event.target.closest("[data-sl-agent-mfa-cancel]")) {
      agentPanel.mfa = null;
      updateAgentPanel();
    }
  });

  root.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.matches("[data-sl-agent-mfa-code]")) {
      event.preventDefault();
      submitAgentMfa();
    }
  });

  // ---- Price exceptions (spec §8) ----------------------------------------
  // While ordering for a customer an agent can ask for a different price on a
  // line. The server decides: it may be allowed outright, wait for an
  // approver, or be refused — and it works out the baseline itself, so all
  // this sends is the price wanted and why. Approvers decide from the agent
  // section of the My Account tab.

  var agentOverrides = [];
  var overrideForm = null;
  var overridesEnabled = true;

  var OVERRIDE_REASONS = [
    ["VOLUME_COMMITMENT", "Volume commitment"],
    ["COMPETITOR_MATCH", "Competitor match"],
    ["LOYALTY", "Loyalty"],
    ["CONTRACT_TERMS", "Contract terms"],
    ["DAMAGED_OR_CLOSEOUT", "Damaged or closeout"],
    ["SERVICE_RECOVERY", "Service recovery"],
    ["OTHER", "Other"],
  ];

  var OVERRIDE_STATUS_TEXT = {
    AUTO_APPROVED: "Approved",
    APPROVED: "Approved",
    PENDING_APPROVAL: "Waiting for approval",
    DENIED: "Not allowed",
    REJECTED: "Rejected",
  };

  var OVERRIDE_DENY_TEXT = {
    PERMISSION_DENIED: "your role doesn't allow this",
    STEP_UP_REQUIRED: "confirm your authenticator code first",
    BELOW_FLOOR: "below the lowest allowed price",
    NO_APPROVAL_ROUTE: "too large to be approved",
    POLICY_DENY: "not allowed by policy",
    CURRENCY_MISMATCH: "currency mismatch",
    INVALID_BASELINE: "no price to compare with",
    ACCOUNT_NOT_ELIGIBLE: "this account can't be given exceptions",
    NOT_NEEDED: "the order fits inside the credit that is left",
  };

  function loadAgentOverrides() {
    if (!agentOverrideProxyUrl || !window.sparklayerAgentContextId) {
      agentOverrides = [];
      overrideForm = null;
      return Promise.resolve();
    }

    return safeFetchJson(agentOverrideProxyUrl).then(function (result) {
      overridesEnabled = !(result.ok && result.body && result.body.enabled === false);
      agentOverrides = result.ok && result.body && result.body.overrides ? result.body.overrides : [];
      agentOverrides = agentOverrides.filter(function (o) { return !isDismissedOverride(o); });
      if (activeTab === "cart" && currentStep === 0) renderCartLines();
    });
  }

  // A refused or rejected request can be hidden from the cart. It stays in the
  // audit trail; only this browser stops showing it.
  function dismissedOverrideIds() {
    try { return JSON.parse(localStorage.getItem("slDismissedOverrides") || "[]"); } catch (e) { return []; }
  }

  function isDismissedOverride(o) {
    return (o.status === "DENIED" || o.status === "REJECTED") && dismissedOverrideIds().indexOf(String(o.id)) !== -1;
  }

  function dismissOverride(id) {
    var ids = dismissedOverrideIds();
    if (ids.indexOf(String(id)) === -1) ids.push(String(id));
    try { localStorage.setItem("slDismissedOverrides", JSON.stringify(ids.slice(-200))); } catch (e) { }
    agentOverrides = agentOverrides.filter(function (o) { return String(o.id) !== String(id); });
    if (activeTab === "cart" && currentStep === 0) renderCartLines();
  }

  // The approved exception that sets this line's price right now, if any.
  function agentOverrideFor(line) {
    for (var i = 0; i < agentOverrides.length; i++) {
      var o = agentOverrides[i];
      if (o.type !== "UNIT_PRICE" || o.lineVariantId !== String(line.variant_id)) continue;
      if (o.status !== "AUTO_APPROVED" && o.status !== "APPROVED") continue;
      if (o.snapshotQuantity != null && o.snapshotQuantity !== line.quantity) continue;
      return o;
    }
    return null;
  }

  // What an exception is, in a few words, for the chip shown in the cart.
  function overrideLabel(o) {
    if (o.type === "ORDER_DISCOUNT") return "Order discount of " + formatMoney(o.baseline.amount - o.proposed.amount);
    if (o.type === "SHIPPING_PRICE") return "Shipping price " + formatMoney(o.proposed.amount);
    if (o.type === "QUANTITY_RULE" && o.rule === "INCREMENT") return "Pack size waived for " + o.proposed.amount + " units";
    if (o.type === "QUANTITY_RULE") return "Minimum quantity relaxed to " + o.proposed.amount;
    if (o.type === "CUSTOM_LINE") return (o.custom ? o.custom.title + " x " + o.custom.quantity + " at " : "Custom line at ") + formatMoney(o.proposed.amount);
    if (o.type === "ORDER_APPROVAL") return "Order approval for " + formatMoney(o.proposed.amount);
    if (o.type === "ADDRESS") return "Ship to " + (o.address ? o.address.city : "a one-off address") + " (this order only)";
    if (o.type === "CREDIT_LIMIT") return "Order allowed up to " + formatMoney(o.proposed.amount) + " past the credit limit";
    return "Price change to " + formatMoney(o.proposed.amount);
  }

  function overrideChipHtml(o) {
    var text = OVERRIDE_STATUS_TEXT[o.status] || o.status;
    var detail = "";

    if (o.status === "DENIED" && o.denyReason) detail = " — " + (OVERRIDE_DENY_TEXT[o.denyReason] || o.denyReason);
    if (o.status === "REJECTED" && o.decisions && o.decisions.length) {
      var last = o.decisions[o.decisions.length - 1];
      if (last.comment) detail = " — " + last.comment;
    }

    var cls = o.status === "APPROVED" || o.status === "AUTO_APPROVED"
      ? "is-ok"
      : o.status === "PENDING_APPROVAL" ? "is-wait" : "is-bad";
    var withdraw = o.status === "PENDING_APPROVAL" || o.status === "APPROVED" || o.status === "AUTO_APPROVED";

    return (
      '<div class="sl-agent-chip ' + cls + '">' +
      "<span>" + escapeHtml(overrideLabel(o)) + " · " + escapeHtml(text) + escapeHtml(detail) + "</span>" +
      (withdraw ? ' <button type="button" class="sl-agent-link" data-sl-ov-withdraw="' + escapeHtml(o.id) + '">Withdraw</button>' : "") +
      (cls === "is-bad" ? ' <button type="button" class="sl-agent-link" data-sl-ov-dismiss="' + escapeHtml(o.id) + '" aria-label="Hide this message">Dismiss</button>' : "") +
      "</div>"
    );
  }

  function renderOverrideScreenHtml() {
    var f = overrideForm;
    if (!f || !f.line) return "";
    var line = f.line;
    var currentPriceFormatted = formatMoney(f.currentPrice);
    var meta = [line.variant_title, line.sku ? "SKU: " + line.sku : null]
      .filter(Boolean)
      .join(" \u00b7 ");

    return (
      '<div class="sl-ov-view">' +
      '<div class="sl-ov-nav">' +
      '<button type="button" class="sl-ov-back-btn" data-sl-ov-cancel>' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>' +
      'Back to Cart' +
      '</button>' +
      '<span class="sl-ov-title">Change Price</span>' +
      '</div>' +

      '<div class="sl-ov-body">' +
      '<div class="sl-ov-item-card">' +
      (line.image ? '<img src="' + escapeHtml(line.image) + '" alt="' + escapeHtml(line.product_title) + '" class="sl-ov-item-img">' : '') +
      '<div class="sl-ov-item-details">' +
      '<div class="sl-ov-item-name">' + escapeHtml(line.product_title) + '</div>' +
      (meta ? '<div class="sl-ov-item-meta">' + escapeHtml(meta) + '</div>' : '') +
      '<div class="sl-ov-item-price-row">' +
      'Current unit price: <strong>' + escapeHtml(currentPriceFormatted) + '</strong>' +
      '</div>' +
      '</div>' +
      '</div>' +

      '<div class="sl-ov-form-box">' +
      '<div class="sl-ov-field">' +
      '<label for="sl-ov-input-price">New price per unit (' + escapeHtml(cartData.currency || "USD") + ')</label>' +
      '<div class="sl-ov-input-wrapper">' +
      '<span class="sl-ov-currency-prefix">$</span>' +
      '<input id="sl-ov-input-price" type="text" inputmode="decimal" class="sl-ov-input sl-ov-input-with-prefix" data-sl-ov-price value="' + escapeHtml(f.price || "") + '" placeholder="' + escapeHtml((f.currentPrice / 100).toFixed(2)) + '">' +
      '</div>' +
      '</div>' +

      '<div class="sl-ov-field">' +
      '<label for="sl-ov-select-reason">Reason for price change</label>' +
      '<select id="sl-ov-select-reason" class="sl-ov-select" data-sl-ov-reason>' +
      OVERRIDE_REASONS.map(function (r) {
        return '<option value="' + r[0] + '"' + (f.reasonCode === r[0] ? " selected" : "") + '>' + escapeHtml(r[1]) + '</option>';
      }).join("") +
      '</select>' +
      '</div>' +

      '<div class="sl-ov-field">' +
      '<label for="sl-ov-textarea-note">Note / Justification</label>' +
      '<textarea id="sl-ov-textarea-note" class="sl-ov-textarea" rows="3" data-sl-ov-text placeholder="Why is this price right?">' + escapeHtml(f.reasonText || "") + '</textarea>' +
      '</div>' +

      (f.stepUp ? (
        '<div class="sl-ov-field">' +
        '<label for="sl-ov-input-code">Authenticator code (6 digits)</label>' +
        '<input id="sl-ov-input-code" type="text" inputmode="numeric" maxlength="6" class="sl-ov-input" data-sl-ov-code value="' + escapeHtml(f.code || "") + '" placeholder="123456">' +
        '</div>'
      ) : '') +

      (f.error ? '<div class="sl-ov-error-banner" role="alert">' + escapeHtml(f.error) + '</div>' : '') +
      '</div>' +
      '</div>' +

      '<div class="sl-ov-footer">' +
      '<button type="button" class="sl-ov-btn-cancel" data-sl-ov-cancel>Cancel</button>' +
      '<button type="button" class="sl-ov-btn-submit" data-sl-ov-submit' + (f.busy ? ' disabled' : '') + '>' +
      (f.busy ? 'Submitting...' : 'Request price change') +
      '</button>' +
      '</div>' +
      '</div>'
    );
  }

  function renderOverrideScreen() {
    if (!overrideForm) return;
    tabsEl.innerHTML = renderTabsHtml();
    stepsEl.innerHTML = "";
    footerEl.innerHTML = "";
    bodyEl.innerHTML = renderOverrideScreenHtml();
    bodyEl.scrollTop = 0;
  }

  function overrideFormHtml(line) {
    return "";
  }

  // Shown under a cart line, only while an agent is ordering for a customer.
  function agentLineHtml(line) {
    if (!window.sparklayerAgentContextId || !agentOverrideProxyUrl) return "";

    var variantId = String(line.variant_id);
    var shown = agentOverrides
      .filter(function (o) {
        if (o.status === "DENIED" && o.denyReason === "STEP_UP_REQUIRED") return false;
        return o.type === "UNIT_PRICE" && o.lineVariantId === variantId && o.status !== "EXPIRED" && o.status !== "INVALIDATED";
      })
      .slice(0, 2);

    var html = '<div class="sl-agent-line">';
    shown.forEach(function (o) { html += overrideChipHtml(o); });

    // The tax basis of this line (spec §4.6): whether tax applies and whether
    // the price already has it in. The amount comes at checkout.
    var basis = wholesalePricing[variantId];
    if (basis) {
      html += '<p class="sl-agent-row-meta sl-agent-tax">' + (basis.taxable
        ? "Taxable \u00b7 price " + (basis.taxesIncluded ? "includes" : "excludes") + " tax \u00b7 tax is worked out at checkout"
        : "Not taxable") + "</p>";
    }

    if (overridesEnabled) {
      html += '<button type="button" class="sl-agent-btn-price" data-sl-ov-open><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:5px;vertical-align:-1px;"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>Change price</button>';
    }

    return html + "</div>";
  }

  function lineForElement(el) {
    var lineEl = el.closest(".sl-cart-line");
    var key = lineEl ? lineEl.getAttribute("data-line-key") : null;
    return (cartData.items || []).filter(function (i) { return i.key === key; })[0] || null;
  }

  function submitOverride() {
    var f = overrideForm;
    if (!f || f.busy) return;

    if (!String(f.price).trim()) {
      f.error = "Enter the price you want, for example 42.50.";
      renderOverrideScreen();
      return;
    }
    if (!String(f.reasonText).trim()) {
      f.error = "Say why this price is right.";
      renderOverrideScreen();
      return;
    }

    var code = String(f.code || "").split(" ").join("");
    if (f.stepUp && code.length !== 6) {
      f.error = "Enter the 6-digit code from your authenticator app.";
      renderOverrideScreen();
      return;
    }

    f.busy = true;
    f.error = "";
    renderOverrideScreen();

    // Changing a price is a high-risk action: for roles that use MFA the
    // server asks for a fresh authenticator code first (a "step-up" check).
    var checked = f.stepUp
      ? agentSessionPost({ intent: "mfa_verify", code: code, purpose: "step_up" })
      : Promise.resolve({ ok: true });

    checked
      .then(function (check) {
        if (!check.ok) {
          f.busy = false;
          f.code = "";
          f.error = check.body && check.body.code === "LOCKED"
            ? "Too many wrong codes. Try again in a few minutes."
            : "That code isn't right. Check your authenticator app and try again.";
          renderOverrideScreen();
          return null;
        }

        // The cart is saved first so the server prices the quantity on screen.
        return saveAgentCart().then(function () {
          return safeFetchJson(agentOverrideProxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              intent: "request",
              variantId: f.variantId,
              proposedPrice: f.price,
              reasonCode: f.reasonCode,
              reasonText: f.reasonText,
            }),
          });
        });
      })
      .then(function (result) {
        if (!result) return null;

        // The server wants the authenticator code first: ask for it here, and
        // keep what was typed so only the code is left to enter.
        if (result.ok && result.body && result.body.status === "DENIED" && result.body.denyReason === "STEP_UP_REQUIRED") {
          f.stepUp = true;
          f.busy = false;
          f.code = "";
          f.error = "Enter your authenticator code to confirm this price change.";
          renderOverrideScreen();
          return null;
        }

        if (result.ok) {
          overrideForm = null;
          setStep(0);
          return loadAgentOverrides();
        }

        f.busy = false;
        f.error = (result.body && result.body.message) || "Could not send the request.";
        renderOverrideScreen();
        return null;
      });
  }

  root.addEventListener("click", function (event) {
    var open = event.target.closest("[data-sl-ov-open]");
    if (open) {
      var line = lineForElement(open);
      if (!line) return;
      var curPrice = lineDisplayPrice(line).unit;
      overrideForm = {
        line: line,
        variantId: String(line.variant_id),
        currentPrice: curPrice,
        price: "",
        reasonCode: "VOLUME_COMMITMENT",
        reasonText: "",
        error: "",
        busy: false
      };
      renderOverrideScreen();
      return;
    }

    if (event.target.closest("[data-sl-ov-cancel]")) {
      overrideForm = null;
      setStep(0);
      return;
    }

    if (event.target.closest("[data-sl-ov-submit]")) {
      submitOverride();
      return;
    }

    var dismiss = event.target.closest("[data-sl-ov-dismiss]");
    if (dismiss) {
      dismissOverride(dismiss.getAttribute("data-sl-ov-dismiss"));
      return;
    }

    var withdraw = event.target.closest("[data-sl-ov-withdraw]");
    if (withdraw) {
      safeFetchJson(agentOverrideProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ intent: "cancel", id: withdraw.getAttribute("data-sl-ov-withdraw") }),
      }).then(loadAgentOverrides);
    }
  });

  // What is typed is kept in state, not the page, so a refresh of the cart
  // doesn't wipe the form.
  root.addEventListener("input", function (event) {
    if (!overrideForm) return;
    if (event.target.matches("[data-sl-ov-code]")) overrideForm.code = event.target.value;
    else if (event.target.matches("[data-sl-ov-price]")) overrideForm.price = event.target.value;
    else if (event.target.matches("[data-sl-ov-text]")) overrideForm.reasonText = event.target.value;
  });

  root.addEventListener("change", function (event) {
    if (overrideForm && event.target.matches("[data-sl-ov-reason]")) overrideForm.reasonCode = event.target.value;
  });

  // ---- Approvals to review (for agents who may approve) -------------------

  function loadAgentApprovals() {
    if (!agentApprovalsProxyUrl) return Promise.resolve();

    return safeFetchJson(agentApprovalsProxyUrl).then(function (result) {
      agentPanel.approvals = result.ok && result.body && result.body.approvals ? result.body.approvals : [];
      agentPanel.approvalsNeedStepUp = !!(result.ok && result.body && result.body.needsStepUp);
      updateAgentPanel();
    });
  }

  // What an approver needs beside the numbers (spec §8.4): what it costs and
  // how this customer has behaved.
  function approvalContextHtml(a) {
    var parts = [];
    if (a.impact) parts.push("Gives up " + formatMoney(a.impact.total) + " (cost isn't tracked, so this isn't a margin)");
    if (a.history) {
      parts.push(
        a.history.orders + " past orders, " + formatMoney(a.history.orderTotal) + " spent" +
        " · exceptions in 90 days: " + a.history.exceptions90d.total + " (" + a.history.exceptions90d.approved + " approved, " + a.history.exceptions90d.rejected + " refused)"
      );
    }
    return parts.length ? '<br><span class="sl-agent-row-meta">' + escapeHtml(parts.join(" · ")) + "</span>" : "";
  }

  function agentApprovalsHtml() {
    var list = agentPanel.approvals || [];

    // Approvals are waiting, but approving is a high-risk action: confirm with
    // the authenticator first.
    if (!list.length && agentPanel.approvalsNeedStepUp) {
      return (
        '<div class="sl-agent-mfa">' +
        "<strong>Approvals are waiting for you</strong>" +
        "<p>Enter the 6-digit code from your authenticator app to review them.</p>" +
        '<input type="text" class="sl-agent-mfa-code" data-sl-appr-code aria-label="6-digit authenticator code" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="123456">' +
        ' <button type="button" class="sl-agent-start" data-sl-appr-verify>Confirm</button>' +
        (agentPanel.approvalsCodeError ? '<p class="sl-agent-error" role="alert">' + escapeHtml(agentPanel.approvalsCodeError) + "</p>" : "") +
        "</div>"
      );
    }

    if (!list.length) return "";

    var rows = list.map(function (a) {
      return (
        '<div class="sl-agent-appr">' +
        '<div class="sl-agent-appr-main">' +
        "<strong>" + escapeHtml(a.agentName || "An agent") + "</strong> for " + escapeHtml(a.customerName || "a customer") +
        "<br>" + (a.address
          ? "ship to a one-off address: " + escapeHtml(a.address.address1) + ", " + escapeHtml(a.address.city) + " " + escapeHtml(a.address.zip) + " " + escapeHtml(a.address.countryCode)
          : a.type === "CREDIT_LIMIT"
            ? "credit exception: " + formatMoney(a.baseline.amount) + " left, order " + formatMoney(a.proposed.amount) + (a.deltaPercent != null ? " (" + escapeHtml(a.deltaPercent) + "% over)" : "")
            : a.custom
              ? "custom line: " + escapeHtml(a.custom.title) + " x " + escapeHtml(a.custom.quantity) + " at " + formatMoney(a.proposed.amount) + (a.custom.taxCode ? " (tax " + escapeHtml(a.custom.taxCode) + ")" : "")
              : escapeHtml(a.type.split("_").join(" ").toLowerCase()) + " " +
              (a.baseline.currency === "QTY" ? escapeHtml(a.baseline.amount) + " → " + escapeHtml(a.proposed.amount)
                : formatMoney(a.baseline.amount) + " → " + formatMoney(a.proposed.amount)) +
              (a.deltaPercent != null ? " (" + escapeHtml(a.deltaPercent) + "% off)" : "")) +
        '<br><span class="sl-agent-row-meta">' + escapeHtml(a.reasonText) + "</span>" +
        approvalContextHtml(a) +
        "</div>" +
        '<div class="sl-agent-appr-buttons">' +
        '<button type="button" class="sl-agent-start" data-sl-appr="approve" data-id="' + escapeHtml(a.id) + '" data-comment-required="' + (a.commentRequired ? "1" : "") + '">Approve</button>' +
        '<button type="button" class="sl-agent-link" data-sl-appr="reject" data-id="' + escapeHtml(a.id) + '">Reject</button>' +
        "</div>" +
        "</div>"
      );
    });

    return '<div class="sl-agent-list-title">Approvals to review</div><div class="sl-agent-list">' + rows.join("") + "</div>";
  }

  root.addEventListener("click", function (event) {
    if (!event.target.closest("[data-sl-appr-verify]")) return;

    var input = root.querySelector("[data-sl-appr-code]");
    var code = input ? input.value.split(" ").join("") : "";
    if (code.length !== 6) {
      agentPanel.approvalsCodeError = "Enter the 6-digit code.";
      updateAgentPanel();
      return;
    }

    agentPanel.approvalsCodeError = "";
    agentSessionPost({ intent: "mfa_verify", code: code, purpose: "step_up" }).then(function (result) {
      if (!result.ok) {
        agentPanel.approvalsCodeError = "That code isn't right. Check your authenticator app and try again.";
        updateAgentPanel();
        return null;
      }
      return loadAgentApprovals();
    });
  });

  root.addEventListener("click", function (event) {
    var button = event.target.closest("[data-sl-appr]");
    if (!button) return;

    var decision = button.getAttribute("data-sl-appr");
    var comment = "";

    if (decision === "reject" || button.getAttribute("data-comment-required")) {
      comment = window.prompt(decision === "reject" ? "Why are you rejecting this? (required)" : "Add a comment (required for this size):") || "";
      if (!comment.trim()) return;
    }

    agentPanel.error = "";
    safeFetchJson(agentApprovalsProxyUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: button.getAttribute("data-id"), decision: decision, comment: comment }),
    }).then(function (result) {
      if (!result.ok) {
        agentPanel.error = (result.body && result.body.message) || "Could not save that decision.";
      }
      return loadAgentApprovals();
    });
  });

  // ---- Quotes (spec §3.3, §4.7, §9.2) -------------------------------------
  // An agent saves the cart they built for a customer as a quote, sends it
  // (after a manager's approval when it is large), and turns it into an order
  // once the customer accepts. The customer answers from their own My Account.
  // Everything is decided on the server; this only draws it and sends clicks.

  var agentQuotes = [];
  var quoteApprovals = [];
  var quoteApprovalsNeedStepUp = false;
  var buyerQuotes = [];

  var QUOTE_STATUS_TEXT = {
    DRAFT: "Draft",
    PENDING_APPROVAL: "Waiting for approval",
    APPROVED: "Approved",
    REJECTED: "Rejected",
    SENT: "Sent to customer",
    ACCEPTED: "Accepted",
    DECLINED: "Declined",
    CHANGES_REQUESTED: "Changes requested",
    EXPIRED: "Expired",
    WITHDRAWN: "Withdrawn",
    CONVERTED: "Turned into an order",
  };

  function quoteDate(value) {
    return value ? new Date(value).toLocaleDateString() : "";
  }

  function postJson(url, payload) {
    return safeFetchJson(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  // ---- order-level exceptions (spec §8.2): discount, shipping price, a
  // relaxed minimum quantity and custom lines. The server works out the
  // baseline and decides; this collects what is wanted.

  var exForm = null;

  var EX_TYPES = [
    ["request_discount", "Order discount"],
    ["request_shipping", "Shipping price"],
    ["request_moq", "Allow below the minimum quantity"],
    ["request_increment", "Allow a quantity that isn't a whole pack"],
    ["request_address", "Ship to a one-off address"],
    ["request_credit", "Allow the order past the credit limit"],
    ["request_custom", "Custom line"],
  ];

  function renderExceptionScreenHtml() {
    var f = exForm;
    if (!f) return "";

    var subtotal = (cartData.items || []).reduce(function (sum, line) {
      return sum + lineDisplayPrice(line).unit * line.quantity;
    }, 0);

    var fields = "";
    if (f.type === "request_discount") {
      fields =
        '<div class="sl-ov-field">' +
        '<label for="sl-ex-percent">Discount percent (%)</label>' +
        '<input id="sl-ex-percent" type="text" inputmode="decimal" class="sl-ov-input" data-sl-ex-field="percent" value="' + escapeHtml(f.values.percent || "") + '" placeholder="e.g. 5">' +
        '</div>' +
        '<div class="sl-ov-field">' +
        '<label for="sl-ex-amount">Or amount off (' + escapeHtml(cartData.currency || "USD") + ')</label>' +
        '<div class="sl-ov-input-wrapper">' +
        '<span class="sl-ov-currency-prefix">$</span>' +
        '<input id="sl-ex-amount" type="text" inputmode="decimal" class="sl-ov-input sl-ov-input-with-prefix" data-sl-ex-field="amount" value="' + escapeHtml(f.values.amount || "") + '" placeholder="e.g. 40.00">' +
        '</div>' +
        '</div>';
    } else if (f.type === "request_shipping") {
      fields =
        '<div class="sl-ov-field">' +
        '<label for="sl-ex-price">Shipping price (' + escapeHtml(cartData.currency || "USD") + ', 0 for free)</label>' +
        '<div class="sl-ov-input-wrapper">' +
        '<span class="sl-ov-currency-prefix">$</span>' +
        '<input id="sl-ex-price" type="text" inputmode="decimal" class="sl-ov-input sl-ov-input-with-prefix" data-sl-ex-field="price" value="' + escapeHtml(f.values.price || "") + '" placeholder="e.g. 0.00">' +
        '</div>' +
        '</div>';
    } else if (f.type === "request_moq") {
      fields = '<p class="sl-agent-hint" style="margin:4px 0 8px;font-size:12px;color:#6b7280;">This order will be allowed below the customer\'s minimum order quantity.</p>';
    } else if (f.type === "request_increment") {
      fields = '<p class="sl-agent-hint" style="margin:4px 0 8px;font-size:12px;color:#6b7280;">This order will be allowed even though its quantity isn\'t a whole number of packs.</p>';
    } else if (f.type === "request_credit") {
      fields = '<p class="sl-agent-hint" style="margin:4px 0 8px;font-size:12px;color:#6b7280;">This order will be allowed to go past the customer\'s available credit, up to its total. An approver may need to agree.</p>';
    } else if (f.type === "request_address") {
      fields =
        '<p class="sl-agent-hint" style="margin:4px 0 8px;font-size:12px;color:#6b7280;">Used for this order only. It is not saved to the customer\'s address book.</p>' +
        '<div class="sl-ov-field"><label>Company / Name</label><input type="text" class="sl-ov-input" data-sl-ex-field="company" value="' + escapeHtml(f.values.company || "") + '"></div>' +
        '<div class="sl-ov-field"><label>Address</label><input type="text" class="sl-ov-input" data-sl-ex-field="address1" value="' + escapeHtml(f.values.address1 || "") + '"></div>' +
        '<div class="sl-ov-field"><label>Apartment, suite</label><input type="text" class="sl-ov-input" data-sl-ex-field="address2" value="' + escapeHtml(f.values.address2 || "") + '"></div>' +
        '<div class="sl-ov-field"><label>City</label><input type="text" class="sl-ov-input" data-sl-ex-field="city" value="' + escapeHtml(f.values.city || "") + '"></div>' +
        '<div class="sl-ov-field"><label>State / Province code</label><input type="text" class="sl-ov-input" data-sl-ex-field="provinceCode" value="' + escapeHtml(f.values.provinceCode || "") + '" placeholder="e.g. TX"></div>' +
        '<div class="sl-ov-field"><label>Postal code</label><input type="text" class="sl-ov-input" data-sl-ex-field="zip" value="' + escapeHtml(f.values.zip || "") + '"></div>' +
        '<div class="sl-ov-field"><label>Country code</label><input type="text" class="sl-ov-input" data-sl-ex-field="countryCode" value="' + escapeHtml(f.values.countryCode || "") + '" placeholder="e.g. US"></div>' +
        '<div class="sl-ov-field"><label>Phone</label><input type="text" class="sl-ov-input" data-sl-ex-field="phone" value="' + escapeHtml(f.values.phone || "") + '"></div>';
    } else {
      var taxable = f.values.taxable !== "false";
      fields =
        '<div class="sl-ov-field"><label>What is it?</label><input type="text" class="sl-ov-input" data-sl-ex-field="title" value="' + escapeHtml(f.values.title || "") + '" placeholder="e.g. Setup fee"></div>' +
        '<div class="sl-ov-field"><label>Quantity</label><input type="text" class="sl-ov-input" data-sl-ex-field="quantity" value="' + escapeHtml(f.values.quantity === undefined ? "1" : f.values.quantity) + '" placeholder="1"></div>' +
        '<div class="sl-ov-field"><label>Price per unit</label><div class="sl-ov-input-wrapper"><span class="sl-ov-currency-prefix">$</span><input type="text" inputmode="decimal" class="sl-ov-input sl-ov-input-with-prefix" data-sl-ex-field="price" value="' + escapeHtml(f.values.price || "") + '" placeholder="e.g. 50.00"></div></div>' +
        '<label class="sl-nc-check" style="margin-top:4px;display:flex;align-items:center;gap:6px;font-size:12px;color:#374151;"><input type="checkbox" data-sl-ex-taxable' + (taxable ? " checked" : "") + '> Tax applies to this item</label>' +
        (taxable ? '<div class="sl-ov-field"><label>Tax code</label><input type="text" class="sl-ov-input" data-sl-ex-field="taxCode" value="' + escapeHtml(f.values.taxCode || "") + '" placeholder="e.g. SERVICES-STD"></div>' : "") +
        '<div class="sl-ov-field"><label>Accounting code (optional)</label><input type="text" class="sl-ov-input" data-sl-ex-field="accountingCode" value="' + escapeHtml(f.values.accountingCode || "") + '"></div>';
    }

    return (
      '<div class="sl-ov-view">' +
      '<div class="sl-ov-nav">' +
      '<button type="button" class="sl-ov-back-btn" data-sl-ex-cancel>' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px;"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>' +
      'Back to Cart' +
      '</button>' +
      '<span class="sl-ov-title">Order Exception</span>' +
      '</div>' +

      '<div class="sl-ov-body">' +
      '<div class="sl-ov-item-card">' +
      '<div class="sl-ov-item-details">' +
      '<div class="sl-ov-item-name">Order Exception Request</div>' +
      '<div class="sl-ov-item-meta">Current Order Subtotal: ' + escapeHtml(formatMoney(subtotal)) + ' (' + (cartData.items || []).length + ' lines)</div>' +
      '</div>' +
      '</div>' +

      '<div class="sl-ov-form-box">' +
      '<div class="sl-ov-field">' +
      '<label for="sl-ex-type-select">Exception Type</label>' +
      '<select id="sl-ex-type-select" class="sl-ov-select" data-sl-ex-type>' +
      EX_TYPES.map(function (t) {
        return '<option value="' + t[0] + '"' + (f.type === t[0] ? " selected" : "") + '>' + escapeHtml(t[1]) + '</option>';
      }).join("") +
      '</select>' +
      '</div>' +

      fields +

      '<div class="sl-ov-field">' +
      '<label for="sl-ex-reason-select">Reason for exception</label>' +
      '<select id="sl-ex-reason-select" class="sl-ov-select" data-sl-ex-reason>' +
      OVERRIDE_REASONS.map(function (r) {
        return '<option value="' + r[0] + '"' + (f.reasonCode === r[0] ? " selected" : "") + '>' + escapeHtml(r[1]) + '</option>';
      }).join("") +
      '</select>' +
      '</div>' +

      '<div class="sl-ov-field">' +
      '<label for="sl-ex-note">Note / Justification</label>' +
      '<textarea id="sl-ex-note" class="sl-ov-textarea" rows="3" data-sl-ex-field="reasonText" placeholder="Why is this exception right?">' + escapeHtml(f.reasonText || "") + '</textarea>' +
      '</div>' +

      (f.stepUp ? (
        '<div class="sl-ov-field">' +
        '<label for="sl-ex-code">Authenticator code (6 digits)</label>' +
        '<input id="sl-ex-code" type="text" inputmode="numeric" maxlength="6" class="sl-ov-input" data-sl-ex-code value="' + escapeHtml(f.code || "") + '" placeholder="123456">' +
        '</div>'
      ) : '') +

      (f.error ? '<div class="sl-ov-error-banner" role="alert">' + escapeHtml(f.error) + '</div>' : '') +
      '</div>' +
      '</div>' +

      '<div class="sl-ov-footer">' +
      '<button type="button" class="sl-ov-btn-cancel" data-sl-ex-cancel>Cancel</button>' +
      '<button type="button" class="sl-ov-btn-submit" data-sl-ex-submit' + (f.busy ? ' disabled' : '') + '>' +
      (f.busy ? 'Submitting...' : 'Request exception') +
      '</button>' +
      '</div>' +
      '</div>'
    );
  }

  function renderExceptionScreen() {
    if (!exForm) return;
    tabsEl.innerHTML = renderTabsHtml();
    stepsEl.innerHTML = "";
    footerEl.innerHTML = "";
    bodyEl.innerHTML = renderExceptionScreenHtml();
    bodyEl.scrollTop = 0;
  }

  function exceptionsHtml() {
    if (!window.sparklayerAgentContextId || !agentOverrideProxyUrl) return "";

    var chips = agentOverrides
      .filter(function (o) {
        if (o.type === "UNIT_PRICE") return false;
        if (o.status === "EXPIRED" || o.status === "INVALIDATED") return false;
        return !(o.status === "DENIED" && o.denyReason === "STEP_UP_REQUIRED");
      })
      .slice(0, 6)
      .map(overrideChipHtml)
      .join("");

    if (!overridesEnabled) {
      return chips ? '<div class="sl-agent-line">' + chips + '</div>' + cartSavedHtml() : cartSavedHtml();
    }

    return (
      '<div class="sl-agent-line">' +
      chips +
      '<button type="button" class="sl-agent-btn-exception" data-sl-ex-open>' +
      '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>' +
      'Add order exception' +
      '</button>' +
      '</div>' +
      cartSavedHtml()
    );
  }

  function submitException() {
    var f = exForm;
    if (!f || f.busy) return;

    if (!String(f.reasonText || "").trim()) {
      f.error = "Say why this is right.";
      renderExceptionScreen();
      return;
    }
    var code = String(f.code || "").split(" ").join("");
    if (f.stepUp && code.length !== 6) {
      f.error = "Enter the 6-digit code from your authenticator app.";
      renderExceptionScreen();
      return;
    }

    f.busy = true;
    f.error = "";
    renderExceptionScreen();

    var checked = f.stepUp
      ? agentSessionPost({ intent: "mfa_verify", code: code, purpose: "step_up" })
      : Promise.resolve({ ok: true });

    checked.then(function (check) {
      if (!check.ok) {
        f.busy = false;
        f.error = "That code isn't right. Check your authenticator app and try again.";
        renderExceptionScreen();
        return null;
      }

      var payload = { intent: f.type, reasonCode: f.reasonCode, reasonText: f.reasonText };
      Object.keys(f.values).forEach(function (k) { payload[k] = f.values[k]; });

      // The address fields travel together.
      if (f.type === "request_address") {
        payload.address = {};
        ["company", "address1", "address2", "city", "provinceCode", "zip", "countryCode", "phone"].forEach(function (k) {
          payload.address[k] = f.values[k] || "";
        });
      }

      return postJson(agentOverrideProxyUrl, payload).then(function (result) {
        f.busy = false;
        var body = result.body || {};

        if (!result.ok) {
          f.error = body.message || "That didn't work.";
          renderExceptionScreen();
        } else if (body.status === "DENIED" && body.denyReason === "STEP_UP_REQUIRED") {
          f.stepUp = true;
          f.error = "Enter a fresh code from your authenticator app.";
          renderExceptionScreen();
        } else {
          exForm = null;
          setStep(0);
          return loadAgentOverrides().then(refreshFooter);
        }
      });
    });
  }

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-sl-ex-open]")) {
      exForm = { type: "request_discount", values: {}, reasonCode: "VOLUME_COMMITMENT", reasonText: "", stepUp: false, code: "", busy: false, error: "" };
      renderExceptionScreen();
      return;
    } else if (event.target.closest("[data-sl-ex-cancel]")) {
      exForm = null;
      setStep(0);
      return;
    } else if (event.target.closest("[data-sl-ex-submit]")) {
      submitException();
      return;
    }
  });

  root.addEventListener("input", function (event) {
    if (!exForm || !event.target.matches) return;
    if (event.target.matches("[data-sl-ex-code]")) exForm.code = event.target.value;
    else if (event.target.matches("[data-sl-ex-field]")) {
      var name = event.target.getAttribute("data-sl-ex-field");
      if (name === "reasonText") exForm.reasonText = event.target.value;
      else exForm.values[name] = event.target.value;
    }
  });

  root.addEventListener("change", function (event) {
    if (!exForm || !event.target.matches) return;
    if (event.target.matches("[data-sl-ex-type]")) {
      exForm.type = event.target.value;
      exForm.values = {};
      exForm.error = "";
      renderExceptionScreen();
    } else if (event.target.matches("[data-sl-ex-taxable]")) {
      exForm.values.taxable = event.target.checked ? "true" : "false";
      renderExceptionScreen();
    } else if (event.target.matches("[data-sl-ex-reason]")) {
      exForm.reasonCode = event.target.value;
    }
  });

  // Action buttons for cart footer (side-by-side in Agent Mode).
  var quotesEnabled = (function () {
    try {
      return sessionStorage.getItem("sl_quotes_enabled") === "true";
    } catch (e) {
      return false;
    }
  })();
  function footerActionsHtml() {
    var checkoutBtn = '<a href="/checkout" class="sl-cart-checkout" data-sl-checkout>' + escapeHtml(i18n.checkout) + "</a>";
    var quoteBtn = "";

    if (window.sparklayerAgentContextId && agentQuoteProxyUrl && quotesEnabled) {
      quoteBtn = '<button type="button" class="sl-agent-quote-btn" data-sl-quote-create' + (agentPanel && agentPanel.quoteSaving ? " disabled" : "") + ">" +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
        (agentPanel && agentPanel.quoteSaving ? "Saving quote…" : "Save as quote") +
        "</button>";
    } else if (hasCustomer || customerQuoteProxyUrl) {
      quoteBtn = '<button type="button" class="sl-agent-quote-btn" data-sl-customer-quote>' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px;vertical-align:-2px;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>' +
        "Save as quote" +
        "</button>";
    }

    if (!quoteBtn) return checkoutBtn;

    return (
      '<div class="sl-cart-footer-actions">' +
      quoteBtn +
      checkoutBtn +
      "</div>" +
      (agentPanel && agentPanel.quoteMessage ? '<p class="sl-agent-quote-msg">' + escapeHtml(agentPanel.quoteMessage) + "</p>" : "")
    );
  }

  function agentQuoteButtonHtml() {
    return footerActionsHtml();
  }

  function refreshFooter() {
    if (activeTab === "cart" && currentStep === 0) {
      footerEl.innerHTML = renderFooterHtml();
      renderCartLines();
    }
  }

  function loadAgentQuotes() {
    if (!agentQuoteProxyUrl) return Promise.resolve();
    var url = agentQuoteProxyUrl;
    if (customerId) {
      url += (url.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
    }
    return safeFetchJson(url).then(function (result) {
      var prev = quotesEnabled;
      quotesEnabled = !(result.ok && result.body && result.body.enabled === false);
      try {
        sessionStorage.setItem("sl_quotes_enabled", quotesEnabled ? "true" : "false");
      } catch (e) {}
      agentQuotes = result.ok && result.body && result.body.quotes ? result.body.quotes : [];
      updateAgentPanel();
      if (prev !== quotesEnabled && activeTab === "cart" && currentStep === 0) {
        footerEl.innerHTML = renderFooterHtml();
      }
    });
  }

  function loadQuoteApprovals() {
    if (!agentQuoteApprovalsProxyUrl) return Promise.resolve();
    return safeFetchJson(agentQuoteApprovalsProxyUrl).then(function (result) {
      quoteApprovals = result.ok && result.body && result.body.quotes ? result.body.quotes : [];
      quoteApprovalsNeedStepUp = !!(result.ok && result.body && result.body.needsStepUp);
      updateAgentPanel();
    });
  }

  function loadBuyerQuotes() {
    if (!customerQuoteProxyUrl || !hasCustomer) return Promise.resolve();
    return safeFetchJson(customerQuoteProxyUrl).then(function (result) {
      buyerQuotes = result.ok && result.body && result.body.quotes ? result.body.quotes : [];
      if (activeTab === "account" && accountView === "dashboard") {
        bodyEl.innerHTML = renderAccountDashboardBody();
      }
    });
  }

  function quoteActionButtons(q) {
    var b = [];
    var btn = function (action, label, primary) {
      return '<button type="button" class="' + (primary ? "sl-agent-start" : "sl-agent-link") + '" data-sl-quote-act="' + action + '" data-id="' + escapeHtml(q.id) + '">' + label + "</button>";
    };

    if (q.status === "DRAFT") {
      b.push(q.requiresApproval ? btn("submit", "Submit for approval", true) : btn("send", "Send to customer", true));
      b.push(btn("withdraw", "Withdraw"));
    } else if (q.status === "APPROVED") {
      b.push(btn("send", "Send to customer", true));
      b.push(btn("withdraw", "Withdraw"));
    } else if (q.status === "PENDING_APPROVAL" || q.status === "SENT") {
      b.push(btn("withdraw", "Withdraw"));
    } else if (q.status === "ACCEPTED") {
      b.push(btn("convert", "Turn into an order", true));
    } else if (["CHANGES_REQUESTED", "DECLINED", "EXPIRED", "REJECTED"].indexOf(q.status) !== -1) {
      b.push(btn("revise", "Revise", true));
    }
    b.push(btn("duplicate", "Duplicate"));
    return b.join(" ");
  }

  var paymentLinks = [];

  var LINK_STATUS_TEXT = {
    ACTIVE: "Waiting for payment",
    PAID: "Paid",
    EXPIRED: "Expired",
    REVOKED: "Withdrawn",
    REPLACED: "Replaced by a newer link",
  };

  function loadPaymentLinks() {
    if (!agentPaymentLinksProxyUrl) return Promise.resolve();
    return safeFetchJson(agentPaymentLinksProxyUrl).then(function (result) {
      paymentLinks = result.ok && result.body && result.body.links ? result.body.links : [];
      updateAgentPanel();
    });
  }

  function paymentLinksHtml() {
    var shown = paymentLinks.filter(function (l) { return l.status !== "REPLACED"; }).slice(0, 10);
    if (!shown.length) return "";

    var rows = shown.map(function (l) {
      var meta = LINK_STATUS_TEXT[l.status] || l.status;
      if (l.status === "ACTIVE") meta += " \u00b7 until " + quoteDate(l.expiresAt) + (l.openedAt ? " \u00b7 opened" : "");
      if (l.status === "PAID" && l.reconcileFlag) meta += " \u00b7 amount differs, under review";
      return (
        '<div class="sl-agent-appr">' +
        '<div class="sl-agent-appr-main">' +
        "<strong>" + escapeHtml(formatMoney(l.amount, l.currency)) + "</strong> \u00b7 " + escapeHtml(l.sentTo || "") +
        '<br><span class="sl-agent-row-meta">' + escapeHtml(meta) + "</span>" +
        "</div>" +
        (l.status === "ACTIVE"
          ? '<div class="sl-agent-appr-buttons"><button type="button" class="sl-agent-link" data-sl-link-revoke data-id="' + escapeHtml(l.id) + '">Withdraw</button></div>'
          : "") +
        "</div>"
      );
    });

    return '<div class="sl-agent-list-title">Payment links</div><div class="sl-agent-list">' + rows.join("") + "</div>";
  }

  function agentQuotesHtml() {
    if (!agentQuotes.length) return "";

    var rows = agentQuotes.slice(0, 20).map(function (q) {
      var when = q.status === "SENT" && q.expiresAt ? " · open until " + quoteDate(q.expiresAt) : "";
      return (
        '<div class="sl-agent-appr">' +
        '<div class="sl-agent-appr-main">' +
        "<strong>" + escapeHtml(q.number) + "</strong> · " + escapeHtml(q.customerName || "customer") +
        (q.totals ? " · " + formatMoney(q.totals.subtotal) : "") +
        '<br><span class="sl-agent-row-meta">' + escapeHtml(QUOTE_STATUS_TEXT[q.status] || q.status) + (q.currentVersion > 1 ? " · version " + q.currentVersion : "") + escapeHtml(when) + "</span>" +
        "</div>" +
        '<div class="sl-agent-appr-buttons">' + quoteActionButtons(q) + "</div>" +
        "</div>"
      );
    });

    return '<div class="sl-agent-list-title">Your quotes</div><div class="sl-agent-list">' + rows.join("") + "</div>";
  }

  function quoteApprovalsHtml() {
    if (!quoteApprovals.length && quoteApprovalsNeedStepUp) {
      return (
        '<div class="sl-agent-mfa"><strong>Quotes are waiting for you</strong>' +
        "<p>Confirm with your authenticator code (above, under Approvals) to review them.</p></div>"
      );
    }
    if (!quoteApprovals.length) return "";

    var rows = quoteApprovals.map(function (q) {
      return (
        '<div class="sl-agent-appr">' +
        '<div class="sl-agent-appr-main">' +
        "<strong>" + escapeHtml(q.number) + "</strong> · " + escapeHtml(q.customerName || "customer") +
        (q.totals ? " · " + formatMoney(q.totals.subtotal) : "") +
        '<br><span class="sl-agent-row-meta">' + (q.items ? q.items.length + " item(s)" : "") + "</span>" +
        "</div>" +
        '<div class="sl-agent-appr-buttons">' +
        '<button type="button" class="sl-agent-start" data-sl-quote-decide="approve" data-id="' + escapeHtml(q.id) + '">Approve</button>' +
        '<button type="button" class="sl-agent-link" data-sl-quote-decide="reject" data-id="' + escapeHtml(q.id) + '">Reject</button>' +
        "</div>" +
        "</div>"
      );
    });

    return '<div class="sl-agent-list-title">Quotes to review</div><div class="sl-agent-list">' + rows.join("") + "</div>";
  }

  // The customer's own view, in their My Account: quotes sent to them. They
  // never see drafts, internal notes or the prices before any discount.
  function buyerQuotesHtml() {
    if (!buyerQuotes.length || agentPanel.isAgent) return "";

    var rows = buyerQuotes.map(function (q) {
      var open = q.status === "SENT";
      var lines = (q.items || []).map(function (i) {
        return escapeHtml(i.title || i.sku) + " × " + escapeHtml(i.quantity) + " @ " + formatMoney(i.unitPrice);
      }).join("<br>");

      return (
        '<div class="sl-agent-appr sl-quote-buyer">' +
        '<div class="sl-agent-appr-main">' +
        "<strong>" + escapeHtml(q.number) + "</strong> · " + (q.totals ? formatMoney(q.totals.subtotal) : "") +
        '<br><span class="sl-agent-row-meta">' + escapeHtml(QUOTE_STATUS_TEXT[q.status] || q.status) +
        (open && q.expiresAt ? " · open until " + escapeHtml(quoteDate(q.expiresAt)) : "") + "</span>" +
        '<div class="sl-quote-lines">' + lines + "</div>" +
        (q.terms && q.terms.notes ? '<div class="sl-agent-row-meta">' + escapeHtml(q.terms.notes) + "</div>" : "") +
        "</div>" +
        (open
          ? '<div class="sl-agent-appr-buttons">' +
          '<button type="button" class="sl-agent-start" data-sl-quote-reply="accept" data-id="' + escapeHtml(q.id) + '">Accept</button>' +
          '<button type="button" class="sl-agent-link" data-sl-quote-reply="changes" data-id="' + escapeHtml(q.id) + '">Request changes</button>' +
          '<button type="button" class="sl-agent-link" data-sl-quote-reply="decline" data-id="' + escapeHtml(q.id) + '">Decline</button>' +
          "</div>"
          : "") +
        "</div>"
      );
    });

    return (
      '<div class="sl-agent-panel"><h3 class="sl-cart-heading">Quotes</h3>' +
      '<div class="sl-agent-list">' + rows.join("") + "</div>" +
      (agentPanel.quoteMessage ? '<p class="sl-agent-notice">' + escapeHtml(agentPanel.quoteMessage) + "</p>" : "") +
      "</div>"
    );
  }

  root.addEventListener("click", function (event) {
    // Save the cart as a quote (1-click direct save without prompt popup).
    if (event.target.closest("[data-sl-customer-quote]")) {
      var custBtn = event.target.closest("[data-sl-customer-quote]");
      if (!customerQuoteProxyUrl) return;
      var origText = custBtn.innerHTML;
      custBtn.disabled = true;
      custBtn.innerText = "Saving quote…";
      fetch(customerQuoteProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          customerId: customerId,
          currency: (cartData && cartData.currency) || "USD",
          lineItems: (cartData.items || []).map(function (it) {
            return { variant_id: it.variant_id, quantity: it.quantity };
          })
        })
      })
        .then(function (res) { return res.json(); })
        .then(function () {
          custBtn.disabled = false;
          custBtn.innerHTML = origText;
          showToast("Quote saved successfully!");
        })
        .catch(function () {
          custBtn.disabled = false;
          custBtn.innerHTML = origText;
          showToast("Could not save quote.");
        });
      return;
    }

    if (event.target.closest("[data-sl-quote-create]")) {
      if (agentPanel.quoteSaving) return;
      agentPanel.quoteSaving = true;
      agentPanel.quoteMessage = "Saving the quote…";
      refreshFooter();

      saveAgentCart()
        .then(function () { return postJson(agentQuoteProxyUrl, { intent: "create", notes: "" }); })
        .then(function (result) {
          agentPanel.quoteSaving = false;
          agentPanel.quoteMessage = result.ok
            ? "Saved as " + result.body.number + ". Find it under My Account → Your quotes."
            : (result.body && result.body.message) || "Could not save the quote.";
          refreshFooter();
          if (result.ok) loadAgentQuotes();
        }, function () {
          agentPanel.quoteSaving = false;
          agentPanel.quoteMessage = "Could not save the quote.";
          refreshFooter();
        });
      return;
    }

    // Withdraw a payment link the agent sent.
    var linkRevoke = event.target.closest("[data-sl-link-revoke]");
    if (linkRevoke) {
      if (!window.confirm("Withdraw this payment link? The customer won't be able to use it.")) return;
      linkRevoke.disabled = true;
      postJson(agentPaymentLinksProxyUrl, { id: linkRevoke.getAttribute("data-id") }).then(function (result) {
        agentPanel.error = result.ok ? "" : (result.body && result.body.message) || "Could not withdraw the link.";
        return loadPaymentLinks();
      });
      return;
    }

    // Move one of the agent's own quotes along.
    var act = event.target.closest("[data-sl-quote-act]");
    if (act) {
      var intent = act.getAttribute("data-sl-quote-act");
      agentPanel.error = "";
      agentPanel.notice = "";
      act.disabled = true;

      var quoteUrl = agentQuoteProxyUrl;
      if (customerId) {
        quoteUrl += (quoteUrl.indexOf("?") === -1 ? "?" : "&") + "logged_in_customer_id=" + encodeURIComponent(customerId);
      }

      postJson(quoteUrl, { intent: intent, id: act.getAttribute("data-id") }).then(function (result) {
        if (!result.ok) {
          agentPanel.error = (result.body && result.body.message) || "That didn't work.";
        } else if (intent === "convert" && result.body.paymentLinkSent) {
          agentPanel.notice = "Payment link emailed to " + (result.body.paymentLinkSent.sentTo || "the customer") + ". The order is created once they pay.";
          loadPaymentLinks();
        } else if (intent === "send") {
          agentPanel.notice = "Quote sent to the customer.";
        }
        return loadAgentQuotes();
      });
      return;
    }

    // A manager decides a quote waiting for approval.
    var decide = event.target.closest("[data-sl-quote-decide]");
    if (decide) {
      var decision = decide.getAttribute("data-sl-quote-decide");
      var comment = window.prompt(decision === "reject" ? "Why are you rejecting this quote? (required)" : "Add a comment (optional)", "");
      if (comment === null || (decision === "reject" && !comment.trim())) return;

      agentPanel.error = "";
      postJson(agentQuoteApprovalsProxyUrl, { id: decide.getAttribute("data-id"), decision: decision, comment: comment }).then(function (result) {
        if (!result.ok) agentPanel.error = (result.body && result.body.message) || "Could not save that decision.";
        return loadQuoteApprovals();
      });
      return;
    }

    // The customer answers a quote sent to them.
    var reply = event.target.closest("[data-sl-quote-reply]");
    if (reply) {
      var action = reply.getAttribute("data-sl-quote-reply");
      var said = "";
      if (action === "changes") {
        said = window.prompt("What would you like changed?", "") || "";
        if (!said.trim()) return;
      } else if (action === "decline") {
        said = window.prompt("Tell us why (optional)", "");
        if (said === null) return;
      }

      postJson(customerQuoteProxyUrl, { id: reply.getAttribute("data-id"), action: action, comment: said }).then(function (result) {
        agentPanel.quoteMessage = result.ok
          ? { accept: "Quote accepted. Your sales contact will turn it into an order.", changes: "We've passed your request on.", decline: "Quote declined." }[action]
          : (result.body && result.body.message) || "That didn't work.";
        return loadBuyerQuotes();
      });
    }
  });

  // Ordering for a customer ships to that customer's addresses, not the
  // agent's own; leaving the context puts the agent's own back.
  function applyAddresses(list, defaultId) {
    addresses = list;
    defaultAddressId = defaultId != null ? defaultId : null;
    selectedAddressId = defaultAddressId != null ? defaultAddressId : (addresses[0] && addresses[0].id) || null;
  }

  function syncAgentAddresses(active) {
    if (!active) {
      applyAddresses(ownAddresses, ownDefaultAddressId);
      return Promise.resolve();
    }
    if (!agentAddressesProxyUrl) return Promise.resolve();
    return safeFetchJson(agentAddressesProxyUrl).then(function (result) {
      if (result.ok && result.body && result.body.active) {
        applyAddresses(result.body.addresses || [], result.body.defaultAddressId);
      } else {
        applyAddresses([], null);
      }
    });
  }

  function loadAgentSession() {
    if (!agentSessionProxyUrl || !hasCustomer) return Promise.resolve();
    return safeFetchJson(agentSessionProxyUrl).then(function (result) {
      var session = result.ok && result.body && result.body.active ? result.body : null;
      agentSessionCustomer = session && session.customer ? session.customer : null;
      renderAgentBanner(session);
      refreshFooter();
      loadAgentOverrides();
      loadAgentSummary();
      loadAgentQuotes();
      if (session && agentCartVersion === null && agentCartProxyUrl) {
        safeFetchJson(agentCartProxyUrl).then(function (saved) {
          if (agentCartVersion === null && saved.ok && saved.body && saved.body.version != null) agentCartVersion = saved.body.version;
        });
      }
      return syncAgentAddresses(!!session);
    });
  }

  // While the drawer is open and an agent is working on a customer, the
  // session is looked at again now and then. If it has ended (the account was
  // suspended or merged, access was taken away, the session ran out) or has
  // gone stale, the banner and the account list follow, without a reload.
  var agentWatchTimer = null;
  var agentWatchLast = "";

  function checkRemoteCartConflict() {
    if (!root.classList.contains("is-open") || !window.sparklayerAgentContextId || !agentCartProxyUrl || agentCartConflict) return;
    safeFetchJson(agentCartProxyUrl).then(function (saved) {
      if (!saved || !saved.ok || !saved.body || saved.body.version == null) return;
      if (agentCartVersion !== null && saved.body.version > agentCartVersion) {
        var mine = (cartData && cartData.items || []).map(function (item) {
          return { variantId: String(item.variant_id), quantity: item.quantity };
        });
        if (cartDiffText(mine, saved.body.items || []).length) {
          clearTimeout(agentCartSaveTimer);
          agentCartConflict = { items: saved.body.items || [], version: saved.body.version, mine: mine };
          if (activeTab === "cart" && currentStep === 0) renderCartLines();
        } else {
          agentCartVersion = saved.body.version;
        }
      }
    });
  }

  window.addEventListener("focus", checkRemoteCartConflict);

  function watchAgentSession() {
    if (agentWatchTimer) return;
    agentWatchTimer = setInterval(function () {
      if (!root.classList.contains("is-open") || !window.sparklayerAgentContextId || !agentSessionProxyUrl) return;

      checkRemoteCartConflict();

      var before = window.sparklayerAgentContextId;
      var activeConflict = agentCartConflict;
      safeFetchJson(agentSessionProxyUrl).then(function (result) {
        var session = result.ok && result.body && result.body.active ? result.body : null;
        var seen = session ? session.contextId + ":" + (session.state || "") : "none";
        var changed = !session || session.contextId !== before || (session.state === "STALE" && agentWatchLast !== seen);
        agentWatchLast = seen;
        if (!changed) return;

        // Another window started the same customer: this window is now looking at
        // that session. If its cart is not the one the server holds, that is a
        // clash to show (spec §9.1 "concurrent edits produce a visible conflict"),
        // not something to quietly overwrite.
        var mine = (cartData.items || []).map(function (item) {
          return { variantId: String(item.variant_id), quantity: item.quantity };
        });
        var checkClash = session && session.contextId !== before && agentCartProxyUrl && !activeConflict
          ? safeFetchJson(agentCartProxyUrl)
          : Promise.resolve(null);

        checkClash.then(function (saved) {
          return loadAgentSession().then(function () {
            if (!session) {
              loadAgentPanel();
              return;
            }
            if (activeConflict && !agentCartConflict) {
              agentCartConflict = activeConflict;
              if (activeTab === "cart" && currentStep === 0) renderCartLines();
            } else if (saved && saved.ok && saved.body && saved.body.version != null && cartDiffText(mine, saved.body.items || []).length) {
              agentCartConflict = { items: saved.body.items || [], version: saved.body.version, mine: mine };
              if (activeTab === "cart" && currentStep === 0) renderCartLines();
            }
          });
        });
      });
    }, 10000);
  }

  // After a change to the agent's role, access or the pricing rules the
  // context is STALE: they confirm it and carry on (spec §5.2).
  root.addEventListener("click", function (event) {
    if (!event.target.closest("[data-sl-agent-refresh]")) return;
    agentSessionPost({ intent: "refresh", contextId: window.sparklayerAgentContextId }).then(function () {
      return loadAgentSession();
    });
  });

  if (agentBannerEl) {
    agentBannerEl.addEventListener("click", function (event) {
      if (!event.target.closest("[data-sl-agent-exit]")) return;
      var contextId = window.sparklayerAgentContextId;
      // Save the customer's cart while the context is still live.
      var saved = contextId ? saveAgentCart() : Promise.resolve();
      renderAgentBanner(null);
      syncAgentAddresses(false);
      if (!contextId) return;
      // Leaving a customer clears the storefront cart so nothing built for
      // them carries over to the next account or the agent's own orders; the
      // saved copy comes back the next time that customer is entered.
      saved
        .then(function () {
          return safeFetchJson(agentSessionProxyUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ intent: "exit", contextId: contextId }),
          });
        })
        .then(function () {
          return fetch("/cart/clear.js", { method: "POST" }).catch(function () { });
        })
        .then(function () {
          cartMutationVersion++;
          setStep(0);
          return refreshCart();
        });
    });
  }

  function openDrawer() {
    if (typeof isNativeDawnActive === "function" && isNativeDawnActive()) {
      var dawn = getNativeHost().el;
      if (dawn && typeof dawn.open === "function") {
        try { dawn.open(); } catch (e) {}
      }
      syncDawnNativeDrawer();
      loadAgentSession();
      loadAgentPanel();
      loadBuyerQuotes();
      loadShoppingLists();
      refreshCart();
      fetchPaymentTerms();
      fetchCreditInfo();
      fetchCouponAvailability();
      return;
    }
    // Native theme drawer only: with no theme drawer there is nothing to open.
  }

  var isClosingDrawer = false;
  function closeDrawer() {
    console.log("🔴 [cart-drawer.js] closeDrawer() called, isClosingDrawer:", isClosingDrawer);
    if (isClosingDrawer) return;
    isClosingDrawer = true;
    setTimeout(function () { isClosingDrawer = false; }, 300);

    // Impulse: close through the theme's own close button so it also clears
    // html.js-drawer-open / lock-scroll and the page overlay.
    var impulseHost = getNativeHost();
    if (impulseHost && impulseHost.kind === "impulse" && impulseHost.el.classList.contains("drawer--is-open")) {
      var themeClose = impulseHost.el.querySelector(".js-drawer-close, .drawer__close button, .drawer__close a");
      if (themeClose) themeClose.click();
      setTimeout(function () {
        if (impulseHost.el.classList.contains("drawer--is-open")) {
          impulseHost.el.classList.remove("drawer--is-open");
          document.documentElement.classList.remove("js-drawer-open", "lock-scroll");
        }
      }, 400);
      document.dispatchEvent(new CustomEvent("sparklayer:drawer:closed"));
      return;
    }

    // Warehouse: close the way a shopper does, through the header's own cart toggle.
    var warehouseHost = getNativeHost();
    if (warehouseHost && warehouseHost.kind === "warehouse" && warehouseHost.el.getAttribute("aria-hidden") === "false") {
      var whToggles = document.querySelectorAll('[data-action="toggle-mini-cart"]');
      for (var wt = 0; wt < whToggles.length; wt++) {
        if (warehouseHost.el.contains(whToggles[wt]) || !whToggles[wt].getClientRects().length) continue;
        whToggles[wt].click();
        break;
      }
      // If the theme did not react to the click, shut it by hand.
      setTimeout(function () {
        if (warehouseHost.el.getAttribute("aria-hidden") === "false") {
          warehouseHost.el.setAttribute("aria-hidden", "true");
          var open = document.querySelectorAll('[data-action="toggle-mini-cart"][aria-expanded="true"]');
          for (var o = 0; o < open.length; o++) open[o].setAttribute("aria-expanded", "false");
        }
      }, 400);
      document.dispatchEvent(new CustomEvent("sparklayer:drawer:closed"));
      return;
    }

    // Prestige: close through the dialog's own hide() so it also unlocks the
    // page scroll (html.lock) and runs the theme's leave animation.
    var prestigeHost = getNativeHost();
    if (prestigeHost && prestigeHost.kind === "prestige" && prestigeHost.el.hasAttribute("open")) {
      if (typeof prestigeHost.el.hide === "function") {
        try { prestigeHost.el.hide(); } catch (e) {}
      } else {
        prestigeHost.el.removeAttribute("open");
      }
      document.dispatchEvent(new CustomEvent("sparklayer:drawer:closed"));
      return;
    }

    // 1. Dawn theme custom element <cart-drawer>
    var dawn = document.querySelector("cart-drawer");
    console.log("🔴 [cart-drawer.js] Dawn element:", dawn);
    if (dawn) {
      if (typeof dawn.close === "function") {
        try {
          dawn.close();
          console.log("🔴 [cart-drawer.js] dawn.close() invoked");
        } catch (e) {
          console.error("🔴 [cart-drawer.js] dawn.close() error:", e);
        }
      }
      dawn.classList.remove("active", "animate", "is-open");
      dawn.removeAttribute("open");
      dawn.setAttribute("aria-hidden", "true");
    }

    // 2. All theme drawer containers across themes (Horizon, Prestige, Impulse, etc.)
    var themeDrawers = document.querySelectorAll(
      "cart-drawer-component, theme-drawer, #CartDrawer, .cart-drawer, .drawer, #sidebar-cart, [data-cart-drawer], .drawer--cart, x-drawer[id*='cart']"
    );
    console.log("🔴 [cart-drawer.js] Found drawers to close:", themeDrawers.length);
    for (var i = 0; i < themeDrawers.length; i++) {
      var td = themeDrawers[i];
      if (td !== root) {
        if (typeof td.close === "function") {
          try { td.close(); } catch (e) {}
        }
        var dlg = td.querySelector && td.querySelector("dialog");
        if (dlg && typeof dlg.close === "function") {
          try { dlg.close(); } catch (e) {}
        }
        td.classList.remove("active", "animate", "is-open");
        td.removeAttribute("open");
        td.setAttribute("aria-hidden", "true");
      }
    }

    // 3. Trigger native overlay click if present to let theme run its cleanup
    var overlay = document.getElementById("CartDrawer-Overlay") || document.querySelector(".cart-drawer__overlay");
    if (overlay && typeof overlay.click === "function") {
      try {
        console.log("🔴 [cart-drawer.js] Clicking overlay:", overlay);
        overlay.click();
      } catch (e) {}
    }

    // 4. Close SparkLayer Root
    root.classList.remove("is-open", "is-expanded");

    // 5. Restore page body scrolling
    document.body.classList.remove("overflow-hidden", "sl-drawer-active");
    document.body.style.overflow = "";

    // 6. Reset any forms
    if (overrideForm || exForm) {
      overrideForm = null;
      exForm = null;
      setStep(0);
    }
    lastDawnIsOpen = false;
    document.dispatchEvent(new CustomEvent("sparklayer:drawer:closed"));
    console.log("🔴 [cart-drawer.js] closeDrawer() complete.");
  }

  window.__slCloseDrawer = function (e) {
    console.log("🔴 [cart-drawer.js] window.__slCloseDrawer called", e);
    if (e && typeof e.stopPropagation === "function") {
      e.stopPropagation();
      e.preventDefault();
    }
    closeDrawer();
  };

  // Product cards / embeds add to cart via raw /cart/add.js fetch
  // The product-card / PDP widgets add through /cart/add.js themselves, so the
  // theme never learns about it and keeps its drawer shut. Open it the way a
  // shopper would: through the theme's own cart icon (which also runs its
  // open animation). Skipped when it is already open, as the icon toggles.
  function isNativeDrawerOpen(host) {
    var el = host.el;
    // Only Horizon's panel is a <dialog>; for the others `inner` is just a wrapper
    // that can carry an unrelated `open` attribute.
    return el.hasAttribute("open") ||
      el.classList.contains("active") ||
      el.classList.contains("is-open") ||
      el.classList.contains("drawer--is-open") ||
      (host.kind === "horizon" && host.inner && host.inner.open === true) ||
      (host.kind === "warehouse" && el.getAttribute("aria-hidden") === "false");
  }

  function openNativeThemeDrawer() {
    var host = getNativeHost();
    if (!host || isNativeDrawerOpen(host)) return;
    // Dawn's <cart-drawer> has its own open(): use it straight away rather than
    // waiting on a header-icon click that may not be bound.
    if (host.kind === "dawn" && typeof host.el.open === "function") {
      try { host.el.open(); return; } catch (e) { /* fall back to the icon click below */ }
    }
    // If the icon click did not open it (the theme's handler may not be bound
    // yet, or may skip the click), call the drawer element's own open().
    setTimeout(function () {
      var now = getNativeHost();
      if (!now || isNativeDrawerOpen(now) || typeof now.el.open !== "function") return;
      slDebug("icon click did not open the drawer, calling open() directly");
      try { now.el.open(); } catch (e) { console.error("[SparkLayer] drawer open() failed:", e); }
    }, 300);
    var selectors = [
      '[data-action="toggle-mini-cart"]',
      "[data-cart-toggle]",
      "#cart-icon-bubble",
      '[aria-controls="cart-drawer"]',
      "a.navlink--cart",
      "cart-icon",
      'a[href="/cart"]',
      CART_TRIGGER_SELECTOR
    ];
    for (var s = 0; s < selectors.length; s++) {
      var triggers = document.querySelectorAll(selectors[s]);
      for (var i = 0; i < triggers.length; i++) {
        var trigger = triggers[i];
        // Skip anything inside the drawer itself (e.g. Broadcast's close button also
        // carries data-cart-toggle) and anything not actually shown.
        if (root.contains(trigger) || host.el.contains(trigger) || !trigger.getClientRects().length) continue;
        if (getComputedStyle(trigger).visibility === "hidden") continue;
        trigger.click();
        return;
      }
    }
  }

  document.addEventListener("sparklayer:cart:updated", function () {
    slDebug("cart:updated, native host =", (getNativeHost() || {}).kind);
    if (typeof isNativeDawnActive === "function" && isNativeDawnActive()) {
      // Open first; the cart and prices load while the panel slides in.
      try { openNativeThemeDrawer(); } catch (e) { console.error("[SparkLayer] drawer open failed:", e); }
      refreshCart().then(function () {
        slDebug("refreshCart done, items =", (cartData.items || []).length, "lines html =", (bodyEl.querySelector(".sl-cart-lines") || {}).innerHTML && bodyEl.querySelector(".sl-cart-lines").innerHTML.length);
        syncDawnNativeDrawer();
        openNativeThemeDrawer();
      }).catch(function (err) {
        console.error("[SparkLayer] cart refresh failed:", err);
        try { syncDawnNativeDrawer(); openNativeThemeDrawer(); } catch (e) {}
      });
      return;
    }
    // No theme drawer: an add to cart only refreshes data. The theme's own popup announces it.
    if (root.classList.contains("is-open")) {
      refreshCart();
    }
  });

  document.addEventListener("sparklayer:native:opened", function () {
    openDrawer();
  });
  document.addEventListener("sparklayer:native:closed", function () {
    if (root.classList.contains("is-open")) closeDrawer();
  });

  var CART_TRIGGER_SELECTOR = [
    'a[href*="/cart"]',
    'a[href$="/cart"]',
    '[data-testid="cart-drawer-trigger"]',
    '[aria-controls="cart-drawer"]',
    '[aria-controls="sidebar-cart"]',
    '[aria-controls*="cart"]',
    '[data-action="open-drawer"]',
    '[data-action="open-cart"]',
    '[data-drawer-id*="cart"]',
    '[data-drawer-id="sidebar-cart"]',
    "[data-cart-drawer-toggle]",
    "[data-cart-drawer-trigger]",
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
    ".header__icon--cart",
    ".header__icon-wrapper[href*='cart']",
    ".tap-area[href*='cart']"
  ].join(", ");

  window.addEventListener(
    "click",
    function (event) {
      var trigger = event.target.closest(CART_TRIGGER_SELECTOR);
      if (!trigger) return;
      if (root.contains(trigger)) return;

      if (typeof isNativeDawnActive === "function" && isNativeDawnActive()) {
        attachToDawnNow();
      }
      // No theme drawer: the theme's own behaviour (popup / cart page) is left alone.
    },
    true
  );

  var themeObserverBound = false;
  var lastDawnIsOpen = false;
  function bindThemeDrawerObserver() {
    if (themeObserverBound) return;
    var nativeDrawer = document.querySelector(
      "cart-drawer-component, #sidebar-cart, cart-drawer, theme-drawer, #CartDrawer, form#mini-cart.mini-cart, [data-cart-drawer], .drawer--cart, x-drawer[id*='cart']"
    );
    if (!nativeDrawer) return;
    themeObserverBound = true;

    var nativeObserver = new MutationObserver(function () {
      var isOpen =
        nativeDrawer.hasAttribute("open") ||
        nativeDrawer.getAttribute("aria-hidden") === "false" ||
        nativeDrawer.classList.contains("active") ||
        nativeDrawer.classList.contains("is-open") ||
        nativeDrawer.classList.contains("drawer--is-open") ||
        (nativeDrawer.querySelector && !!nativeDrawer.querySelector("dialog[open]"));

      // CRITICAL: Only trigger on closed -> open transition, never in a loop!
      if (isOpen === lastDawnIsOpen) return;
      lastDawnIsOpen = isOpen;

      if (isOpen) {
        if (typeof isNativeDawnActive === "function" && isNativeDawnActive()) {
          syncDawnNativeDrawer();
          loadAgentSession();
          loadAgentPanel();
          loadBuyerQuotes();
          loadShoppingLists();
          refreshCart();
          fetchPaymentTerms();
          fetchCreditInfo();
          fetchCouponAvailability();
        }
      }
    });

    // subtree: Horizon toggles `open` on the inner <dialog>, not the component.
    nativeObserver.observe(nativeDrawer, {
      attributes: true,
      attributeFilter: ["class", "open", "aria-hidden"],
      subtree: true
    });

    // Horizon morphs the drawer's DOM on every cart update, which drops our
    // mounted root and the marker attribute; put them back (idempotent).
    var remountDebounce = null;
    new MutationObserver(function () {
      if (!isNativeDawnActive()) return;
      var host = getNativeHost();
      if (host.kind === "dawn" || !host.inner) return;
      if (host.inner.contains(root) && host.inner.getAttribute("data-sl-native-inner") === host.kind) return;
      if (remountDebounce) clearTimeout(remountDebounce);
      remountDebounce = setTimeout(syncDawnNativeDrawer, 30);
    }).observe(nativeDrawer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-sl-native-inner"]
    });
  }

  // Horizon's own cart events (add to cart from PDP/cards, qty changes in the
  // theme UI) — SparkLayer's own edits use /cart/change.js and don't fire it.
  document.addEventListener("cart:update", function () {
    if (!isNativeDawnActive()) return;
    refreshCart().then(syncDawnNativeDrawer);
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", bindThemeDrawerObserver);
  } else {
    bindThemeDrawerObserver();
  }
  var bodyDrawerObserver = new MutationObserver(function () {
    if (!themeObserverBound) {
      bindThemeDrawerObserver();
      if (themeObserverBound) {
        bodyDrawerObserver.disconnect();
      }
    }
  });
  bodyDrawerObserver.observe(document.body, { childList: true });

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
    if (pricing && pricing.wholesalePrice != null) unit = pricing.wholesalePrice;
    var tierPrice = pricing ? pickTierPrice(pricing.tiers, line.quantity) : null;
    if (tierPrice != null && tierPrice < unit) {
      unit = tierPrice;
    }
    // An approved price exception for the customer replaces the price shown.
    var exception = typeof agentOverrideFor === "function" ? agentOverrideFor(line) : null;
    if (exception) {
      if (unit > msrp) msrp = unit;
      unit = exception.proposed.amount;
    }
    return { unit: unit, msrp: msrp };
  }

  function renderLine(line) {
    var displayPrice = lineDisplayPrice(line);
    var unitPrice = displayPrice.unit;
    var showMsrp = displayPrice.msrp > unitPrice;
    var lineTotal = unitPrice * line.quantity;
    // "SKU: X | Metal: Waterproof Stainless Steel | Color: Gold plated": the SKU first, then each
    // option with its name. Falls back to the plain variant title when the options are not in
    // the cart data.
    // The Color option goes on its own line below the rest.
    var realOptions = (line.options_with_values || [])
      .filter(function (o) { return o && o.value && o.value !== "Default Title"; });
    var isColor = function (o) { return /^colou?r$/i.test(String(o.name || "").trim()); };
    var optionParts = realOptions
      .filter(function (o) { return !isColor(o); })
      .map(function (o) { return o.name ? o.name + ": " + o.value : o.value; });
    var colorParts = realOptions
      .filter(isColor)
      .map(function (o) { return o.name + ": " + o.value; });
    if (!realOptions.length && line.variant_title && line.variant_title !== "Default Title") {
      optionParts = [line.variant_title];
    }
    // Color sits on its own line; when the drawer is expanded the CSS puts it back on the same
    // line, after a " | " separator (.sl-meta-sep is hidden otherwise).
    var metaMain = [line.sku ? "SKU: " + line.sku : null].concat(optionParts).filter(Boolean).join(" | ");
    var metaColor = colorParts.join(" | ");
    var metaHtml = escapeHtml(metaMain) +
      (metaColor
        ? (metaMain ? '<span class="sl-meta-sep"> | </span>' : "") +
          '<span class="sl-meta-color">' + escapeHtml(metaColor) + "</span>"
        : "");

    return (
      '<div class="sl-cart-line" data-line-key="' + escapeHtml(line.key) + '">' +
      '<div class="sl-cart-line-header">' +
      '<img src="' + escapeHtml(line.image || "") + '" alt="' + escapeHtml(line.product_title) + '" loading="lazy">' +
      '<div class="sl-cart-line-main">' +
      '<p class="sl-cart-line-title">' +
      (line.url || line.handle
        ? '<a class="sl-cart-line-link" href="' + escapeHtml(line.url || "/products/" + line.handle) + '">' + escapeHtml(line.product_title) + "</a>"
        : escapeHtml(line.product_title)) +
      "</p>" +
      (metaHtml ? '<p class="sl-cart-line-meta">' + metaHtml + "</p>" : "") +
      '<div class="sl-cart-line-actions">' +
      '<div class="sl-cart-qty">' +
      '<button type="button" data-sl-qty="-1">&minus;</button>' +
      '<input type="text" inputmode="numeric" pattern="[0-9]*" value="' + line.quantity + '" data-sl-qty-input>' +
      '<button type="button" data-sl-qty="1">+</button>' +
      "</div>" +
      '<button type="button" class="sl-cart-remove" data-sl-remove aria-label="' + escapeHtml(i18n.remove) + '">' + ICON_TRASH + "</button>" +
      "</div>" +
      "</div>" +
      '<div class="sl-cart-line-price">' +
      (pricingPending && !wholesalePricing[String(line.variant_id)]
        ? '<span class="sl-price sl-price-loading" aria-label="Loading price"></span>'
        : '<span class="sl-price">' + formatMoney(lineTotal) + "</span>" +
          '<span class="sl-per-unit">' + formatMoney(unitPrice) + escapeHtml(i18n.perUnit) + "</span>" +
          (showMsrp ? '<span class="sl-msrp">' + escapeHtml(i18n.msrp) + ": " + formatMoney(displayPrice.msrp) + "</span>" : "")) +
      "</div>" +
      "</div>" +
      agentLineHtml(line) +
      "</div>"
    );
  }

  function renderCartLines() {
    var linesEl = bodyEl.querySelector(".sl-cart-lines");
    if (!linesEl) return;

    var conflictHtml = listAddedBannerHtml() + cartConflictHtml();

    if (!cartData.items.length) {
      if (qo.saveListOpen) qo.saveListOpen = false;
      linesEl.innerHTML = conflictHtml + '<div class="sl-cart-empty">' + escapeHtml(i18n.empty) + "</div>";
    } else {
      linesEl.innerHTML = conflictHtml + cartData.items.map(renderLine).join("") + exceptionsHtml();
    }

    var subtotal = (cartData.items || []).reduce(function (sum, line) {
      return sum + lineDisplayPrice(line).unit * line.quantity;
    }, 0);

    var subtotalEl = footerEl.querySelector(".sl-cart-subtotal-amount");
    var subtotalCountEl = footerEl.querySelector(".sl-cart-subtotal-count");
    if (subtotalEl) subtotalEl.textContent = pricingPending ? "…" : formatMoney(subtotal);

    // An approved order discount is applied at checkout; the agent sees what it
    // comes to here, so the total they quote matches what the customer pays.
    var oldRows = footerEl.querySelector(".sl-cart-discount-rows");
    if (oldRows) oldRows.parentNode.removeChild(oldRows);
    var subtotalRow = subtotalEl && subtotalEl.parentNode;
    if (subtotalRow && window.sparklayerAgentContextId && cartData.items.length) {
      var approvedOff = (agentOverrides || []).reduce(function (sum, o) {
        var live = o.type === "ORDER_DISCOUNT" && (o.status === "APPROVED" || o.status === "AUTO_APPROVED");
        return live ? sum + Math.max(o.baseline.amount - o.proposed.amount, 0) : sum;
      }, 0);
      if (approvedOff > 0) {
        var rows = document.createElement("div");
        rows.className = "sl-cart-discount-rows";
        rows.innerHTML =
          '<div class="sl-cart-subtotal"><span>Approved discount</span><span>−' + escapeHtml(formatMoney(approvedOff)) + "</span></div>" +
          '<div class="sl-cart-subtotal"><strong>Total after discount</strong><strong>' + escapeHtml(formatMoney(Math.max(subtotal - approvedOff, 0))) + "</strong></div>";
        subtotalRow.parentNode.insertBefore(rows, subtotalRow.nextSibling);
      }
    }
    if (subtotalCountEl) {
      var lineWord = cartData.items.length === 1 ? i18n.line : i18n.lines;
      var itemWord = cartData.item_count === 1 ? i18n.item : i18n.items;
      subtotalCountEl.textContent = "(" + cartData.items.length + " " + lineWord + ", " + cartData.item_count + " " + itemWord + ")";
    }
    var qoActionsEl = bodyEl.querySelector("[data-sl-qo-actions]");
    if (qoActionsEl) qoActionsEl.innerHTML = quickOrderActionsInner();
  }

  function showToast(msg) {
    var oldToast = document.querySelector(".sl-native-toast");
    if (oldToast) oldToast.remove();

    var toast = document.createElement("div");
    toast.className = "sl-native-toast";
    toast.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 20 20" fill="#22c55e"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>' +
      '<span>' + escapeHtml(msg) + '</span>';
    document.body.appendChild(toast);
    setTimeout(function () {
      if (toast.parentElement) toast.remove();
    }, 3500);
  }

  // A white success card at the top right: green tick, message, a close X and a green bar that
  // runs down while it waits to disappear.
  function showNoticeToast(msg) {
    var old = document.querySelector(".sl-notice-toast");
    if (old) old.remove();

    var duration = 4000;
    var toast = document.createElement("div");
    toast.className = "sl-notice-toast";
    toast.setAttribute("role", "status");
    toast.innerHTML =
      '<div class="sl-notice-toast-row">' +
      '<svg class="sl-notice-toast-icon" width="26" height="26" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="12" fill="#1f8a63"/><path d="m7.5 12.5 3 3 6-7" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>' +
      '<span class="sl-notice-toast-text">' + escapeHtml(msg) + "</span>" +
      '<button type="button" class="sl-notice-toast-close" aria-label="Close">' +
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      "</button>" +
      "</div>" +
      '<div class="sl-notice-toast-bar" style="animation-duration:' + duration + 'ms"></div>';
    document.body.appendChild(toast);

    var timer = setTimeout(close, duration);
    function close() {
      clearTimeout(timer);
      if (toast.parentElement) toast.remove();
    }
    toast.querySelector(".sl-notice-toast-close").addEventListener("click", close);
  }

  function updateDawnLinePrices() {
    var dawn = document.querySelector("cart-drawer");
    if (!dawn || !cartData || !cartData.items) return;

    var dawnLines = Array.from(dawn.querySelectorAll(".cart-item, [id^='CartDrawer-Item-']"));
    var wholesaleSubtotal = 0;

    cartData.items.forEach(function (line, index) {
      var display = lineDisplayPrice(line);
      var unitPrice = display.unit;
      var msrp = display.msrp;
      var lineTotal = unitPrice * line.quantity;
      var retailTotal = msrp * line.quantity;
      wholesaleSubtotal += lineTotal;

      var matchedEl = null;
      for (var i = 0; i < dawnLines.length; i++) {
        var el = dawnLines[i];
        var attrId = el.dataset.variantId || el.dataset.id || el.getAttribute("data-key") || el.dataset.lineItemKey || el.id;
        if (attrId && String(attrId).indexOf(String(line.variant_id)) !== -1) {
          matchedEl = el;
          break;
        }
        if (line.handle && el.querySelector('a[href*="/products/' + line.handle + '"]')) {
          matchedEl = el;
          break;
        }
        var input = el.querySelector('input[name="updates[]"], input[name="quantity"], [data-quantity-variant-id]');
        if (input && (input.id.indexOf(String(line.variant_id)) !== -1 || input.dataset.quantityVariantId === String(line.variant_id))) {
          matchedEl = el;
          break;
        }
      }

      if (!matchedEl && dawnLines[index]) {
        matchedEl = dawnLines[index];
      }

      if (matchedEl) {
        var formattedWsp = formatMoney(lineTotal);
        var formattedMsrp = formatMoney(retailTotal);
        var isTier = display.unit < display.msrp;

        // 1. Line Total in right column
        var totalsEl = matchedEl.querySelector(".cart-item__totals");
        if (totalsEl) {
          var totalTarget = totalsEl.querySelector(".cart-item__price-wrapper, .price, .price--end") || totalsEl;
          var existingBadge = totalTarget.querySelector(".sl-b2b-price-badge");
          if (!existingBadge || existingBadge.dataset.wsp !== formattedWsp) {
            totalTarget.innerHTML =
              '<div class="sl-b2b-price-badge" data-wsp="' + formattedWsp + '">' +
                '<span class="sl-b2b-wholesale-price">' + formattedWsp + '</span>' +
                (lineTotal < retailTotal
                  ? '<s class="sl-b2b-msrp">' + formattedMsrp + '</s>'
                  : '') +
                (isTier ? '<span class="sl-b2b-tier-tag">Wholesale</span>' : '') +
              '</div>';
          }
        }

        // 2. Unit price under title in details
        var detailsPriceEl = matchedEl.querySelector(
          ".cart-item__details .cart-item__discounted-prices, .cart-item__details .cart-item__price-wrapper, .cart-item__details .product-option"
        );
        if (detailsPriceEl && isTier) {
          var unitWsp = formatMoney(display.unit);
          var unitMsrp = formatMoney(display.msrp);
          var existingUnitBadge = detailsPriceEl.querySelector(".sl-b2b-price-badge");
          if (!existingUnitBadge || existingUnitBadge.dataset.wsp !== unitWsp) {
            detailsPriceEl.innerHTML =
              '<div class="sl-b2b-price-badge" data-wsp="' + unitWsp + '">' +
                '<span class="sl-b2b-wholesale-price">' + unitWsp + '</span>' +
                '<s class="sl-b2b-msrp">' + unitMsrp + '</s>' +
              '</div>';
          }
        }
      }
    });

    var subtotalEls = dawn.querySelectorAll(
      ".totals__subtotal-value, .drawer__footer .price, [data-cart-subtotal]"
    );
    var formattedSub = formatMoney(wholesaleSubtotal);
    subtotalEls.forEach(function (subEl) {
      if (subEl.dataset.slSubtotal !== formattedSub) {
        subEl.dataset.slSubtotal = formattedSub;
        subEl.textContent = formattedSub;
      }
    });
  }

  function injectDawnSkuBar(dawn) {
    var target = dawn.querySelector("cart-drawer-items, #CartDrawer-CartItems, .cart-drawer__items, .cart-items");
    if (!target) return;
    var parent = target.parentElement;
    if (!parent || parent.querySelector(".sl-native-sku-bar")) return;

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

    parent.insertBefore(bar, target);

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
            if (!variants.length) {
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
                      '<p class="sl-native-sku-title">' + escapeHtml(pTitle + vTitle) + '</p>' +
                      '<p class="sl-native-sku-sub">' + escapeHtml((sku ? sku + ' · ' : '') + priceText) + '</p>' +
                    '</div>' +
                  '</div>' +
                  '<button type="button" class="sl-native-sku-add-btn" data-vid="' + v.id + '">+ Add</button>' +
                '</div>';
            });
            resultsEl.innerHTML = html;
            resultsEl.hidden = false;
          })
          .catch(function () { resultsEl.hidden = true; });
      }, 250);
    });

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
        refreshCart().then(function () {
          setTimeout(updateDawnLinePrices, 150);
          setTimeout(updateDawnLinePrices, 500);
        });
        document.dispatchEvent(new CustomEvent("cart:refresh"));
      })
      .catch(function () {
        addBtn.innerText = "+ Add";
        addBtn.disabled = false;
      });
    });

    barcodeBtn.addEventListener("click", function () {
      if (typeof openBarcodeScannerModal === "function") {
        openBarcodeScannerModal();
      } else {
        input.focus();
        input.placeholder = "Scan barcode with scanner or type SKU...";
      }
    });

    document.addEventListener("click", function (e) {
      if (!bar.contains(e.target)) resultsEl.hidden = true;
    });
  }

  function hookDawnCheckout(dawn) {
    var checkoutBtn = dawn.querySelector('#CartDrawer-Checkout, button[name="checkout"], .cart__checkout-button');
    if (!checkoutBtn || checkoutBtn.dataset.slB2bBound === "true") return;
    checkoutBtn.dataset.slB2bBound = "true";

    checkoutBtn.addEventListener("click", function (event) {
      if (!hasCustomer && !window.sparklayerAgentContextId) return;

      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();

      var origText = checkoutBtn.innerHTML;
      checkoutBtn.disabled = true;
      checkoutBtn.classList.add("sl-b2b-btn-loading");
      checkoutBtn.innerText = "Creating B2B Order...";

      var hasTerms = Boolean(eligiblePaymentTerms && eligiblePaymentTerms.length > 0);
      var isNet = hasTerms && (eligiblePaymentTerms.indexOf("NET_30") !== -1 || eligiblePaymentTerms.indexOf("NET_60") !== -1 || eligiblePaymentTerms.indexOf("NET_90") !== -1 || (netTermsDueInDays && netTermsDueInDays > 0));
      var payMethod = isNet ? "account" : (hasTerms ? "advance" : "pay_now");

      fetch(checkoutProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems: (cartData.items || []).map(function (it) {
            return { variant_id: it.variant_id, quantity: it.quantity };
          }),
          currency: (cartData && cartData.currency) || "USD",
          paymentMethod: payMethod,
          contextId: window.sparklayerAgentContextId || undefined
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
        checkoutBtn.disabled = false;
        checkoutBtn.classList.remove("sl-b2b-btn-loading");
        checkoutBtn.innerHTML = origText;
        window.location.href = "/checkout";
      });
    }, true);
  }

  function hookDawnFooter(dawn) {
    var checkoutBtn = dawn.querySelector('#CartDrawer-Checkout, button[name="checkout"], .cart__checkout-button');
    if (!checkoutBtn) return;
    var container = checkoutBtn.parentElement;
    if (!container) return;
    var footerRoot = container.parentElement;

    // 1. Remove any legacy terms notice element if present
    var oldNotice = (footerRoot && footerRoot.querySelector(".sl-b2b-terms-notice")) || container.querySelector(".sl-b2b-terms-notice");
    if (oldNotice) oldNotice.remove();

    // 2. Save as quote placed AFTER checkout button inside container
    var oldQuote = container.querySelector(".sl-native-quote-btn") || (footerRoot && footerRoot.querySelector(".sl-native-quote-btn"));
    if (oldQuote) oldQuote.remove();

    var quoteBtn = document.createElement("button");
    quoteBtn.type = "button";
    quoteBtn.className = "sl-native-quote-btn";
    quoteBtn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>' +
      '</svg>' +
      '<span>Save as quote</span>';

    quoteBtn.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (!cartData || !cartData.items || !cartData.items.length) {
        showToast("Cart is empty");
        return;
      }
      var origText = quoteBtn.innerHTML;
      quoteBtn.innerText = "Saving quote...";
      quoteBtn.disabled = true;

      fetch(customerQuoteProxyUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          customerId: customerId,
          currency: (cartData && cartData.currency) || "USD",
          lineItems: (cartData.items || []).map(function (it) {
            return { variant_id: it.variant_id, quantity: it.quantity };
          })
        })
      })
      .then(function (res) { return res.json(); })
      .then(function () {
        quoteBtn.disabled = false;
        quoteBtn.innerHTML = origText;
        showToast("Quote saved successfully!");
      })
      .catch(function () {
        quoteBtn.disabled = false;
        quoteBtn.innerHTML = origText;
        showToast("Quote saved successfully!");
      });
    });

    container.appendChild(quoteBtn);
    hookDawnCheckout(dawn);
  }

  // Warehouse's dropdown hangs from the header, so it can use everything from where it starts
  // down to the bottom of the window. Measure that and hand it to the CSS (--sl-wh-avail).
  var warehouseFitBound = false;
  function fitWarehouseHeight() {
    var host = getNativeHost();
    if (!host || host.kind !== "warehouse") return;
    var top = host.el.getBoundingClientRect().top;
    var avail = Math.max(320, Math.floor(window.innerHeight - top - 12));
    host.el.style.setProperty("--sl-wh-avail", avail + "px");
  }
  function bindWarehouseFit() {
    if (warehouseFitBound) return;
    warehouseFitBound = true;
    window.addEventListener("resize", fitWarehouseHeight);
    window.addEventListener("scroll", fitWarehouseHeight, { passive: true });
  }

  function attachToDawnNow() {
    var host = getNativeHost();
    if (!host || !host.inner) return;
    var inner = host.inner;

    if (!inner.contains(root)) {
      root.classList.add("sl-native-mode");
      inner.appendChild(root);
    }

    if (host.kind !== "dawn") {
      // CSS hides every other child of the panel, so nodes the theme re-renders
      // into it stay hidden without per-class selectors.
      if (inner.getAttribute("data-sl-native-inner") !== host.kind) {
        inner.setAttribute("data-sl-native-inner", host.kind);
      }
      // Dawn's cart-drawer visibility rules skip any element carrying the marker.
      if (host.el !== inner && host.el.getAttribute("data-sl-native-inner") !== host.kind) {
        host.el.setAttribute("data-sl-native-inner", host.kind);
      }
      // Warehouse's panel is a <form>: stop anything inside it from submitting
      // to /cart (SparkLayer drives checkout itself).
      if (host.kind === "warehouse" && !host.el.hasAttribute("data-sl-no-submit")) {
        host.el.setAttribute("data-sl-no-submit", "1");
        host.el.addEventListener("submit", function (e) { e.preventDefault(); }, true);
      }
      if (host.kind === "warehouse") {
        bindWarehouseFit();
        fitWarehouseHeight();
      }
      // No theme variables known for this panel: take its real text colour.
      // (currentColor can't be used in the stylesheet — it would resolve per
      // element, e.g. to the white check badge, and hide it.)
      if (host.kind === "inner") {
        var panelColor = getComputedStyle(inner).color;
        if (panelColor) {
          root.style.setProperty("--sln-text", panelColor);
          root.style.setProperty("--sln-muted", "color-mix(in srgb, " + panelColor + " 65%, transparent)");
          root.style.setProperty("--sln-border", "color-mix(in srgb, " + panelColor + " 18%, transparent)");
        }
      }
      return;
    }

    var dawnHeader = inner.querySelector(".drawer__header");
    if (dawnHeader) dawnHeader.style.setProperty("display", "none", "important");
    var dawnItems = inner.querySelector("cart-drawer-items");
    if (dawnItems) dawnItems.style.setProperty("display", "none", "important");
    var dawnFooter = inner.querySelector(".drawer__footer");
    if (dawnFooter) dawnFooter.style.setProperty("display", "none", "important");
    var dawnWarnings = inner.querySelector(".cart-drawer__warnings");
    if (dawnWarnings) dawnWarnings.style.setProperty("display", "none", "important");
    var dawnEmpty = inner.querySelector(".drawer__inner-empty");
    if (dawnEmpty) dawnEmpty.style.setProperty("display", "none", "important");
  }

  function attachToNativeThemeDrawer() {
    if (isNativeDawnActive()) {
      attachToDawnNow();
      return;
    }
    root.classList.remove("sl-native-mode");
  }

  var syncDawnDebounce = null;
  function syncDawnNativeDrawer() {
    if (!isNativeDawnActive()) return;
    attachToDawnNow();
    if (syncDawnDebounce) clearTimeout(syncDawnDebounce);
    syncDawnDebounce = setTimeout(function () {
      var host = getNativeHost();
      if (!host || !host.inner) return;
      var dawn = host.el;
      var inner = host.inner;

      // Mounts root and hides the theme's own header/items/footer
      attachToDawnNow();

      // Safety net: an open theme dialog with no size means the native
      // mount is invisible, so fall back to the SparkLayer overlay.
      if (host.kind === "horizon") {
        setTimeout(function () {
          var dr = inner.getBoundingClientRect();
          if (inner.open && (dr.width === 0 || dr.height === 0)) {
            nativeFailed = true;
            console.warn("[SparkLayer] Native drawer rendered at 0 size, falling back to the SparkLayer drawer.");
            inner.removeAttribute("data-sl-native-inner");
            try { inner.close(); } catch (e) {}
            root.classList.remove("sl-native-mode");
            document.body.appendChild(root);
            openDrawer();
          }
        }, 600);
      }

      if (activeTab === "account") {
        root.classList.remove("is-cart-tab");
        root.classList.add("is-account-tab");
        dawn.classList.add("is-account-tab");
        dawn.classList.remove("is-cart-tab");
        stepsEl.innerHTML = "";
        stepsEl.hidden = true;
        footerEl.innerHTML = "";
        if (bodyEl) {
          if (accountView === "dashboard") bodyEl.innerHTML = renderAccountDashboardBody();
          else if (accountView === "orders") bodyEl.innerHTML = renderAccountOrdersListBody();
          else if (accountView === "reports") bodyEl.innerHTML = renderAccountReportsBody();
          else bodyEl.innerHTML = renderAccountDashboardBody();
        }
      } else {
        root.classList.add("is-cart-tab");
        root.classList.remove("is-account-tab");
        dawn.classList.remove("is-account-tab");
        dawn.classList.add("is-cart-tab");
        if (!bodyEl.children || !bodyEl.children.length) {
          setStep(0);
        }
      }

      var heading = inner.querySelector(".drawer__heading");
      if (heading) heading.style.display = "none";

      if (tabsEl) {
        tabsEl.innerHTML = renderTabsHtml();
      }
    }, 25);
  }

  function isValidCart(cart) {
    return !!cart && Array.isArray(cart.items);
  }

  function fetchWholesalePricing(variantIds) {
    if (!variantPricingProxyUrl || !variantIds.length) {
      wholesalePricing = {};
      return Promise.resolve();
    }
    // The proxy round trip is slow, so prices fetched in the last minute are
    // reused and only the variants not seen yet are asked for.
    var now = Date.now();
    var stale = variantIds.filter(function (id) {
      var at = wholesalePricingAt[String(id)];
      return !at || now - at > 60000 || !wholesalePricing[String(id)];
    });
    if (!stale.length) return Promise.resolve();
    variantIds = stale;
    var url = variantPricingProxyUrl + "?ids=" + encodeURIComponent(variantIds.join(","));
    // The cart's currency picks which per-currency wholesale price the server reads.
    if (cartData && cartData.currency) {
      url += "&currency=" + encodeURIComponent(cartData.currency);
    }
    return fetch(url)
      .then(function (res) { return res.json(); })
      .then(function (body) {
        var next = wholesalePricing;
        (body.variants || []).forEach(function (v) {
          wholesalePricingAt[String(v.variantId)] = Date.now();
          next[String(v.variantId)] = {
            price: v.price != null ? Math.round(v.price * 100) : null,
            wholesalePrice: v.wholesalePrice != null ? Math.round(v.wholesalePrice * 100) : null,
            tiers: (v.tiers || []).map(function (t) {
              return { minQuantity: t.minQuantity, price: Math.round(t.price * 100) };
            }),
            taxable: v.taxable !== false,
            taxesIncluded: v.taxesIncluded === true,
          };
        });
        wholesalePricing = next;
      })
      .catch(function () { /* keep whatever prices are already known */ });
  }

  // The theme's own header cart-icon custom element (Horizon: cart-icon.js)
  // exposes renderCartBubble() publicly and already handles the DOM update,
  // sessionStorage sync, and animation correctly — we just need to call it
  // whenever we mutate the cart outside the native theme flow, since that
  // element only listens for Shopify's native cart events by default.
  // Turn on with localStorage.slDebug = "1" to trace the header count update.
  function slDebug() {
    try {
      if (window.localStorage && window.localStorage.getItem("slDebug")) {
        console.log.apply(console, ["[SparkLayer header]"].concat(Array.prototype.slice.call(arguments)));
      }
    } catch (e) {}
  }

  function syncHeaderCartIcon(itemCount) {
    slDebug("syncHeaderCartIcon called, count =", itemCount);
    var handled = false;
    document.querySelectorAll("cart-icon").forEach(function (icon) {
      if (typeof icon.renderCartBubble === "function") {
        icon.renderCartBubble(itemCount);
        handled = true;
      }
    });
    slDebug("theme cart-icon handled it:", handled);
    if (!handled) {
      setThemeCountDirect(itemCount);
      syncThemeCartCount();
    }
  }

  // Sets the number straight on the theme's count element (<cart-count
  // data-cart-count="4">4</cart-count> and similar leaf elements), outside the
  // drawer. Instant, and needs no server round trip.
  function setThemeCountDirect(count) {
    if (typeof count !== "number" || isNaN(count)) return;
    var host = getNativeHost();
    // .header__cart-count is Warehouse's bare <span>0</span> beside the cart icon.
    document.querySelectorAll("cart-count, [data-cart-count], .header__cart-count").forEach(function (el) {
      if (root.contains(el) || (host && host.el && host.el.contains(el))) return;
      if (el.children.length) return;
      el.setAttribute("data-cart-count", String(count));
      el.textContent = String(count);
      el.style.display = "";
    });
    // Dawn-family bubble: <div class="cart-count-bubble"><span aria-hidden>3</span>
    // <span class="visually-hidden">3 items</span></div>. The number is in a child.
    document.querySelectorAll(".cart-count-bubble, .cart-link__bubble").forEach(function (el) {
      if (root.contains(el) || (host && host.el && host.el.contains(el))) return;
      var shown = el.querySelector('span[aria-hidden="true"]');
      var spoken = el.querySelector(".visually-hidden");
      if (shown) shown.textContent = String(count);
      else if (!el.children.length) el.textContent = String(count);
      if (spoken) spoken.textContent = count + (count === 1 ? " item" : " items");
      el.style.display = count > 0 ? "" : "none";
    });
    slDebug("set count directly:", count);
  }

  // Every other theme only redraws its header count on its own cart events, so
  // a cart change made here would show only after a page refresh. The header
  // section is re-rendered by the server (Section Rendering API, which reads the
  // cart cookie we just changed) and only the count bubble is copied over, so
  // the theme's own icon and listeners stay untouched.
  var THEME_COUNT_SELECTOR = [
    ".cart-count-bubble",
    ".cart-link__bubble",
    "cart-count",
    ".header__cart-count",
    "[data-cart-count]",
    "[data-header-cart-count]",
    '[class*="cart-count" i]',
    '[class*="count-bubble" i]',
    '[class*="cart-bubble" i]'
  ].join(", ");
  var THEME_CART_ICON_SELECTOR = [
    "#cart-icon-bubble",
    "[data-cart-toggle]",
    ".header__icon--cart",
    '[aria-controls="cart-drawer"]',
    'a[href$="/cart"]',
    'a[class*="cart-link" i]',
    'a[class*="cart-icon" i]',
    'button[class*="cart-icon" i]'
  ].join(", ");
  var themeCountTimer = null;

  // Updates the theme's own count element in place. Replacing it would create a
  // new custom element (Broadcast's <cart-count>) that can redraw itself from
  // its own stale state; changing the attributes and text keeps the instance.
  function copyCountNode(live, fresh) {
    if (live.tagName !== fresh.tagName) {
      live.replaceWith(document.importNode(fresh, true));
      return;
    }
    Array.prototype.slice.call(live.attributes).forEach(function (attr) {
      if (!fresh.hasAttribute(attr.name) && attr.name !== "style") live.removeAttribute(attr.name);
    });
    Array.prototype.slice.call(fresh.attributes).forEach(function (attr) {
      live.setAttribute(attr.name, attr.value);
    });
    live.innerHTML = fresh.innerHTML;
    live.style.display = "";
  }

  function syncThemeCartCount() {
    clearTimeout(themeCountTimer);
    themeCountTimer = setTimeout(function () {
      var host = getNativeHost();
      var outside = function (el) {
        return !root.contains(el) && !(host && host.el && host.el.contains(el));
      };
      var ids = [];
      document.querySelectorAll(THEME_CART_ICON_SELECTOR + ", " + THEME_COUNT_SELECTOR).forEach(function (el) {
        var section = el.closest('[id^="shopify-section-"]');
        if (!section || !outside(el)) return;
        var id = section.id.replace("shopify-section-", "");
        if (ids.indexOf(id) === -1) ids.push(id);
      });
      slDebug("header sections found:", ids);
      if (!ids.length) return;

      fetch(window.location.pathname + "?sections=" + encodeURIComponent(ids.join(",")), {
        headers: { Accept: "application/json" }
      })
        .then(function (res) { return res.json(); })
        .then(function (data) {
          ids.forEach(function (id) {
            var liveSection = document.getElementById("shopify-section-" + id);
            slDebug("section", id, "live:", !!liveSection, "fresh html:", !!(data && data[id]));
            if (!liveSection || !data || !data[id]) return;
            var fresh = new DOMParser().parseFromString(data[id], "text/html").body;
            var pick = function (scope, selector, keep) {
              return Array.prototype.filter.call(scope.querySelectorAll(selector), keep || function () { return true; });
            };

            // Icons: copy the count into the matching icon (creating it when the
            // cart was empty and the theme drew no bubble at all).
            var liveIcons = pick(liveSection, THEME_CART_ICON_SELECTOR, outside);
            var freshIcons = pick(fresh, THEME_CART_ICON_SELECTOR);
            liveIcons.forEach(function (icon, i) {
              var match = freshIcons[i];
              if (!match || match.tagName !== icon.tagName) return;
              var liveCount = icon.matches(THEME_COUNT_SELECTOR) ? null : icon.querySelector(THEME_COUNT_SELECTOR);
              var freshCount = match.matches(THEME_COUNT_SELECTOR) ? null : match.querySelector(THEME_COUNT_SELECTOR);
              if (freshCount && liveCount) copyCountNode(liveCount, freshCount);
              else if (freshCount) icon.appendChild(document.importNode(freshCount, true));
              else if (liveCount) liveCount.style.display = "none";
            });

            // Counts that sit beside the icon instead of inside it.
            var liveCounts = pick(liveSection, THEME_COUNT_SELECTOR, outside);
            var freshCounts = pick(fresh, THEME_COUNT_SELECTOR);
            slDebug("icons live/fresh:", liveIcons.length, freshIcons.length, "counts live/fresh:", liveCounts.length, freshCounts.length);
            liveCounts.forEach(function (node, i) {
              if (freshCounts[i] && freshCounts[i].tagName === node.tagName) {
                copyCountNode(node, freshCounts[i]);
              } else if (!freshCounts[i]) {
                node.style.display = "none";
              }
            });
          });
        })
        .catch(function (err) {
          slDebug("header sync failed:", err && err.message);
        });
    }, 120);
  }

  // The header must follow every cart change, whichever path made it (our widgets,
  // the drawer, the product page, the theme's own buttons), so this does not
  // depend on the drawer's own refresh: it watches the cart requests themselves.
  function syncHeaderFromCart() {
    fetch("/cart.js", { headers: { Accept: "application/json" } })
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        if (!cart || typeof cart.item_count !== "number") return;
        slDebug("header count from /cart.js:", cart.item_count);
        if (document.querySelector("cart-icon")) {
          syncHeaderCartIcon(cart.item_count);
        } else {
          setThemeCountDirect(cart.item_count);
          syncThemeCartCount();
        }
      })
      .catch(function () {});
  }

  document.addEventListener("sparklayer:cart:updated", function () {
    setTimeout(syncHeaderFromCart, 60);
  });

  var CART_MUTATION_URL = new RegExp("/cart/(add|change|update|clear)(\\.js)?([?]|$)");

  (function watchCartRequests() {
    if (window.__slCartWatch || typeof window.fetch !== "function") return;
    window.__slCartWatch = true;
    var originalFetch = window.fetch;
    window.fetch = function (input) {
      var result = originalFetch.apply(this, arguments);
      try {
        var url = typeof input === "string" ? input : input && input.url;
        if (url && CART_MUTATION_URL.test(url)) {
          result.then(function () { setTimeout(syncHeaderFromCart, 150); }, function () {});
        }
      } catch (e) {}
      return result;
    };
  })();

  // Neither /cart.js nor /cart/change.js requests are sequenced, so quick
  // successive actions (a qty +/- click before the previous one resolves, or
  // a PDP add-to-cart landing mid-edit) can have their responses arrive out
  // of order. Without a guard, a slower, now-stale response can resolve last
  // and clobber cartData/the header count with an outdated total even though
  // a newer request already returned the real one. This counter makes only
  // the most recently *issued* request allowed to apply its result.
  var cartMutationVersion = 0;

  // One idempotency key per checkout attempt: a double click or a retry after
  // a slow response reuses it, so the store returns the first result instead
  // of creating a second order. It changes when the cart changes and is
  // dropped once an order is placed.
  var checkoutAttemptKey = null;
  var checkoutAttemptVersion = -1;

  function newIdempotencyKey() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") return window.crypto.randomUUID();
    return "k-" + Date.now() + "-" + Math.random().toString(36).slice(2);
  }

  function currentCheckoutKey() {
    if (!checkoutAttemptKey || checkoutAttemptVersion !== cartMutationVersion) {
      checkoutAttemptKey = newIdempotencyKey();
      checkoutAttemptVersion = cartMutationVersion;
    }
    return checkoutAttemptKey;
  }

  function refreshCart() {
    var requestVersion = ++cartMutationVersion;
    return fetch("/cart.js")
      .then(function (res) { return res.json(); })
      .then(function (cart) {
        if (!isValidCart(cart) || requestVersion !== cartMutationVersion) return;
        cartData = cart;
        syncHeaderCartIcon(cart.item_count);
        scheduleAgentCartSave();
        var variantIds = (cart.items || []).map(function (item) { return item.variant_id; });
        // Lines show straight away; only the price waits for the (slow) pricing
        // call, so an unpriced line shows a placeholder instead of the MSRP.
        pricingPending = variantIds.some(function (id) { return !wholesalePricing[String(id)]; });
        if (pricingPending && currentStep === 0) renderCartLines();
        return fetchWholesalePricing(variantIds).then(function () {
          pricingPending = false;
          if (currentStep === 0) renderCartLines();
          if (typeof updateDawnLinePrices === "function" && isNativeDawnActive()) updateDawnLinePrices();
        });
      });
  }

  // Updates the local cart snapshot immediately (before the network request
  // resolves) so a rapid second +/- click or keystroke computes its delta
  // off the just-changed quantity instead of the stale value still sitting
  // in cartData from before the first request was even sent.
  function applyOptimisticQuantity(key, quantity) {
    var line = (cartData.items || []).filter(function (i) { return i.key === key; })[0];
    if (!line) return;
    cartData.item_count = Math.max(0, (cartData.item_count || 0) + (quantity - line.quantity));
    line.quantity = quantity;
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
        scheduleAgentCartSave();
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

  // ---- quick order (spec §4.5): paste a list of SKUs or barcodes with
  // quantities, or scan barcodes with the camera. Every row is checked on its
  // own; the good ones go into the cart and each bad one says why.

  var qo = { open: false, menu: false, text: "", rows: null, busy: false, message: "", scan: false, scanMessage: "", tab: "sku", saveListOpen: false, saveListMessage: "", saveListName: "" };
  var qoStream = null;
  var qoTimer = null;

  var QO_ERRORS = {
    INVALID_QUANTITY: "Quantity must be a whole number from 1 to 9999",
    INVALID_CODE: "That code has characters we can't search for",
    NOT_FOUND: "No item with this SKU or barcode",
    AMBIGUOUS: "This code matches more than one item",
    UNAVAILABLE: "Not available to order",
    ADD_FAILED: "Couldn't be added (stock?)",
  };

  function quickOrderHtml() {
    return '<div class="sl-qo" data-sl-qo>' + quickOrderInner() + "</div>";
  }

  function ensureBarcodeDetector() {
    if (window.BarcodeDetector && typeof window.BarcodeDetector === "function") return true;
    if (window.ZXing && window.ZXing.BrowserMultiFormatReader) {
      window.BarcodeDetector = function BarcodeDetector() {
        var reader = new window.ZXing.BrowserMultiFormatReader();
        this.detect = function (video) {
          return new Promise(function (resolve) {
            try {
              var res = reader.decode(video);
              if (res && typeof res.getText === "function" && res.getText()) {
                return resolve([{ rawValue: res.getText() }]);
              }
              resolve([]);
            } catch (e) {
              resolve([]);
            }
          });
        };
      };
      return true;
    }
    return false;
  }

  function loadBarcodeScanner(callback) {
    if (ensureBarcodeDetector()) return callback();
    var s = document.createElement("script");
    s.src = "https://unpkg.com/@zxing/library@0.21.3/umd/index.min.js";
    s.onload = function () {
      ensureBarcodeDetector();
      callback();
    };
    s.onerror = function () {
      callback();
    };
    document.head.appendChild(s);
  }

  function scanSupported() {
    ensureBarcodeDetector();
    return !!(
      (window.BarcodeDetector || window.ZXing || (navigator.mediaDevices && navigator.mediaDevices.getUserMedia))
    );
  }

  // "Actions" menu (SparkLayer's My Cart has the same): upload a file, paste
  // rows, scan barcodes.
  function quickOrderActionsInner() {
    if (!quickOrderProxyUrl && !agentPanel.isAgent) return "";
    var hasItems = !!(cartData.items && cartData.items.length);
    return (
      (scanSupported()
        ? '<button type="button" class="sl-qo-scan-btn" data-sl-qo-scan title="' + (qo.scan ? "Stop scanning" : "Scan a barcode with the camera") + '" aria-label="Scan a barcode">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M11 8v8M15 8v8"/></svg></button>'
        : "") +
      '<button type="button" class="sl-qo-actions-btn" data-sl-qo-menu aria-haspopup="true" aria-expanded="' + (qo.menu ? "true" : "false") + '">Actions' +
      '<svg class="sl-qo-actions-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">' +
      '<path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>' +
      "</svg></button>" +
      (qo.menu
        ? '<div class="sl-qo-menu">' +
        '<button type="button" data-sl-qo-toggle>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
        'Upload CSV file' +
        '</button>' +
        '<button type="button" data-sl-sl-save' + (hasItems ? '' : ' disabled') + '>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>' +
        'Save shopping list' +
        '</button>' +
        '<button type="button" data-sl-qo-clear' + (hasItems ? '' : ' disabled') + '>' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>' +
        'Clear cart' +
        '</button>' +
        (shoppingLists && shoppingLists.length
          ? '<div class="sl-qo-menu-divider"></div>' +
            '<div class="sl-qo-menu-label">Shopping lists</div>' +
            '<button type="button" class="sl-qo-menu-plain" data-sl-sl-viewall>View All</button>' +
            shoppingLists.slice(0, 5).map(function (l) {
              return '<button type="button" class="sl-qo-menu-plain" data-sl-sl-add="' + escapeHtml(l.id) + '" title="' + escapeHtml(l.name) + '">' +
                '<span class="sl-qo-menu-name">' + escapeHtml(l.name) + "</span></button>";
            }).join("")
          : "") +
        "</div>"
        : "") +
      '<input type="file" accept=".csv,.txt,text/csv,text/plain" hidden data-sl-qo-file-input>' +
      '<input type="file" accept="image/*" hidden data-sl-qo-photo-input>' +
      '<input type="file" accept="image/*" capture="environment" hidden data-sl-qo-photo-input data-sl-qo-photo-camera>'
    );
  }

  function quickOrderInner() {
    if (!quickOrderProxyUrl && !agentPanel.isAgent) return "";
    var html = "";

    if (qo.scan) {
      var isMobile = !!((window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
      html += '<div class="sl-qo-scan-wrapper">' +
        '<div class="sl-qo-scan-viewport">' +
        '<video data-sl-qo-video playsinline muted></video>' +
        '<button type="button" class="sl-qo-scan-x" data-sl-qo-close-scan aria-label="Close the scanner">' +
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>' +
        "</button>" +
        '<div class="sl-qo-scan-overlay">' +
        '<div class="sl-qo-scan-reticle">' +
        '<span class="sl-corner top-left"></span>' +
        '<span class="sl-corner top-right"></span>' +
        '<span class="sl-corner bottom-left"></span>' +
        '<span class="sl-corner bottom-right"></span>' +
        '<div class="sl-qo-scan-laser"></div>' +
        '</div>' +
        '</div>' +
        '</div>' +
        '<div class="sl-qo-scan-footer">' +
        '<span class="sl-qo-scan-hint">' +
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 8v8M11 8v8M15 8v8"/></svg> ' +
        escapeHtml(qo.scanMessage || "Align barcode inside frame") +
        '</span>' +
        '<div class="sl-qo-scan-btns">' +
        (isMobile ? '<button type="button" class="sl-qo-scan-action-btn" data-sl-qo-flip><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 10c0-4.4-3.6-8-8-8s-8 3.6-8 8v1M4 14c0 4.4 3.6 8 8 8s8-3.6 8-8v-1"/><path d="m1 11 3 3 3-3M23 13l-3-3-3 3"/></svg> Flip</button>' : '') +
        '<button type="button" class="sl-qo-scan-action-btn" data-sl-qo-photo="gallery"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg> Upload Image</button>' +
        '</div>' +
        '</div>' +
        '</div>';
    }

    if (qo.saveListOpen && cartData.items && cartData.items.length) {
      html +=
        '<div class="sl-qo-panel" style="border:1px solid #e2e8f0;border-radius:4px;padding:16px;margin:12px 0;background:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<h4 style="font-size:15px;font-weight:600;color:#1e293b;margin:0;">Save cart as shopping list</h4>' +
        '<button type="button" data-sl-sl-save-close aria-label="Close" style="background:none;border:none;color:#64748b;cursor:pointer;padding:2px 4px;display:flex;align-items:center;">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '</div>' +
        '<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 14px 0;">' +
        "You can save this cart as a shopping list, making it easy to re-order the same items again in the future" +
        '</p>' +
        '<div style="display:flex;align-items:stretch;width:100%;">' +
        '<input type="text" data-sl-sl-save-name placeholder="Enter list name" value="' + escapeHtml(qo.saveListName || "") + '" style="flex:1;height:38px;border:1px solid #cbd5e1;border-right:none;border-radius:4px 0 0 4px;padding:0 12px;font-size:13px;outline:none;box-sizing:border-box;color:#1e293b;">' +
        '<button type="button" data-sl-sl-save-submit' + (qo.busy ? ' disabled' : '') + ' style="height:38px;border:1px solid #cbd5e1;border-radius:0 4px 4px 0;background:#ffffff;padding:0 18px;font-size:13px;font-weight:500;color:#334155;cursor:pointer;white-space:nowrap;">' +
        (qo.busy ? 'Saving...' : 'Save') +
        '</button>' +
        '</div>' +
        (qo.saveListMessage ? '<p class="sl-agent-error" role="alert" style="margin-top:10px;">' + escapeHtml(qo.saveListMessage) + '</p>' : '') +
        '</div>';
    }

    if (qo.open) {
      var isSku = (qo.tab || "sku") === "sku";
      html +=
        '<div class="sl-qo-panel" style="border:1px solid #e2e8f0;border-radius:4px;padding:16px;margin:12px 0;background:#ffffff;box-shadow:0 1px 3px rgba(0,0,0,0.05);">' +
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
        '<h4 style="font-size:15px;font-weight:600;color:#1e293b;margin:0;">Upload CSV File</h4>' +
        '<button type="button" data-sl-qo-close-panel aria-label="Close" style="background:none;border:none;color:#64748b;cursor:pointer;padding:2px 4px;display:flex;align-items:center;">' +
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
        '</button>' +
        '</div>' +
        '<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 14px 0;">' +
        "Save time by uploading your cart via a CSV file. Simply create and save the CSV, ensuring it has column titles that match below, and click the 'Upload CSV File' button" +
        '</p>' +
        '<div style="display:inline-flex;gap:8px;margin-bottom:14px;">' +
        '<button type="button" data-sl-qo-tab="sku" style="font-size:12px;padding:5px 12px;border-radius:6px;cursor:pointer;border:1px solid ' + (isSku ? "#cbd5e1" : "transparent") + ';background:' + (isSku ? "#f1f5f9" : "transparent") + ';color:' + (isSku ? "#1e293b" : "#64748b") + ';font-weight:' + (isSku ? "600" : "500") + ';">Using a SKU</button>' +
        '<button type="button" data-sl-qo-tab="barcode" style="font-size:12px;padding:5px 12px;border-radius:6px;cursor:pointer;border:1px solid ' + (!isSku ? "#cbd5e1" : "transparent") + ';background:' + (!isSku ? "#f1f5f9" : "transparent") + ';color:' + (!isSku ? "#1e293b" : "#64748b") + ';font-weight:' + (!isSku ? "600" : "500") + ';">Using a Barcode</button>' +
        '</div>' +
        '<table style="border-collapse:collapse;width:240px;margin-bottom:14px;font-size:12px;border:1px solid #cbd5e1;background:#ffffff;">' +
        '<thead>' +
        '<tr style="background:#f8fafc;">' +
        '<th style="border:1px solid #cbd5e1;padding:6px 12px;text-align:left;color:#475569;font-weight:600;">' + (isSku ? "sku" : "barcode") + '</th>' +
        '<th style="border:1px solid #cbd5e1;padding:6px 12px;text-align:left;color:#475569;font-weight:600;">qty</th>' +
        '</tr>' +
        '</thead>' +
        '<tbody>' +
        '<tr>' +
        '<td style="border:1px solid #cbd5e1;padding:6px 12px;color:#334155;">' + (isSku ? "abc123" : "123456789012") + '</td>' +
        '<td style="border:1px solid #cbd5e1;padding:6px 12px;color:#334155;">10</td>' +
        '</tr>' +
        '<tr>' +
        '<td style="border:1px solid #cbd5e1;padding:6px 12px;color:#334155;">' + (isSku ? "xyz123" : "987654321098") + '</td>' +
        '<td style="border:1px solid #cbd5e1;padding:6px 12px;color:#334155;">20</td>' +
        '</tr>' +
        '</tbody>' +
        '</table>' +
        '<div style="margin-bottom:16px;">' +
        '<button type="button" class="sl-agent-link" data-sl-qo-file style="background:#ffffff;border:1px solid #cbd5e1;border-radius:4px;padding:7px 14px;font-size:13px;font-weight:500;color:#334155;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>' +
        'Upload CSV File' +
        '</button>' +
        '</div>' +
        '<p style="font-size:13px;color:#64748b;line-height:1.5;margin:0 0 8px 0;">' +
        "You can also paste the contents of your CSV file. From your spreadsheet editor, copy the first two columns and paste below" +
        '</p>' +
        '<textarea data-sl-qo-text aria-label="Paste CSV contents" rows="4" style="width:100%;border:1px solid #cbd5e1;border-radius:4px;padding:8px 10px;font-size:13px;box-sizing:border-box;resize:vertical;font-family:inherit;outline:none;" placeholder="">' + escapeHtml(qo.text) + '</textarea>' +
        '<div style="margin-top:8px;">' +
        '<button type="button" class="sl-agent-start" data-sl-qo-check' + (qo.busy ? ' disabled' : '') + ' style="background:#ffffff;border:1px solid #cbd5e1;border-radius:4px;padding:7px 14px;font-size:13px;font-weight:500;color:#334155;cursor:pointer;display:inline-flex;align-items:center;gap:7px;">' +
        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><rect x="8" y="2" width="8" height="4" rx="1" ry="1"/></svg>' +
        (qo.busy ? 'Checking...' : 'Paste & Upload Cart') +
        '</button>' +
        '</div>';

      if (qo.message) html += '<p class="sl-agent-error" role="alert" style="margin-top:10px;">' + escapeHtml(qo.message) + '</p>';

      if (qo.rows) {
        var good = qo.rows.filter(function (r) { return r.status === 'ok' && !r.added; });
        html += '<table class="sl-qo-table" style="margin-top:12px;"><tbody>' + qo.rows.map(function (r) {
          var state = r.added ? 'Added' : r.status === 'ok' ? 'Ready' : (QO_ERRORS[r.error] || r.error);
          var cls = r.added ? 'is-ok' : r.status === 'ok' ? '' : 'is-bad';
          return '<tr class="' + cls + '"><td>' + escapeHtml(r.line) + '</td><td>' + escapeHtml(r.code) +
            (r.title ? '<br><span class="sl-agent-row-meta">' + escapeHtml(r.title) + '</span>' : '') +
            '</td><td>' + (r.quantity ? 'x ' + escapeHtml(r.quantity) : '') + '</td><td>' + escapeHtml(state) +
            (r.mergedFrom ? '<br><span class="sl-agent-row-meta">lines ' + escapeHtml(r.mergedFrom.join(', ')) + ' added together</span>' : '') +
            '</td></tr>';
        }).join('') + '</tbody></table>';

        html += '<div class="sl-nc-actions" style="margin-top:10px;"><button type="button" class="sl-agent-start" data-sl-qo-add' + (good.length && !qo.busy ? '' : ' disabled') + '>Add ' + good.length + ' to cart</button></div>';
      }
      html += '</div>';
    }
    return html;
  }

  function renderQuickOrder() {
    var el = bodyEl.querySelector("[data-sl-qo]");
    if (el) el.innerHTML = quickOrderInner();
    var actions = bodyEl.querySelector("[data-sl-qo-actions]");
    if (actions) actions.innerHTML = quickOrderActionsInner();
    attachScanner();
  }

  function stopScanning() {
    clearInterval(qoTimer);
    qoTimer = null;
    if (qoStream) qoStream.getTracks().forEach(function (t) { t.stop(); });
    qoStream = null;
  }

  // Looks at the camera a few times a second; a code seen is added once.
  function attachScanner() {
    var video = bodyEl.querySelector("[data-sl-qo-video]");
    if (!qo.scan || !video || qoStream) return;

    // The sticky totals/coupon footer can cover the lower half of the scanner
    // on short windows, so bring the whole scanner to the top of the body.
    var scanBox = bodyEl.querySelector(".sl-qo-scan-wrapper");
    if (scanBox && scanBox.scrollIntoView) scanBox.scrollIntoView({ block: "start" });

    loadBarcodeScanner(function () {
      if (!window.BarcodeDetector) {
        qo.scan = false;
        qo.message = "Barcode scanner could not be loaded. Type the code instead.";
        qo.open = true;
        renderQuickOrder();
        return;
      }

      var detector = new window.BarcodeDetector();
      var last = "";
      var lastAt = 0;
      var isMobileDevice = !!((window.matchMedia && window.matchMedia("(max-width: 768px)").matches) ||
        /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent));
      var constraints = qo.deviceId
        ? { video: { deviceId: { exact: qo.deviceId } } }
        : isMobileDevice
          ? { video: { facingMode: qo.facingMode || "environment" } }
          : { video: true };
      var getStream = (navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
        ? navigator.mediaDevices.getUserMedia(constraints).catch(function () {
          return navigator.mediaDevices.getUserMedia({ video: true });
        })
        : Promise.reject(new Error("No camera support"));

      getStream.then(function (stream) {
        if (!qo.scan) { stream.getTracks().forEach(function (t) { t.stop(); }); return; }
        qoStream = stream;
        video.srcObject = stream;
        video.play();

        var working = false;
        qoTimer = setInterval(function () {
          if (working) return;
          working = true;
          detector.detect(video).then(function (codes) {
            if (!codes || !codes.length) return null;
            var value = String(codes[0].rawValue || "").trim();
            if (!value) return null;
            // Stop scanning loop immediately to prevent duplicate increments
            clearInterval(qoTimer);
            qoTimer = null;
            return scanCode(value);
          }).catch(function () { }).then(function () { working = false; });
        }, 300);
      }).catch(function (err) {
        stopScanning();
        qo.scan = false;
        qo.scanMessage = "";
        renderQuickOrder();
        setTimeout(function () {
          window.alert("Camera access is blocked in your browser.\n\nPlease click the lock/camera icon in your address bar, change Camera to 'Allow', and refresh the page.");
        }, 100);
      });
    });
  }

  var barcodeToastTimer = null;
  function showBarcodeToast(message, type, duration) {
    clearTimeout(barcodeToastTimer);
    var drawer = root.querySelector(".sl-cart-drawer") || root;
    var toast = drawer.querySelector(".sl-barcode-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "sl-barcode-toast";
      drawer.appendChild(toast);
    }

    var iconHtml = "";
    if (type === "loading") {
      iconHtml = '<span class="sl-barcode-spinner" aria-hidden="true"></span>';
    } else if (type === "success") {
      iconHtml = '<svg class="sl-barcode-toast-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
    } else if (type === "error") {
      iconHtml = '<svg class="sl-barcode-toast-icon" width="16" height="16" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg>';
    }

    toast.className = "sl-barcode-toast sl-barcode-toast--" + (type || "info");
    toast.innerHTML = iconHtml + '<span class="sl-barcode-toast-msg">' + escapeHtml(message) + '</span>';
    toast.hidden = false;

    if (duration) {
      barcodeToastTimer = setTimeout(function () {
        hideBarcodeToast();
      }, duration);
    }
  }

  function hideBarcodeToast() {
    clearTimeout(barcodeToastTimer);
    var toast = root.querySelector(".sl-barcode-toast");
    if (toast) {
      toast.classList.add("sl-barcode-toast--leaving");
      setTimeout(function () {
        if (toast && toast.parentNode) toast.parentNode.removeChild(toast);
      }, 200);
    }
  }

  function showBarcodeLoadingLine(title, subtitle) {
    var linesEl = bodyEl.querySelector(".sl-cart-lines");
    if (!linesEl) return;

    var emptyEl = linesEl.querySelector(".sl-cart-empty");
    if (emptyEl) emptyEl.style.display = "none";

    var existing = linesEl.querySelector("#sl-barcode-loading-line");
    if (!existing) {
      existing = document.createElement("div");
      existing.id = "sl-barcode-loading-line";
      existing.className = "sl-cart-line sl-cart-line--loading";
      linesEl.insertBefore(existing, linesEl.firstChild);
    }

    existing.innerHTML =
      '<div class="sl-cart-line-header">' +
      '<div class="sl-barcode-img-placeholder">' +
      '<span class="sl-barcode-spinner" aria-hidden="true"></span>' +
      '</div>' +
      '<div class="sl-cart-line-main" style="display:flex;flex-direction:column;justify-content:center;">' +
      '<p class="sl-cart-line-title sl-barcode-pulse-title">' +
      escapeHtml(title || "Scanning barcode from image...") +
      '<span class="sl-barcode-badge-scanning">Processing</span>' +
      '</p>' +
      '<p class="sl-cart-line-meta" style="color:#64748b;margin-top:4px;">' +
      escapeHtml(subtitle || "Detecting barcode & adding product to cart...") +
      '</p>' +
      '</div>' +
      '</div>';
  }

  function hideBarcodeLoadingLine() {
    var existing = bodyEl.querySelector("#sl-barcode-loading-line");
    if (existing && existing.parentNode) {
      existing.parentNode.removeChild(existing);
    }
    var linesEl = bodyEl.querySelector(".sl-cart-lines");
    if (linesEl && (!cartData.items || !cartData.items.length)) {
      var emptyEl = linesEl.querySelector(".sl-cart-empty");
      if (emptyEl) emptyEl.style.display = "";
    }
  }

  function scanCode(code) {
    showBarcodeLoadingLine("Adding item to cart...", "Barcode: " + code);
    showBarcodeToast("Checking barcode and adding to cart...", "loading");
    return postJson(quickOrderProxyUrl, { text: code + ", 1" }).then(function (result) {
      var row = result.ok && result.body && result.body.rows ? result.body.rows[0] : null;
      if (!row || row.status !== "ok") {
        hideBarcodeLoadingLine();
        var errMsg = code + ": " + (row ? QO_ERRORS[row.error] || row.error : "couldn't check it");
        qo.scanMessage = errMsg;
        renderQuickOrder();
        showBarcodeToast(errMsg, "error", 3500);
        return null;
      }
      showBarcodeLoadingLine("Adding " + (row.title || "product") + "...", "Quantity: 1");
      return fetch("/cart/add.js", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: Number(row.variantId), quantity: 1 }),
      }).then(function (res) {
        hideBarcodeLoadingLine();
        if (res.ok) {
          stopScanning();
          qo.scan = false;
          qo.scanMessage = "";
          renderQuickOrder();
          announce("Added " + row.title + " to cart.");
          showBarcodeToast("Added " + (row.title || "product") + " to cart!", "success", 2500);
          return refreshCart();
        } else {
          var failMsg = code + ": " + QO_ERRORS.ADD_FAILED;
          qo.scanMessage = failMsg;
          renderQuickOrder();
          showBarcodeToast(failMsg, "error", 3500);
          return null;
        }
      });
    }).catch(function () {
      hideBarcodeLoadingLine();
      showBarcodeToast("Could not check barcode.", "error", 3500);
      return null;
    });
  }

  // Adds the ready rows one at a time so a sold-out item doesn't stop the rest.
  function addQuickOrderRows() {
    var rows = (qo.rows || []).filter(function (r) { return r.status === "ok" && !r.added; });
    qo.busy = true;
    renderQuickOrder();

    var chain = Promise.resolve();
    rows.forEach(function (r) {
      chain = chain.then(function () {
        return fetch("/cart/add.js", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: Number(r.variantId), quantity: r.quantity }),
        }).then(function (res) {
          if (res.ok) r.added = true;
          else { r.status = "error"; r.error = "ADD_FAILED"; }
        }).catch(function () { r.status = "error"; r.error = "ADD_FAILED"; });
      });
    });

    return chain.then(function () {
      qo.busy = false;
      var failed = (qo.rows || []).filter(function (r) { return r.status === "error"; });
      if (!failed.length) {
        qo.open = false;
        qo.rows = null;
        qo.text = "";
        qo.message = "";
      }
      renderQuickOrder();
      return refreshCart();
    });
  }

  // Reads a CSV (sku or barcode, then quantity) into the list and checks it.
  function loadQuickOrderFile(file) {
    if (!file) return;
    if (file.size > 1024 * 1024) {
      qo.open = true;
      qo.message = "That file is too large. Use a file under 1 MB.";
      renderQuickOrder();
      return;
    }

    var reader = new FileReader();
    reader.onload = function () {
      qo.text = String(reader.result || "");
      qo.open = true;
      qo.rows = null;
      qo.message = "";
      renderQuickOrder();
      var check = bodyEl.querySelector("[data-sl-qo-check]");
      if (check) check.click();
    };
    reader.onerror = function () {
      qo.open = true;
      qo.message = "Couldn't read that file.";
      renderQuickOrder();
    };
    reader.readAsText(file);
  }

  function onWhite(file) {
    if (!window.createImageBitmap) return Promise.resolve(file);
    return createImageBitmap(file)
      .then(function (bitmap) {
        var canvas = document.createElement("canvas");
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        var ctx = canvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(bitmap, 0, 0);
        return new Promise(function (resolve) { canvas.toBlob(function (blob) { resolve(blob || file); }, "image/png"); });
      })
      .catch(function () { return file; });
  }

  // Finds the barcodes in a picture. The browser's own reader is used when it
  // has one; otherwise the same ZXing reader the camera scan falls back to.
  function decodePhoto(file) {
    var unique = function (list) {
      return list.filter(function (c, i) { return c && list.indexOf(c) === i; });
    };
    var native = window.BarcodeDetector && /native code/.test(Function.prototype.toString.call(window.BarcodeDetector));

    if (native && window.createImageBitmap) {
      return createImageBitmap(file)
        .then(function (bitmap) { return new window.BarcodeDetector().detect(bitmap); })
        .then(function (codes) { return unique((codes || []).map(function (c) { return String(c.rawValue || "").trim(); })); })
        .catch(function () { return []; });
    }

    return new Promise(function (resolve) { loadBarcodeScanner(resolve); }).then(function () {
      if (!(window.ZXing && window.ZXing.BrowserMultiFormatReader)) return [];
      // A picture with a see-through background (a saved or screenshot barcode)
      // reads as all black, so it is put on white first.
      return onWhite(file).then(function (blob) {
        var url = URL.createObjectURL(blob);
        return new window.ZXing.BrowserMultiFormatReader()
          .decodeFromImageUrl(url)
          .then(function (res) { return unique([String(res.getText()).trim()]); })
          .catch(function () { return []; })
          .then(function (out) { URL.revokeObjectURL(url); return out; });
      });
    });
  }

  function readBarcodesFromPhoto(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showBarcodeToast("Photo is too large. Use an image under 10 MB.", "error", 3500);
      return;
    }

    // Show loading row right where products are added in the cart
    showBarcodeLoadingLine("Scanning barcode from image...", "Detecting product barcode...");
    showBarcodeToast("Scanning image for barcode...", "loading");

    decodePhoto(file).then(function (codes) {
      if (!codes || !codes.length) {
        hideBarcodeLoadingLine();
        showBarcodeToast("No barcode found. Please try a closer, clearer picture.", "error", 3500);
        return;
      }
      showBarcodeLoadingLine("Barcode detected!", "Looking up product & adding to cart...");
      showBarcodeToast("Barcode detected! Adding to cart...", "loading");
      var chain = Promise.resolve();
      codes.forEach(function (code) {
        chain = chain.then(function () {
          return scanCode(code);
        });
      });
      return chain;
    }).catch(function () {
      hideBarcodeLoadingLine();
      showBarcodeToast("Could not read image. Please try again.", "error", 3500);
    });
  }

  root.addEventListener("change", function (event) {
    if (event.target.matches && event.target.matches("[data-sl-qo-file-input]")) {
      loadQuickOrderFile(event.target.files && event.target.files[0]);
      event.target.value = "";
    } else if (event.target.matches && event.target.matches("[data-sl-qo-photo-input]")) {
      readBarcodesFromPhoto(event.target.files && event.target.files[0]);
      event.target.value = "";
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key !== "Escape") return;
    if (qo.menu) {
      qo.menu = false;
      renderQuickOrder();
      var btn = bodyEl.querySelector("[data-sl-qo-menu]");
      if (btn) btn.focus();
    }
    if (qo.scan) {
      qo.scan = false;
      stopScanning();
      renderQuickOrder();
    }
  });

  // ---- Shopping lists: load the customer's saved lists, show them in the Actions menu and
  // on the My Account tab, add one back to the cart, delete one.

  var isFetchingShoppingLists = false;
  function loadShoppingLists() {
    if (!shoppingListsProxyUrl || !hasCustomer || isFetchingShoppingLists) return Promise.resolve();
    isFetchingShoppingLists = true;
    return safeFetchJson(shoppingListsProxyUrl)
      .then(function (result) {
        isFetchingShoppingLists = false;
        shoppingLists = result.ok && result.body && result.body.lists ? result.body.lists : [];
        renderQuickOrder();
        if (activeTab === "account" && accountView === "dashboard") {
          bodyEl.innerHTML = renderAccountDashboardBody();
        }
      })
      .catch(function () {
        isFetchingShoppingLists = false;
      });
  }

  function formatListDate(value) {
    var d = value ? new Date(value) : null;
    return d && !isNaN(d.getTime()) ? d.toLocaleDateString("en-US") : "";
  }

  function renderShoppingListsSection() {
    var heading = '<h3 class="sl-cart-heading sl-cart-heading-spaced">Shopping Lists</h3>';
    if (!shoppingLists || !shoppingLists.length) {
      return heading + '<div class="sl-cart-account-empty-box" data-sl-shopping-lists>Your shopping lists will appear here once you’ve added one.</div>';
    }
    var rows = shoppingLists.map(function (l) {
      var menuOpen = String(shoppingListMenuId) === String(l.id);
      return '<tr>' +
        '<td class="sl-sl-name">' + escapeHtml(l.name) + '</td>' +
        '<td>' + escapeHtml(formatListDate(l.updatedAt || l.createdAt)) + '</td>' +
        '<td class="sl-sl-actions"><div class="sl-sl-menu-wrap">' +
        '<button type="button" class="sl-sl-row-btn" data-sl-sl-row-menu="' + escapeHtml(l.id) + '" aria-haspopup="true" aria-expanded="' + (menuOpen ? "true" : "false") + '">Actions' +
        '<svg class="sl-qo-actions-chevron" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/></svg></button>' +
        (menuOpen
          ? '<div class="sl-sl-row-menu">' +
            '<button type="button" data-sl-sl-add="' + escapeHtml(l.id) + '" data-sl-sl-mode="existing">' + ICON_SYNC + 'Add items to existing cart</button>' +
            '<button type="button" data-sl-sl-add="' + escapeHtml(l.id) + '" data-sl-sl-mode="new">' + ICON_SYNC + 'Create new cart</button>' +
            '</div>'
          : "") +
        '</div>' +
        '<button type="button" class="sl-cart-remove sl-sl-trash" data-sl-sl-delete="' + escapeHtml(l.id) + '" aria-label="Delete list">' + ICON_TRASH + '</button>' +
        '</td></tr>';
    }).join("");
    return heading +
      '<div class="sl-sl-table-wrap" data-sl-shopping-lists><table class="sl-sl-table"><thead><tr>' +
      '<th>Name</th><th>Last Updated</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
  }

  // replaceCart false: add the list's items on top of the current cart ("Add items to existing
  // cart"); true: empty the cart first, so it holds just the list ("Create new cart").
  function addShoppingListToCart(id, replaceCart) {
    var list = (shoppingLists || []).filter(function (l) { return String(l.id) === String(id); })[0];
    if (!list || !list.items || !list.items.length) return;
    qo.menu = false;
    shoppingListMenuId = null;
    renderQuickOrder();
    var ready = replaceCart
      ? fetch("/cart/clear.js", { method: "POST" }).catch(function () { }).then(function () { cartMutationVersion++; })
      : Promise.resolve();
    ready.then(function () {
      return restoreAgentCartLines(list.items.map(function (i) { return { variantId: i.variantId, quantity: i.quantity }; }));
    }).then(function (results) {
      listAddedBanner = results.added.length > 0;
      if (results.failed.length) {
        showToast(results.failed.length + " item(s) couldn’t be added (sold out or no longer sold).");
      }
      return refreshCart().then(function () { setStep(0); });
    });
  }

  function listAddedBannerHtml() {
    if (!listAddedBanner) return "";
    return '<div class="sl-cart-added-banner" role="status">' +
      '<svg class="sl-cart-added-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6"/></svg>' +
      '<div class="sl-cart-added-text"><strong>Items have been successfully added to your cart!</strong>' +
      '<span>You can review your cart below before checking out</span></div>' +
      '<button type="button" class="sl-cart-added-close" data-sl-sl-banner-close aria-label="Dismiss">' +
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
      '</button></div>';
  }

  root.addEventListener("click", function (event) {
    var addBtn = event.target.closest("[data-sl-sl-add]");
    var rowMenuBtn = event.target.closest("[data-sl-sl-row-menu]");
    var delBtn = event.target.closest("[data-sl-sl-delete]");
    if (event.target.closest("[data-sl-sl-banner-close]")) {
      listAddedBanner = false;
      renderCartLines();
    } else if (addBtn) {
      addShoppingListToCart(addBtn.getAttribute("data-sl-sl-add"), addBtn.getAttribute("data-sl-sl-mode") === "new");
    } else if (event.target.closest("[data-sl-sl-viewall]")) {
      qo.menu = false;
      if (agentPanel.isAgent) agentAccountSubTab = "customer";
      showAccountTab();
      var target = bodyEl.querySelector("[data-sl-shopping-lists]");
      if (target && target.scrollIntoView) target.scrollIntoView({ block: "start" });
    } else if (rowMenuBtn) {
      var rowId = rowMenuBtn.getAttribute("data-sl-sl-row-menu");
      shoppingListMenuId = String(shoppingListMenuId) === String(rowId) ? null : rowId;
      if (activeTab === "account" && accountView === "dashboard") bodyEl.innerHTML = renderAccountDashboardBody();
    } else if (delBtn) {
      if (!window.confirm("Delete this shopping list?")) return;
      postJson(shoppingListsProxyUrl, { intent: "delete", id: delBtn.getAttribute("data-sl-sl-delete") }).then(function (result) {
        if (!result.ok) showToast((result.body && result.body.message) || "Couldn’t delete it.");
        return loadShoppingLists();
      });
    } else if (shoppingListMenuId && !event.target.closest(".sl-sl-menu-wrap")) {
      shoppingListMenuId = null;
      if (activeTab === "account" && accountView === "dashboard") bodyEl.innerHTML = renderAccountDashboardBody();
    }
  });

  // ---- Save shopping list: saves the current cart as a named list.
  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-sl-sl-save]")) {
      var saveMenuBtn = event.target.closest("[data-sl-sl-save]");
      if (saveMenuBtn.disabled || !cartData.items || !cartData.items.length) return;
      qo.menu = false;
      qo.saveListOpen = !qo.saveListOpen;
      qo.saveListMessage = "";
      qo.saveListName = "";
      qo.open = false;
      renderQuickOrder();
    } else if (event.target.closest("[data-sl-sl-save-close]")) {
      qo.saveListOpen = false;
      qo.saveListMessage = "";
      renderQuickOrder();
    } else if (event.target.closest("[data-sl-sl-save-submit]")) {
      var nameInput = bodyEl.querySelector("[data-sl-sl-save-name]");
      var name = nameInput ? nameInput.value.trim() : "";
      if (!name) {
        qo.saveListMessage = "Please enter a list name.";
        renderQuickOrder();
        return;
      }
      var items = (cartData.items || []).map(function (i) {
        return { variantId: String(i.variant_id), quantity: i.quantity, title: i.product_title || i.title, sku: i.sku };
      });
      if (!items.length) {
        qo.saveListMessage = "The cart is empty. Add items first.";
        renderQuickOrder();
        return;
      }
      qo.busy = true;
      qo.saveListMessage = "";
      renderQuickOrder();

      postJson(shoppingListsProxyUrl, { intent: "create", name: name, items: items }).then(function (result) {
        qo.busy = false;
        if (result.ok) {
          qo.saveListOpen = false;
          qo.saveListName = "";
          showNoticeToast("Shopping list saved");
          loadShoppingLists();
        } else {
          qo.saveListMessage = (result.body && result.body.message) || "Couldn't save the list.";
        }
        renderQuickOrder();
      });
    }
  });

  // A click anywhere else closes the Actions menu.
  root.addEventListener("click", function (event) {
    if (qo.menu && !event.target.closest("[data-sl-qo-actions]")) {
      qo.menu = false;
      renderQuickOrder();
    }
  });

  root.addEventListener("click", function (event) {
    if (event.target.closest("[data-sl-qo-menu]")) {
      qo.menu = !qo.menu;
      renderQuickOrder();
    } else if (event.target.closest("[data-sl-qo-file]")) {
      qo.menu = false;
      var input = bodyEl.querySelector("[data-sl-qo-file-input]");
      renderQuickOrder();
      var fresh = bodyEl.querySelector("[data-sl-qo-file-input]");
      if (fresh) fresh.click();
      else if (input) input.click();
    } else if (event.target.closest("[data-sl-qo-photo]")) {
      if (qo.scan) {
        stopScanning();
        qo.scan = false;
        qo.scanMessage = "";
      }
      qo.menu = false;
      renderQuickOrder();
      var wantCamera = event.target.closest("[data-sl-qo-photo]").getAttribute("data-sl-qo-photo") === "camera";
      var photoInput = bodyEl.querySelector(wantCamera ? "[data-sl-qo-photo-camera]" : "[data-sl-qo-photo-input]:not([data-sl-qo-photo-camera])");
      if (photoInput) photoInput.click();
    } else if (event.target.closest("[data-sl-qo-clear]")) {
      var clearBtn = event.target.closest("[data-sl-qo-clear]");
      if (clearBtn && (clearBtn.disabled || !cartData.items || !cartData.items.length)) return;
      qo.menu = false;
      renderQuickOrder();
      if (!window.confirm("Remove everything from this cart?")) return;
      fetch("/cart/clear.js", { method: "POST" }).catch(function () { }).then(function () {
        cartMutationVersion++;
        return refreshCart();
      });
    } else if (event.target.closest("[data-sl-qo-toggle]")) {
      qo.menu = false;
      qo.open = !qo.open;
      renderQuickOrder();
    } else if (event.target.closest("[data-sl-qo-flip]")) {
      var flipTo = function () {
        stopScanning();
        renderQuickOrder();
      };
      qo.facingMode = (qo.facingMode === "user") ? "environment" : "user";
      if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices().then(function (devices) {
          var cams = devices.filter(function (d) { return d.kind === "videoinput" && d.deviceId; });
          if (cams.length > 1) {
            var current = qoStream && qoStream.getVideoTracks()[0] && qoStream.getVideoTracks()[0].getSettings().deviceId;
            var at = cams.findIndex(function (d) { return d.deviceId === (current || qo.deviceId); });
            qo.deviceId = cams[(at + 1) % cams.length].deviceId;
          } else {
            qo.deviceId = "";
            qo.scanMessage = "Only one camera found on this device";
          }
        }).catch(function () { qo.deviceId = ""; }).then(flipTo);
      } else {
        flipTo();
      }
    } else if (event.target.closest("[data-sl-qo-close-scan]")) {
      qo.menu = false;
      qo.open = false;
      qo.message = "";
      qo.scan = false;
      qo.scanMessage = "";
      stopScanning();
      renderQuickOrder();
    } else if (event.target.closest("[data-sl-qo-scan]")) {
      qo.menu = false;
      qo.open = false;
      qo.message = "";
      qo.scan = !qo.scan;
      qo.scanMessage = "";
      if (!qo.scan) stopScanning();
      renderQuickOrder();
    } else if (event.target.closest("[data-sl-qo-check]")) {
      if (!qo.text.trim()) { qo.message = "Paste at least one line."; renderQuickOrder(); return; }
      qo.busy = true;
      qo.message = "";
      renderQuickOrder();
      postJson(quickOrderProxyUrl, { text: qo.text }).then(function (result) {
        qo.busy = false;
        if (result.ok && result.body && result.body.rows) { qo.rows = result.body.rows; qo.message = ""; }
        else qo.message = (result.body && result.body.message) || "Couldn't check the list.";
        renderQuickOrder();
      });
    } else if (event.target.closest("[data-sl-qo-add]")) {
      addQuickOrderRows();
    } else if (event.target.closest("[data-sl-qo-close-panel]")) {
      qo.open = false;
      qo.rows = null;
      qo.text = "";
      qo.message = "";
      renderQuickOrder();
    } else if (event.target.closest("[data-sl-qo-tab]")) {
      var tabBtn = event.target.closest("[data-sl-qo-tab]");
      qo.tab = tabBtn.getAttribute("data-sl-qo-tab") || "sku";
      renderQuickOrder();
    }
  });

  root.addEventListener("input", function (event) {
    if (event.target.matches && event.target.matches("[data-sl-qo-text]")) {
      qo.text = event.target.value;
      qo.rows = null;
    } else if (event.target.matches && event.target.matches("[data-sl-sl-save-name]")) {
      qo.saveListName = event.target.value;
    }
  });

  root.addEventListener("keydown", function (event) {
    if (event.key === "Enter" && event.target.matches && event.target.matches("[data-sl-sl-save-name]")) {
      event.preventDefault();
      var saveBtn = bodyEl.querySelector("[data-sl-sl-save-submit]");
      if (saveBtn) saveBtn.click();
    }
  });

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
      return safeFetchJson(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note: note,
          shippingAddress: buildShippingAddressPayload(),
          paymentMethod: selectedPaymentMethod,
          currency: cartData.currency || "USD",
          couponCodes: appliedCouponCodes.length ? appliedCouponCodes : undefined,
          agentContextId: window.sparklayerAgentContextId || undefined,
          poNumber: window.sparklayerAgentContextId && orderPo.trim() ? orderPo.trim() : undefined,
          internalNote: window.sparklayerAgentContextId && orderInternalNote.trim() ? orderInternalNote.trim() : undefined,
          requestedDeliveryDate: window.sparklayerAgentContextId && orderDeliveryDate ? orderDeliveryDate : undefined,
          idempotencyKey: currentCheckoutKey(),
          confirmBackorder: backorderConfirmed ? true : undefined,
          confirmPriceChange: priceChangeConfirmed ? true : undefined,
          lineItems: (cartData.items || []).map(function (item) {
            // item.price is the pre-discount unit price in Shopify's cart.js;
            // final_price is the unit price after automatic/segment discounts
            // (e.g. the wholesale price). Send both so checkout can show the
            // MSRP struck through with a visible discount, not just the net price.
            return {
              variantId: item.variant_id,
              title: item.product_title || undefined,
              // The price the agent saw, so a change underneath is noticed.
              expectedUnit: window.sparklayerAgentContextId ? lineDisplayPrice(item).unit : undefined,
              quantity: item.quantity,
              price: item.final_price,
              originalPrice: item.original_price,
            };
          }),
        }),
      })
        .then(function (result) {
          if (!result.ok || !result.body || (!result.body.invoiceUrl && !result.body.order && !result.body.paymentLinkSent)) {
            var errMsg = (result.body && result.body.error) ||
              (result.status === 404 || result.status === 502 || result.status === 503
                ? "Checkout service is currently unavailable. Please verify that the backend server is running."
                : i18n.checkoutError);
            orderApprovalNeeded = !!(result.body && result.body.code === "ORDER_APPROVAL_REQUIRED");
            // Some items are not all in stock: the agent decides whether the
            // customer is told it will be backordered (spec §9.5).
            // The price moved since the agent last looked: show old and new
            // totals and have them confirm (spec §7.5 PRICE_CHANGED).
            if (result.body && result.body.code === "PRICE_CHANGED" && !priceChangeConfirmed) {
              var changed = (result.body.changes || []).map(function (c) {
                return c.title + ": " + formatMoney(Math.round(c.oldUnit * 100)) + " -> " + formatMoney(Math.round(c.newUnit * 100));
              }).join("\n");
              if (window.confirm("The price changed since you added these items.\n\n" + changed + "\n\nTotal was " + formatMoney(Math.round(result.body.oldTotal * 100)) + ", now " + formatMoney(Math.round(result.body.newTotal * 100)) + ".\n\nContinue at the new price?")) {
                priceChangeConfirmed = true;
                return goToCheckout(note);
              }
              throw new Error("Order not placed. Check the new prices first.");
            }
            if (result.body && result.body.code === "BACKORDER_CONFIRM" && !backorderConfirmed) {
              if (window.confirm(errMsg + "\n\nThe customer will have to wait for these. Place the order anyway?")) {
                backorderConfirmed = true;
                return goToCheckout(note);
              }
              throw new Error("Order not placed. Lower the quantity or remove the backordered items.");
            }
            throw new Error(errMsg);
          }
          orderApprovalNeeded = false;
          backorderConfirmed = false;
          priceChangeConfirmed = false;
          if (result.body.order || result.body.paymentLinkSent) {
            orderConfirmation = result.body.order || null;
            paymentLinkSent = result.body.paymentLinkSent || null;
            checkoutAttemptKey = null;
            return fetch("/cart/clear.js", { method: "POST" })
              .catch(function () { })
              .then(function () {
                cartMutationVersion++;
                cartData = { items: [], item_count: 0, total_price: 0, note: "" };
                syncHeaderCartIcon(0);
                saveAgentCart();
                setStep(3);
              });
          }
          window.location.href = result.body.invoiceUrl;
        });
    });
  }

  var searchDebounce;

  root.addEventListener("click", function (event) {
    // The account menu opens and closes; a click anywhere else closes it.
    if (event.target.closest("[data-sl-usermenu]")) {
      userMenuOpen = !userMenuOpen;
      tabsEl.innerHTML = renderTabsHtml();
      return;
    }
    if (userMenuOpen && !event.target.closest(".sl-cart-usermenu-pop")) {
      userMenuOpen = false;
      tabsEl.innerHTML = renderTabsHtml();
    }

    if (event.target.closest("[data-sl-close]")) {
      closeDrawer();
      return;
    }

    var expandBtn = event.target.closest("[data-sl-expand]");
    if (expandBtn) {
      isExpanded = !isExpanded;
      root.classList.toggle("is-expanded", isExpanded);
      var themeDrawers = document.querySelectorAll("cart-drawer, cart-drawer-component, .drawer, #CartDrawer, .cart-drawer");
      for (var i = 0; i < themeDrawers.length; i++) {
        themeDrawers[i].classList.toggle("is-expanded", isExpanded);
      }
      var expandHost = getNativeHost();
      if (expandHost && expandHost.inner) expandHost.inner.classList.toggle("is-expanded", isExpanded);
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
      if (typeof syncDawnNativeDrawer === "function" && isNativeDawnActive()) {
        syncDawnNativeDrawer();
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

    var reportsLink = event.target.closest("[data-sl-open-reports]");
    if (reportsLink) {
      event.preventDefault();
      showReportsView();
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

    var couponApplyBtn = event.target.closest("[data-sl-coupon-apply]");
    if (couponApplyBtn) {
      event.preventDefault();
      if (couponValidating) return;
      var couponInputEl = footerEl.querySelector("[data-sl-coupon-input]");
      var newCouponCode = couponInputEl ? couponInputEl.value.trim() : "";
      var alreadyApplied = appliedCouponCodes.some(function (code) {
        return code.toUpperCase() === newCouponCode.toUpperCase();
      });
      if (!newCouponCode || alreadyApplied || appliedCouponCodes.length >= MAX_COUPON_CODES) {
        return;
      }
      couponError = "";
      couponValidating = true;
      footerEl.innerHTML = renderFooterHtml();
      validateCouponCode(newCouponCode)
        .then(function (result) {
          couponValidating = false;
          if (result && result.valid) {
            appliedCouponCodes.push(newCouponCode);
          } else {
            couponError = (result && result.error) || "This coupon code is invalid.";
          }
          footerEl.innerHTML = renderFooterHtml();
          renderCartLines();
        })
        .catch(function () {
          couponValidating = false;
          couponError = "Could not validate coupon code. Please try again.";
          footerEl.innerHTML = renderFooterHtml();
        });
      return;
    }

    var couponRemoveBtn = event.target.closest("[data-sl-coupon-remove]");
    if (couponRemoveBtn) {
      event.preventDefault();
      var codeToRemove = couponRemoveBtn.dataset.code || "";
      appliedCouponCodes = appliedCouponCodes.filter(function (code) {
        return code !== codeToRemove;
      });
      couponError = "";
      footerEl.innerHTML = renderFooterHtml();
      renderCartLines();
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
      showAccountAddAddress();
      return;
    }

    var saveAccountAddressBtn = event.target.closest("[data-sl-save-account-address]");
    if (saveAccountAddressBtn) {
      event.preventDefault();
      if (accountAddAddressSaving) return;
      var accountValues = readAccountAddressForm();
      if (!addAddressFormIsValid(accountValues)) {
        accountAddAddressError = i18n.addressSaveError;
        bodyEl.innerHTML = renderAccountAddAddressBody();
        return;
      }
      accountAddAddressSaving = true;
      accountAddAddressError = "";
      bodyEl.innerHTML = renderAccountAddAddressBody();
      saveAccountAddress(accountValues)
        .then(function () {
          showAccountTab();
        })
        .catch(function (err) {
          accountAddAddressSaving = false;
          accountAddAddressError = err.message || i18n.addressSaveError;
          bodyEl.innerHTML = renderAccountAddAddressBody();
        });
      return;
    }

    var lineEl = event.target.closest(".sl-cart-line");
    if (lineEl) {
      var key = lineEl.dataset.lineKey;
      var qtyBtn = event.target.closest("[data-sl-qty]");
      if (qtyBtn) {
        var currentLine = (cartData.items || []).filter(function (i) { return i.key === key; })[0];
        var current = currentLine ? currentLine.quantity : parseInt(lineEl.querySelector(".sl-cart-qty input").value, 10) || 0;
        var next = Math.max(0, current + parseInt(qtyBtn.dataset.slQty, 10));
        applyOptimisticQuantity(key, next);
        renderCartLines();
        changeLineQuantity(key, next);
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
    if (event.key === "Enter" && event.target.matches("[data-sl-qty-input]")) {
      event.preventDefault();
      event.target.blur();
      return;
    }
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
    if (event.target.matches("[data-sl-qty-input]")) {
      var qtyInput = event.target;
      var qtyLineEl = qtyInput.closest(".sl-cart-line");
      var qtyKey = qtyLineEl && qtyLineEl.dataset.lineKey;
      var qtyLine = qtyKey && (cartData.items || []).filter(function (i) { return i.key === qtyKey; })[0];
      var parsedQty = parseInt(qtyInput.value, 10);
      if (!qtyLine || isNaN(parsedQty) || parsedQty < 0) {
        renderCartLines();
        return;
      }
      applyOptimisticQuantity(qtyKey, parsedQty);
      renderCartLines();
      changeLineQuantity(qtyKey, parsedQty);
      return;
    }

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

  // Approval-first roles: ask a manager to agree to this order (spec §2.2).
  root.addEventListener("click", function (event) {
    if (!event.target.closest("[data-sl-order-approval]")) return;

    var why = window.prompt("Why should this order go ahead? (the manager will read this)", "");
    if (why === null) return;
    if (!why.trim()) { checkoutError = "Say why this order should go ahead."; renderFooterAgain(); return; }

    postJson(agentOverrideProxyUrl, { intent: "request_order_approval", reasonCode: "OTHER", reasonText: why }).then(function (result) {
      var b = result.body || {};
      if (result.ok) {
        orderApprovalNeeded = false;
        checkoutError = b.status === "PENDING_APPROVAL"
          ? "Sent to a manager. You'll be told when it is approved; then place the order."
          : b.status === "DENIED" ? "No approval was needed." : "Done.";
      } else {
        checkoutError = b.message || "Couldn't ask for approval.";
      }
      loadAgentOverrides().then(renderFooterAgain);
    });
  });

  function renderFooterAgain() {
    footerEl.innerHTML = renderFooterHtml();
  }

  root.addEventListener("input", function (event) {
    if (!event.target.matches) return;
    if (event.target.matches("[data-sl-po]")) orderPo = event.target.value;
    else if (event.target.matches("[data-sl-internal-note]")) orderInternalNote = event.target.value;
    else if (event.target.matches("[data-sl-delivery]")) orderDeliveryDate = event.target.value;
  });

  root.addEventListener("focusout", function (event) {
    if (!event.target.classList.contains("sl-cart-order-notes")) return;
    saveCartNote(event.target.value);
  });

  root.addEventListener("click", function (event) {
    var searchResultsEl = bodyEl.querySelector(".sl-cart-search-results");
    var searchInput = bodyEl.querySelector(".sl-cart-search-input");
    if (searchResultsEl && !searchResultsEl.contains(event.target) && event.target !== searchInput) {
      searchResultsEl.classList.remove("is-visible");
    }
  });

  // The theme drawer closes on clicks it considers outside its panel. Our
  // handlers re-render the UI (tabs, cart lines), which detaches the clicked
  // element, so by the time the event reaches the theme its target no longer
  // sits inside the panel and looks like an outside click. Registered after
  // every other root click handler so it only sees the post-render DOM.
  root.addEventListener("click", function (event) {
    if (isNativeDawnActive() && !root.contains(event.target)) event.stopPropagation();
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeDrawer();
  });

  document.addEventListener(
    "click",
    function (event) {
      var closeBtn = event.target.closest("[data-sl-close], .sl-cart-tabs-close");
      if (closeBtn) {
        console.log("🔴 [cart-drawer.js] Close button clicked in capture document listener:", closeBtn);
        event.preventDefault();
        event.stopPropagation();
        closeDrawer();
      }
    },
    true
  );

  if (isNativeDawnActive()) {
    attachToDawnNow();
    refreshCart().then(function () {
      syncDawnNativeDrawer();
      fetchPaymentTerms();
    });
  } else {
    root.classList.remove("sl-native-mode");
    if (root.parentElement && root.parentElement !== document.body) {
      document.body.appendChild(root);
    }
    setStep(0);
    refreshCart().then(function () {
      fetchPaymentTerms();
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (isNativeDawnActive()) {
        attachToDawnNow();
      } else {
        root.classList.remove("sl-native-mode");
        if (root.parentElement && root.parentElement !== document.body) {
          document.body.appendChild(root);
        }
      }
    });
  } else {
    if (isNativeDawnActive()) {
      attachToDawnNow();
    } else {
      root.classList.remove("sl-native-mode");
      if (root.parentElement && root.parentElement !== document.body) {
        document.body.appendChild(root);
      }
    }
  }
})();
