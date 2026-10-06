// The single shared storefront script every SparkLayer form snippet loads
// (`<script src="/apps/sparklayer/embed.js">`). Merchants paste one tiny,
// stable snippet per form (see merchant-panel's buildEmbedSnippet) that never
// needs to change again — all the actual rendering/validation/submit logic
// lives here instead, so improving it doesn't require every merchant to
// re-copy-paste their embed snippets into their theme.
//
// COUNTRIES and the translations dictionary are duplicated by hand from
// merchant-panel's countries.js / formTemplates.js BUILT_IN_TRANSLATIONS —
// the three projects in this repo don't share code (see root CLAUDE.md).

const COUNTRIES = [
  "Afghanistan", "Albania", "Algeria", "Andorra", "Angola", "Argentina", "Armenia", "Australia",
  "Austria", "Azerbaijan", "Bahamas", "Bahrain", "Bangladesh", "Barbados", "Belarus", "Belgium",
  "Belize", "Benin", "Bhutan", "Bolivia", "Bosnia and Herzegovina", "Botswana", "Brazil", "Brunei",
  "Bulgaria", "Burkina Faso", "Burundi", "Cambodia", "Cameroon", "Canada", "Chad", "Chile", "China",
  "Colombia", "Costa Rica", "Croatia", "Cuba", "Cyprus", "Czechia", "Denmark", "Djibouti",
  "Dominican Republic", "Ecuador", "Egypt", "El Salvador", "Estonia", "Ethiopia", "Fiji", "Finland",
  "France", "Gabon", "Georgia", "Germany", "Ghana", "Greece", "Guatemala", "Guinea", "Haiti",
  "Honduras", "Hong Kong SAR", "Hungary", "Iceland", "India", "Indonesia", "Iraq", "Ireland",
  "Israel", "Italy", "Jamaica", "Japan", "Jordan", "Kazakhstan", "Kenya", "Kuwait", "Kyrgyzstan",
  "Laos", "Latvia", "Lebanon", "Lesotho", "Liberia", "Libya", "Liechtenstein", "Lithuania",
  "Luxembourg", "Madagascar", "Malawi", "Malaysia", "Maldives", "Mali", "Malta", "Mauritius",
  "Mexico", "Moldova", "Monaco", "Mongolia", "Montenegro", "Morocco", "Mozambique", "Myanmar",
  "Namibia", "Nepal", "Netherlands", "New Zealand", "Nicaragua", "Niger", "Nigeria",
  "North Macedonia", "Norway", "Oman", "Pakistan", "Panama", "Papua New Guinea", "Paraguay", "Peru",
  "Philippines", "Poland", "Portugal", "Qatar", "Romania", "Russia", "Rwanda", "Saudi Arabia",
  "Senegal", "Serbia", "Singapore", "Slovakia", "Slovenia", "Somalia", "South Africa",
  "South Korea", "South Sudan", "Spain", "Sri Lanka", "Sudan", "Sweden", "Switzerland", "Syria",
  "Taiwan", "Tajikistan", "Tanzania", "Thailand", "Togo", "Trinidad and Tobago", "Tunisia",
  "Turkey", "Turkmenistan", "Uganda", "Ukraine", "United Arab Emirates", "United Kingdom",
  "United States", "Uruguay", "Uzbekistan", "Venezuela", "Vietnam", "Yemen", "Zambia", "Zimbabwe",
];

// International dial code per country, for the Phone field's optional
// country-code selector. Kept in sync by hand with merchant-panel's
// countries.js COUNTRY_CALLING_CODES.
const COUNTRY_CALLING_CODES: Record<string, string> = {
  Afghanistan: "+93", Albania: "+355", Algeria: "+213", Andorra: "+376", Angola: "+244",
  Argentina: "+54", Armenia: "+374", Australia: "+61", Austria: "+43", Azerbaijan: "+994",
  Bahamas: "+1", Bahrain: "+973", Bangladesh: "+880", Barbados: "+1", Belarus: "+375",
  Belgium: "+32", Belize: "+501", Benin: "+229", Bhutan: "+975", Bolivia: "+591",
  "Bosnia and Herzegovina": "+387", Botswana: "+267", Brazil: "+55", Brunei: "+673",
  Bulgaria: "+359", "Burkina Faso": "+226", Burundi: "+257", Cambodia: "+855", Cameroon: "+237",
  Canada: "+1", Chad: "+235", Chile: "+56", China: "+86", Colombia: "+57", "Costa Rica": "+506",
  Croatia: "+385", Cuba: "+53", Cyprus: "+357", Czechia: "+420", Denmark: "+45", Djibouti: "+253",
  "Dominican Republic": "+1", Ecuador: "+593", Egypt: "+20", "El Salvador": "+503", Estonia: "+372",
  Ethiopia: "+251", Fiji: "+679", Finland: "+358", France: "+33", Gabon: "+241", Georgia: "+995",
  Germany: "+49", Ghana: "+233", Greece: "+30", Guatemala: "+502", Guinea: "+224", Haiti: "+509",
  Honduras: "+504", "Hong Kong SAR": "+852", Hungary: "+36", Iceland: "+354", India: "+91",
  Indonesia: "+62", Iraq: "+964", Ireland: "+353", Israel: "+972", Italy: "+39", Jamaica: "+1",
  Japan: "+81", Jordan: "+962", Kazakhstan: "+7", Kenya: "+254", Kuwait: "+965", Kyrgyzstan: "+996",
  Laos: "+856", Latvia: "+371", Lebanon: "+961", Lesotho: "+266", Liberia: "+231", Libya: "+218",
  Liechtenstein: "+423", Lithuania: "+370", Luxembourg: "+352", Madagascar: "+261", Malawi: "+265",
  Malaysia: "+60", Maldives: "+960", Mali: "+223", Malta: "+356", Mauritius: "+230", Mexico: "+52",
  Moldova: "+373", Monaco: "+377", Mongolia: "+976", Montenegro: "+382", Morocco: "+212",
  Mozambique: "+258", Myanmar: "+95", Namibia: "+264", Nepal: "+977", Netherlands: "+31",
  "New Zealand": "+64", Nicaragua: "+505", Niger: "+227", Nigeria: "+234", "North Macedonia": "+389",
  Norway: "+47", Oman: "+968", Pakistan: "+92", Panama: "+507", "Papua New Guinea": "+675",
  Paraguay: "+595", Peru: "+51", Philippines: "+63", Poland: "+48", Portugal: "+351", Qatar: "+974",
  Romania: "+40", Russia: "+7", Rwanda: "+250", "Saudi Arabia": "+966", Senegal: "+221",
  Serbia: "+381", Singapore: "+65", Slovakia: "+421", Slovenia: "+386", Somalia: "+252",
  "South Africa": "+27", "South Korea": "+82", "South Sudan": "+211", Spain: "+34", "Sri Lanka": "+94",
  Sudan: "+249", Sweden: "+46", Switzerland: "+41", Syria: "+963", Taiwan: "+886", Tajikistan: "+992",
  Tanzania: "+255", Thailand: "+66", Togo: "+228", "Trinidad and Tobago": "+1", Tunisia: "+216",
  Turkey: "+90", Turkmenistan: "+993", Uganda: "+256", Ukraine: "+380", "United Arab Emirates": "+971",
  "United Kingdom": "+44", "United States": "+1", Uruguay: "+598", Uzbekistan: "+998",
  Venezuela: "+58", Vietnam: "+84", Yemen: "+967", Zambia: "+260", Zimbabwe: "+263",
};

const BUILT_IN_TRANSLATIONS = {
  en: {
    title: "Title", firstName: "First Name", middleName: "Middle Name", lastName: "Last Name", suffix: "Suffix",
    addressLine: "Address line", city: "City", zip: "ZIP", country: "Country", selectCountry: "Select country",
    back: "Back", next: "Next", step: "Step", of: "of",
  },
  es: {
    title: "Título", firstName: "Nombre", middleName: "Segundo nombre", lastName: "Apellido", suffix: "Sufijo",
    addressLine: "Dirección", city: "Ciudad", zip: "Código postal", country: "País", selectCountry: "Seleccionar país",
    back: "Atrás", next: "Siguiente", step: "Paso", of: "de",
  },
  fr: {
    title: "Civilité", firstName: "Prénom", middleName: "Deuxième prénom", lastName: "Nom", suffix: "Suffixe",
    addressLine: "Adresse", city: "Ville", zip: "Code postal", country: "Pays", selectCountry: "Sélectionner un pays",
    back: "Retour", next: "Suivant", step: "Étape", of: "sur",
  },
  de: {
    title: "Titel", firstName: "Vorname", middleName: "Zweiter Vorname", lastName: "Nachname", suffix: "Suffix",
    addressLine: "Adresse", city: "Stadt", zip: "PLZ", country: "Land", selectCountry: "Land auswählen",
    back: "Zurück", next: "Weiter", step: "Schritt", of: "von",
  },
  hi: {
    title: "उपाधि", firstName: "पहला नाम", middleName: "मध्य नाम", lastName: "अंतिम नाम", suffix: "उपसर्ग",
    addressLine: "पता", city: "शहर", zip: "पिन कोड", country: "देश", selectCountry: "देश चुनें",
    back: "पीछे", next: "आगे", step: "चरण", of: "में से",
  },
};

const CSS = `
.sl-form { max-width: 640px; margin: 0 auto; font-family: var(--sl-font, inherit); color: #111827; }
.sl-form .sl-title { font-size: 2rem; font-weight: 700; margin: 0 0 0.5rem; }
.sl-form .sl-desc { font-size: 0.95rem; color: #4b5563; margin: 0 0 1.75rem; }
.sl-form .sl-field { margin-bottom: 1.25rem; }
.sl-form .sl-group { border: 1px solid #e5e7eb; border-radius: 10px; padding: 1rem; margin-bottom: 1.25rem; }
.sl-form .sl-label { display: block; font-size: 0.9rem; font-weight: 500; margin-bottom: 0.375rem; }
.sl-form .sl-sublabel { display: block; font-size: 0.85rem; color: #374151; margin: 0.5rem 0 0.375rem; }
.sl-form .sl-required { color: #dc2626; }
.sl-form .sl-row { display: flex; gap: 0.75rem; flex-wrap: wrap; }
.sl-form .sl-row > div { flex: 1; min-width: 160px; }
.sl-form .sl-col { display: flex; flex-direction: column; gap: 0.75rem; }
.sl-form .sl-phone-row { display: flex; gap: 0.5rem; }
.sl-form .sl-phone-row select.sl-phone-code { flex: 0 0 auto; width: auto; max-width: 190px; }
.sl-form .sl-phone-row input[type=tel] { flex: 1; }
.sl-form input[type=text], .sl-form input[type=email], .sl-form input[type=tel], .sl-form input[type=date],
.sl-form input[type=url], .sl-form input[type=number], .sl-form input[type=password],
.sl-form input[type=datetime-local], .sl-form input[type=time],
.sl-form select, .sl-form textarea {
  width: 100%; box-sizing: border-box; padding: 0.6rem 0.75rem; font-size: 0.95rem;
  border: 1px solid #d1d5db; border-radius: var(--sl-radius, 8px); background: #fff; color: #111827; font-family: var(--sl-font, inherit);
}
.sl-form input:focus, .sl-form select:focus, .sl-form textarea:focus {
  outline: none; border-color: var(--sl-primary, #6b7280); box-shadow: 0 0 0 3px rgba(var(--sl-primary-rgb, 107,114,128), 0.15);
}
.sl-form textarea { min-height: 90px; resize: vertical; }
.sl-form input[type=file] {
  display: block; width: 100%; box-sizing: border-box; font-size: 0.9rem; color: #374151;
  padding: 0.6rem 0.75rem; border: 1px dashed #d1d5db; border-radius: var(--sl-radius, 8px); background: #f9fafb; font-family: var(--sl-font, inherit);
}
.sl-form input[type=file]::file-selector-button {
  background: #fff; color: #111827; border: 1px solid #d1d5db; border-radius: calc(var(--sl-radius, 8px) - 2px);
  padding: 0.4rem 0.85rem; font-size: 0.85rem; font-weight: 600; cursor: pointer; margin-right: 0.75rem;
}
.sl-form input[type=file]::file-selector-button:hover { background: #f3f4f6; }
.sl-form .sl-checkbox-item { display: flex; align-items: center; gap: 0.5rem; font-size: 0.9rem; margin-bottom: 0.375rem; }
.sl-form .sl-checkbox-item input { width: auto; }
.sl-form .sl-checkbox-item.sl-choice-readonly { cursor: not-allowed; opacity: 0.65; }
.sl-form .sl-checkbox-item.sl-choice-readonly input { cursor: not-allowed; }
.sl-form .sl-submit, .sl-form .sl-next {
  background: var(--sl-primary, #111827); color: #fff; border: none; border-radius: var(--sl-radius, 8px);
  padding: 0.7rem 1.5rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem;
}
.sl-form .sl-submit:hover, .sl-form .sl-next:hover { background: var(--sl-primary-hover, #1f2937); }
.sl-form .sl-back {
  background: #fff; color: #111827; border: 1px solid #d1d5db; border-radius: var(--sl-radius, 8px);
  padding: 0.7rem 1.5rem; font-size: 0.95rem; font-weight: 600; cursor: pointer; margin-top: 0.5rem;
}
.sl-form .sl-back:hover { background: #f9fafb; }
.sl-form .sl-nav { display: flex; justify-content: space-between; align-items: center; }
.sl-form .sl-progress { font-size: 0.85rem; color: #6b7280; margin-bottom: 1rem; }
.sl-form .sl-fieldwrap.sl-hidden { display: none; }
.sl-form .sl-file-status { font-size: 0.8rem; color: #6b7280; margin-top: 0.375rem; }
.sl-form .sl-file-status.sl-error { color: #dc2626; }
.sl-form .sl-message { margin-top: 1rem; font-size: 0.9rem; }
.sl-form .sl-message.sl-success { color: #15803d; }
.sl-form .sl-message.sl-error { color: #dc2626; }
.sl-form .sl-help { font-size: 0.8rem; color: #6b7280; margin: 0.25rem 0 0.5rem; }
.sl-form .sl-repeat-item { display: flex; gap: 0.5rem; align-items: flex-start; margin-bottom: 0.5rem; }
.sl-form .sl-repeat-item > input, .sl-form .sl-repeat-item > textarea { flex: 1; }
.sl-form .sl-remove-item { background: none; border: none; color: #9ca3af; cursor: pointer; font-size: 1.1rem; line-height: 1; padding: 0.5rem 0.25rem; }
.sl-form .sl-remove-item:hover { color: #dc2626; }
.sl-form .sl-add-another { background: none; border: none; color: #7c3aed; font-size: 0.85rem; font-weight: 600; cursor: pointer; padding: 0; margin-top: 0.25rem; }
`;

// This is generic browser JS (not TypeScript, not bundled) — it's served
// as-is to the storefront, so it deliberately uses `var`/ES5-friendly syntax
// rather than relying on this project's build pipeline.
const SCRIPT = `
(function () {
  if (window.__sparklayerFormsInit) return;
  window.__sparklayerFormsInit = true;

  var COUNTRIES = ${JSON.stringify(COUNTRIES)};
  var COUNTRY_CALLING_CODES = ${JSON.stringify(COUNTRY_CALLING_CODES)};
  var ALL_TRANSLATIONS = ${JSON.stringify(BUILT_IN_TRANSLATIONS)};

  function injectStyles() {
    if (document.getElementById('sparklayer-form-styles')) return;
    var style = document.createElement('style');
    style.id = 'sparklayer-form-styles';
    style.textContent = ${JSON.stringify(CSS)};
    document.head.appendChild(style);
  }

  // Sets the CSS custom properties the shared stylesheet's var(...) fallbacks
  // read from, scoped to this one mount — so multiple forms with different
  // branding can coexist on the same page. --sl-primary-rgb (used for the
  // focus-ring's rgba alpha) and --sl-primary-hover (a slightly darker shade
  // for hover) are both derived from the merchant's single hex colour.
  function applyBranding(mount, branding) {
    if (!branding) return;
    var hex = /^#[0-9a-f]{6}$/i.test(branding.primaryColor) ? branding.primaryColor : null;
    if (hex) {
      var num = parseInt(hex.slice(1), 16);
      var r = (num >> 16) & 255;
      var g = (num >> 8) & 255;
      var b = num & 255;
      mount.style.setProperty('--sl-primary', hex);
      mount.style.setProperty('--sl-primary-rgb', r + ',' + g + ',' + b);
      var darken = 30;
      var dr = Math.max(0, r - darken);
      var dg = Math.max(0, g - darken);
      var db = Math.max(0, b - darken);
      mount.style.setProperty('--sl-primary-hover', 'rgb(' + dr + ',' + dg + ',' + db + ')');
    }
    if (branding.borderRadius != null) mount.style.setProperty('--sl-radius', branding.borderRadius + 'px');
    if (branding.fontFamily) mount.style.setProperty('--sl-font', branding.fontFamily);
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function requiredMark(req) {
    return req ? ' <span class="sl-required">*</span>' : '';
  }

  function helpHtml(f) {
    return f.description ? '<p class="sl-help">' + escapeHtml(f.description) + '</p>' : '';
  }

  // Most field types pass straight through as the HTML input's type
  // attribute — these two don't have a same-named HTML type.
  function htmlInputType(f) {
    if (f.type === 'phone') return 'tel';
    if (f.type === 'datetime') return 'datetime-local';
    return f.type;
  }

  function inputAttrs(f) {
    var attrs = '';
    if (f.autocomplete) attrs += ' autocomplete="' + escapeHtml(f.autocomplete) + '"';
    if (f.inputMode) attrs += ' inputmode="' + escapeHtml(f.inputMode) + '"';
    if (f.autocapitalize) attrs += ' autocapitalize="' + escapeHtml(f.autocapitalize) + '"';
    if (f.spellcheck === false) attrs += ' spellcheck="false"';
    if (f.minLength != null) attrs += ' minlength="' + f.minLength + '"';
    if (f.maxLength != null) attrs += ' maxlength="' + f.maxLength + '"';
    if (f.readOnly) attrs += ' readonly';
    return attrs;
  }

  // Mirrors backend-api's form.controller.js evaluateRule/isRuleApplicable/
  // ruleMessage — the Validation tab's rule conditions, evaluated live in the
  // browser so a visitor sees the same error before ever submitting.
  function evaluateRule(rule, str) {
    switch (rule.condition) {
      case 'equals': return str === rule.value;
      case 'not_equals': return str !== rule.value;
      case 'length_equals': return str.length === Number(rule.value);
      case 'length_not_equals': return str.length !== Number(rule.value);
      case 'length_gt': return str.length > Number(rule.value);
      case 'length_gte': return str.length >= Number(rule.value);
      case 'length_lt': return str.length < Number(rule.value);
      case 'length_lte': return str.length <= Number(rule.value);
      case 'contains': return str.indexOf(rule.value) !== -1;
      case 'not_contains': return str.indexOf(rule.value) === -1;
      case 'starts_with': return str.indexOf(rule.value) === 0;
      case 'ends_with': return rule.value === '' || str.slice(-rule.value.length) === rule.value;
      case 'matches_pattern':
        try { return new RegExp(rule.value).test(str); } catch (e) { return true; }
      case 'is_email': return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(str);
      case 'is_url':
        try { new URL(str); return true; } catch (e) { return false; }
      case 'is_number': return str !== '' && !isNaN(Number(str));
      case 'is_integer': return /^-?\\d+$/.test(str);
      case 'is_float': return /^-?\\d+\\.\\d+$/.test(str);
      case 'is_alpha': return /^[A-Za-z]+$/.test(str);
      case 'is_alphanumeric': return /^[A-Za-z0-9]+$/.test(str);
      case 'is_empty': return str === '';
      case 'is_not_empty': return str !== '';
      default: return true;
    }
  }

  var RULE_DEFAULT_MESSAGES = {
    equals: function (v) { return 'Must equal "' + v + '".'; },
    not_equals: function (v) { return 'Must not equal "' + v + '".'; },
    length_equals: function (v) { return 'Must be exactly ' + v + ' characters.'; },
    length_not_equals: function (v) { return 'Must not be exactly ' + v + ' characters.'; },
    length_gt: function (v) { return 'Must be more than ' + v + ' characters.'; },
    length_gte: function (v) { return 'Must be at least ' + v + ' characters.'; },
    length_lt: function (v) { return 'Must be less than ' + v + ' characters.'; },
    length_lte: function (v) { return 'Must be at most ' + v + ' characters.'; },
    contains: function (v) { return 'Must contain "' + v + '".'; },
    not_contains: function (v) { return 'Must not contain "' + v + '".'; },
    starts_with: function (v) { return 'Must start with "' + v + '".'; },
    ends_with: function (v) { return 'Must end with "' + v + '".'; },
    matches_pattern: function () { return 'Must match the required format.'; },
    is_email: function () { return 'Must be a valid email address.'; },
    is_url: function () { return 'Must be a valid URL.'; },
    is_number: function () { return 'Must be a number.'; },
    is_integer: function () { return 'Must be a whole number.'; },
    is_float: function () { return 'Must be a decimal number.'; },
    is_alpha: function () { return 'Must contain only letters.'; },
    is_alphanumeric: function () { return 'Must contain only letters and numbers.'; },
    is_empty: function () { return 'Must be empty.'; },
    is_not_empty: function () { return 'Must not be empty.'; }
  };

  function ruleMessage(rule) {
    if (rule.message) return rule.message;
    var fn = RULE_DEFAULT_MESSAGES[rule.condition];
    return fn ? fn(rule.value) : 'Invalid value.';
  }

  // A rule about emptiness (is_empty/is_not_empty) always applies; every
  // other rule is skipped on a blank value — required-ness is a separate
  // native "required" check.
  function isRuleApplicable(rule, str) {
    if (str !== '') return true;
    return rule.condition === 'is_empty' || rule.condition === 'is_not_empty';
  }

  // Sets/clears the input's custom validity as its value changes, so the
  // browser's native reportValidity() (used by the Next/Submit handlers)
  // shows the first failing rule's message instead of letting an invalid
  // value through.
  function wireFieldValidation(input, rules) {
    if (!rules.length || input.dataset.rulesWired) return;
    input.dataset.rulesWired = '1';
    function check() {
      var str = input.value.trim();
      for (var i = 0; i < rules.length; i++) {
        if (isRuleApplicable(rules[i], str) && !evaluateRule(rules[i], str)) {
          input.setCustomValidity(ruleMessage(rules[i]));
          return;
        }
      }
      input.setCustomValidity('');
    }
    input.addEventListener('input', check);
    input.addEventListener('blur', check);
    check();
  }

  function repeatWrap(f, itemHtml) {
    if (!f.repeatable) return itemHtml;
    return '<div class="sl-repeatable" data-field-id="' + f._id + '"><div class="sl-repeat-item">' + itemHtml + '</div></div>' +
      '<button type="button" class="sl-add-another" data-repeat-for="' + f._id + '">+ Add another</button>';
  }

  function initForm(mount) {
    if (mount.dataset.sparklayerInitialized) return;
    mount.dataset.sparklayerInitialized = '1';

    var formId = mount.dataset.sparklayerFormId;
    var proxyUrl = '/apps/sparklayer/forms/' + formId;
    var T = ALL_TRANSLATIONS.en;

    function countryOptions() {
      return '<option value="">' + T.selectCountry + '</option>' +
        COUNTRIES.map(function (c) { return '<option value="' + c + '">' + c + '</option>'; }).join('');
    }

    function phoneCodeOptions(defaultCountry) {
      return COUNTRIES.map(function (c) {
        var code = COUNTRY_CALLING_CODES[c];
        var selected = c === defaultCountry ? ' selected' : '';
        return '<option value="' + code + '"' + selected + '>' + code + ' ' + c + '</option>';
      }).join('');
    }

    fetch(proxyUrl)
      .then(function (r) { return r.json(); })
      .then(function (form) {
        if (form.error) { mount.textContent = form.error; return; }
        T = ALL_TRANSLATIONS[form.settings.language] || ALL_TRANSLATIONS.en;
        applyBranding(mount, form.settings.branding);

        var html = '<h2 class="sl-title">' + (form.settings.publicTitle || form.name) + '</h2>';
        if (form.settings.description) html += '<p class="sl-desc">' + form.settings.description + '</p>';
        html += '<p class="sl-progress"></p>';
        html += '<form>';

        var pageIndex = 0;
        form.fields.forEach(function (f, idx) {
          if (f.type === 'hidden') return;
          if (idx > 0 && f.newPage) pageIndex += 1;

          var req = f.required ? 'required' : '';
          var fieldHtml;

          if (f.type === 'name') {
            var nameOpts = f.nameOptions || {};
            var nameDefs = [
              { key: 'title', label: T.title },
              { key: 'firstName', label: T.firstName },
              { key: 'middleName', label: T.middleName },
              { key: 'lastName', label: T.lastName },
              { key: 'suffix', label: T.suffix },
            ];
            var enabledNameDefs = nameDefs.filter(function (d) { return nameOpts[d.key] && nameOpts[d.key].enabled; });
            if (enabledNameDefs.length === 0) enabledNameDefs = [nameDefs[1], nameDefs[3]];
            var nameSubsHtml = enabledNameDefs.map(function (d) {
              var sub = nameOpts[d.key] || {};
              var subReq = sub.required ? 'required' : '';
              var subDefault = sub.defaultValue ? ' value="' + escapeHtml(sub.defaultValue) + '"' : '';
              return '<div><label class="sl-sublabel">' + d.label + requiredMark(subReq) + '</label>' +
                '<input type="text" name="' + f._id + '.' + d.key + '"' + subDefault + ' ' + subReq + '></div>';
            }).join('');
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + '</label>' + helpHtml(f) +
              '<div class="' + (f.nameLayout === 'column' ? 'sl-col' : 'sl-row') + '">' + nameSubsHtml + '</div></div>';
          } else if (f.type === 'address') {
            fieldHtml = '<div class="sl-group"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              '<label class="sl-sublabel">' + T.addressLine + '</label><input type="text" name="' + f._id + '.address1" ' + req + '>' +
              '<div class="sl-row" style="margin-top:0.5rem">' +
                '<div><label class="sl-sublabel">' + T.city + '</label><input type="text" name="' + f._id + '.city" ' + req + '></div>' +
                '<div><label class="sl-sublabel">' + T.zip + '</label><input type="text" name="' + f._id + '.zip"></div>' +
              '</div>' +
              '<label class="sl-sublabel">' + T.country + '</label><select name="' + f._id + '.country">' + countryOptions() + '</select>' +
            '</div>';
          } else if (f.type === 'country') {
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              '<select name="' + f._id + '" ' + req + '>' + countryOptions() + '</select></div>';
          } else if (f.type === 'tax') {
            fieldHtml = '<div class="sl-group"><label class="sl-label">' + f.label + '</label>' + helpHtml(f) +
              '<label class="sl-sublabel">' + T.country + '</label><select name="' + f._id + '">' + countryOptions() + '</select></div>';
          } else if (f.type === 'textarea') {
            var taHtml = '<textarea name="' + f._id + '" ' + req + inputAttrs(f) + '>' + escapeHtml(f.defaultValue) + '</textarea>';
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              repeatWrap(f, taHtml) + '</div>';
          } else if (f.type === 'dropdown') {
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              '<select name="' + f._id + '" ' + req + '>' +
              f.options.map(function (o) {
                return '<option value="' + o + '"' + (o === f.defaultValue ? ' selected' : '') + '>' + o + '</option>';
              }).join('') +
              '</select></div>';
          } else if (f.type === 'checkbox') {
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              f.options.map(function (o) {
                return '<label class="sl-checkbox-item"><input type="checkbox" name="' + f._id + '" value="' + o + '"> ' + o + '</label>';
              }).join('') + '</div>';
          } else if (f.type === 'radio') {
            var radioRoClass = f.readOnly ? ' sl-choice-readonly' : '';
            var radioRoAttr = f.readOnly ? ' data-readonly-choice="1"' : '';
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              f.options.map(function (o) {
                var checkedAttr = f.readOnly && o === f.defaultValue ? ' checked' : '';
                return '<label class="sl-checkbox-item' + radioRoClass + '"><input type="radio" name="' + f._id + '" value="' + o + '"' + checkedAttr + radioRoAttr + ' ' + req + '> ' + o + '</label>';
              }).join('') + '</div>';
          } else if (f.type === 'toggle') {
            var toggleChecked = f.defaultValue === 'true' ? ' checked' : '';
            var toggleRoClass = f.readOnly ? ' sl-choice-readonly' : '';
            var toggleRoAttr = f.readOnly ? ' data-readonly-choice="1"' : '';
            fieldHtml = '<div class="sl-field">' + helpHtml(f) +
              '<label class="sl-checkbox-item' + toggleRoClass + '"><input type="checkbox" name="' + f._id + '" value="true"' + toggleChecked + toggleRoAttr + ' ' + req + '> ' +
              f.label + requiredMark(req) + '</label></div>';
          } else if (f.type === 'file') {
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              '<input type="file" data-upload-for="' + f._id + '">' +
              '<input type="hidden" name="' + f._id + '" ' + req + '>' +
              '<p class="sl-file-status" data-filestatus-for="' + f._id + '"></p></div>';
          } else if (f.type === 'phone' && f.showCountryCode) {
            var codeSelect = '<select name="' + f._id + '.code" class="sl-phone-code">' + phoneCodeOptions(f.defaultCountry) + '</select>';
            var numberInput = '<input type="tel" name="' + f._id + '.number" placeholder="' + escapeHtml(f.placeholder) + '"' +
              inputAttrs(f) + (f.defaultValue ? ' value="' + escapeHtml(f.defaultValue) + '"' : '') + ' ' + req + '>';
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              '<div class="sl-phone-row">' + codeSelect + numberInput + '</div></div>';
          } else {
            var inputHtml = '<input type="' + htmlInputType(f) + '" name="' + f._id + '" placeholder="' +
              escapeHtml(f.placeholder) + '"' + inputAttrs(f) + (f.defaultValue ? ' value="' + escapeHtml(f.defaultValue) + '"' : '') +
              ' ' + req + '>';
            fieldHtml = '<div class="sl-field"><label class="sl-label">' + f.label + requiredMark(req) + '</label>' + helpHtml(f) +
              repeatWrap(f, inputHtml) + '</div>';
          }

          html += '<div class="sl-fieldwrap" data-field-id="' + f._id + '" data-page="' + pageIndex + '" data-condition="' +
            JSON.stringify(f.condition || {}).replace(/"/g, '&quot;') + '">' + fieldHtml + '</div>';
        });

        html += '<div class="sl-nav">' +
          '<button type="button" class="sl-back">' + T.back + '</button>' +
          '<button type="button" class="sl-next">' + T.next + '</button>' +
          '<button type="submit" class="sl-submit">' + form.settings.submitButtonText + '</button>' +
        '</div></form>' +
          '<p class="sl-message"></p>';
        mount.innerHTML = html;

        var formEl = mount.querySelector('form');
        var fieldWraps = Array.prototype.slice.call(formEl.querySelectorAll('.sl-fieldwrap'));
        var pageCount = fieldWraps.reduce(function (max, el) { return Math.max(max, Number(el.getAttribute('data-page'))); }, 0) + 1;
        var currentPage = 0;
        var progressEl = mount.querySelector('.sl-progress');
        var backBtn = mount.querySelector('.sl-back');
        var nextBtn = mount.querySelector('.sl-next');
        var submitBtn = mount.querySelector('.sl-submit');
        var messageEl = mount.querySelector('.sl-message');

        // Validation-tab rules, keyed by field id, wired onto each field's
        // input(s) — including any repeatable clones added later (below).
        var fieldRulesById = {};
        form.fields.forEach(function (f) {
          fieldRulesById[f._id] = (f.validationRules || []).filter(function (r) { return r.condition; });
        });
        Object.keys(fieldRulesById).forEach(function (fieldId) {
          var rules = fieldRulesById[fieldId];
          if (!rules.length) return;
          Array.prototype.forEach.call(formEl.querySelectorAll('[name="' + fieldId + '"]'), function (input) {
            wireFieldValidation(input, rules);
          });
        });

        // Read-only radio/toggle options: HTML's own "readonly" attribute is
        // ignored by browsers on radio/checkbox inputs, so instead we block
        // the interaction directly — the input stays enabled (so its
        // pre-checked value still submits normally via FormData) but clicks
        // and keyboard toggling are no-ops.
        Array.prototype.forEach.call(formEl.querySelectorAll('[data-readonly-choice]'), function (input) {
          input.addEventListener('click', function (e) { e.preventDefault(); });
          input.addEventListener('keydown', function (e) {
            if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
          });
        });

        Array.prototype.forEach.call(formEl.querySelectorAll('.sl-add-another'), function (btn) {
          btn.addEventListener('click', function () {
            var repeatFieldId = btn.getAttribute('data-repeat-for');
            var wrap = formEl.querySelector('.sl-repeatable[data-field-id="' + repeatFieldId + '"]');
            var items = wrap.querySelectorAll('.sl-repeat-item');
            var clone = items[items.length - 1].cloneNode(true);
            var input = clone.querySelector('input,textarea');
            input.value = '';
            input.removeAttribute('required');
            delete input.dataset.rulesWired;
            wireFieldValidation(input, fieldRulesById[repeatFieldId] || []);
            var removeBtn = clone.querySelector('.sl-remove-item');
            if (!removeBtn) {
              removeBtn = document.createElement('button');
              removeBtn.type = 'button';
              removeBtn.className = 'sl-remove-item';
              removeBtn.textContent = '\\u00d7';
              clone.appendChild(removeBtn);
            }
            removeBtn.addEventListener('click', function () { clone.remove(); });
            wrap.appendChild(clone);
          });
        });

        // Save progress — auto-saves the visitor's in-progress answers to
        // this browser's localStorage as they fill the form, and restores
        // them if they come back before submitting (same device/browser
        // only; nothing is sent to a server). Cleared on a successful
        // submit so a finished form doesn't linger.
        var progressKey = 'sparklayer_progress_' + formId;

        function collectProgressData() {
          var data = {};
          new FormData(formEl).forEach(function (value, key) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
              data[key] = [].concat(data[key], value);
            } else {
              data[key] = value;
            }
          });
          return data;
        }

        function saveProgress() {
          try {
            localStorage.setItem(progressKey, JSON.stringify({ page: currentPage, data: collectProgressData() }));
          } catch (e) {
            // localStorage unavailable (private mode, quota, etc.) — progress just won't persist.
          }
        }

        function clearProgress() {
          try { localStorage.removeItem(progressKey); } catch (e) {}
        }

        // Returns the saved page number, or null if there was nothing (or
        // nothing usable) to restore.
        function restoreProgress() {
          var raw;
          try { raw = localStorage.getItem(progressKey); } catch (e) { return null; }
          if (!raw) return null;

          var saved;
          try { saved = JSON.parse(raw); } catch (e) { return null; }
          if (!saved || !saved.data) return null;

          Object.keys(saved.data).forEach(function (name) {
            var values = [].concat(saved.data[name]);
            var els = formEl.querySelectorAll('[name="' + name + '"]');
            if (els.length === 0) return;

            if (els[0].type === 'checkbox' || els[0].type === 'radio') {
              Array.prototype.forEach.call(els, function (el) {
                el.checked = values.indexOf(el.value) !== -1;
              });
              return;
            }

            // A repeatable field may have saved more values than there are
            // inputs right now — clone extra rows first (same as clicking
            // "+ Add another") so every saved value has somewhere to go.
            if (values.length > els.length) {
              var wrap = els[0].closest('.sl-repeatable');
              var addBtn = wrap && formEl.querySelector('.sl-add-another[data-repeat-for="' + wrap.getAttribute('data-field-id') + '"]');
              while (addBtn && formEl.querySelectorAll('[name="' + name + '"]').length < values.length) {
                addBtn.click();
              }
              els = formEl.querySelectorAll('[name="' + name + '"]');
            }

            Array.prototype.forEach.call(els, function (el, i) {
              el.value = values[i] != null ? values[i] : '';
              if (el.type === 'hidden') {
                var statusEl = mount.querySelector('[data-filestatus-for="' + name + '"]');
                if (statusEl && values[i]) statusEl.textContent = 'Previously uploaded file restored.';
              }
            });
          });

          return typeof saved.page === 'number' ? saved.page : 0;
        }

        function getFieldValue(fieldId) {
          var els = formEl.querySelectorAll('[name="' + fieldId + '"]');
          if (els.length === 0) return '';
          if (els[0].type === 'checkbox') {
            return Array.prototype.filter.call(els, function (el) { return el.checked; })
              .map(function (el) { return el.value; }).join(',');
          }
          if (els[0].type === 'radio') {
            var checked = Array.prototype.filter.call(els, function (el) { return el.checked; })[0];
            return checked ? checked.value : '';
          }
          return els[0].value;
        }

        function evalCondition(condStr) {
          var cond;
          try { cond = JSON.parse(condStr); } catch (e) { cond = {}; }
          if (!cond.fieldId) return true;
          var actual = getFieldValue(cond.fieldId);
          return cond.operator === 'not_equals' ? actual !== cond.value : actual === cond.value;
        }

        function updateVisibility() {
          fieldWraps.forEach(function (wrap) {
            var visibleByCondition = evalCondition(wrap.getAttribute('data-condition'));
            var visibleByPage = pageCount <= 1 || Number(wrap.getAttribute('data-page')) === currentPage;
            var visible = visibleByCondition && visibleByPage;
            wrap.classList.toggle('sl-hidden', !visible);
            Array.prototype.forEach.call(wrap.querySelectorAll('input,select,textarea'), function (input) {
              if (input.dataset.wasRequired === undefined) {
                input.dataset.wasRequired = input.required ? '1' : '0';
              }
              input.required = visible && input.dataset.wasRequired === '1';
            });
          });
        }

        function updateNav() {
          if (progressEl) progressEl.textContent = pageCount > 1 ? T.step + ' ' + (currentPage + 1) + ' ' + T.of + ' ' + pageCount : '';
          backBtn.style.display = currentPage === 0 ? 'none' : 'inline-block';
          nextBtn.style.display = currentPage === pageCount - 1 ? 'none' : 'inline-block';
          submitBtn.style.display = currentPage === pageCount - 1 ? 'inline-block' : 'none';
        }

        function goToPage(p) {
          currentPage = Math.max(0, Math.min(pageCount - 1, p));
          updateVisibility();
          updateNav();
        }

        formEl.addEventListener('input', updateVisibility);
        formEl.addEventListener('change', updateVisibility);
        formEl.addEventListener('input', saveProgress);
        formEl.addEventListener('change', saveProgress);
        nextBtn.addEventListener('click', function () {
          if (!formEl.reportValidity()) return;
          goToPage(currentPage + 1);
          saveProgress();
        });
        backBtn.addEventListener('click', function () { goToPage(currentPage - 1); });

        var restoredPage = restoreProgress();
        goToPage(restoredPage || 0);

        Array.prototype.forEach.call(formEl.querySelectorAll('[data-upload-for]'), function (fileInput) {
          fileInput.addEventListener('change', function () {
            var fieldId = fileInput.getAttribute('data-upload-for');
            var hiddenInput = formEl.querySelector('input[type="hidden"][name="' + fieldId + '"]');
            var statusEl = mount.querySelector('[data-filestatus-for="' + fieldId + '"]');
            var file = fileInput.files[0];
            if (!file) return;
            if (statusEl) { statusEl.classList.remove('sl-error'); statusEl.textContent = 'Uploading…'; }
            var body = new FormData();
            body.append('fieldId', fieldId);
            body.append('file', file);
            fetch(proxyUrl + '/upload', { method: 'POST', body: body })
              .then(function (r) { return r.json().then(function (json) { return { ok: r.ok, json: json }; }); })
              .then(function (result) {
                if (result.ok && result.json.url) {
                  hiddenInput.value = result.json.url;
                  if (statusEl) { statusEl.classList.remove('sl-error'); statusEl.textContent = 'Uploaded: ' + file.name; }
                } else if (statusEl) {
                  statusEl.classList.add('sl-error');
                  statusEl.textContent = result.json.message || 'Upload failed';
                }
              })
              .catch(function () {
                if (statusEl) { statusEl.classList.add('sl-error'); statusEl.textContent = 'Upload failed'; }
              });
          });
        });

        formEl.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!formEl.reportValidity()) return;
          var data = {};
          new FormData(e.target).forEach(function (value, key) {
            if (key.indexOf('.') !== -1) {
              var parts = key.split('.');
              data[parts[0]] = data[parts[0]] || {};
              data[parts[0]][parts[1]] = value;
            } else if (Object.prototype.hasOwnProperty.call(data, key)) {
              data[key] = [].concat(data[key], value);
            } else {
              data[key] = value;
            }
          });
          fetch(proxyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: data }),
          })
            .then(function (r) { return r.json(); })
            .then(function (res) {
              messageEl.textContent = res.successMessage || res.error || 'Submitted';
              messageEl.className = 'sl-message ' + (res.error ? 'sl-error' : 'sl-success');
              if (!res.error) {
                e.target.reset();
                Array.prototype.forEach.call(formEl.querySelectorAll('.sl-repeatable'), function (wrap) {
                  var items = wrap.querySelectorAll('.sl-repeat-item');
                  Array.prototype.forEach.call(items, function (item, i) { if (i > 0) item.remove(); });
                });
                clearProgress();
                goToPage(0);
              }
            });
        });
      });
  }

  function scan() {
    injectStyles();
    Array.prototype.forEach.call(document.querySelectorAll('[data-sparklayer-form-id]'), initForm);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scan);
  } else {
    scan();
  }
})();
`;

export function getEmbedScript(): string {
  return SCRIPT;
}
