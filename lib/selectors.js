/*
 * WEBSITE-SPECIFIC CONFIGURATION
 *
 * Keep page selectors and profile-field selectors here so the extraction
 * engine and popup do not need to change when the website's markup changes.
 */
globalThis.PROFILE_EXTRACTOR_CONFIG = {
  website: {
    displayName: "Profile website",
    profileUrler: {
      hostname: "accounts.esn.org",
      listingPathPattern: "(?:^|\\/)(?:alumni|pending_members|members)\\/?$",
      rowSelector: "td.views-field.views-field-views-conditional-field-1"
    },
    // A page is considered a likely profile page when this selector exists.
    // The username heading is also used as a second page signature.
    pageSignatureSelectors: [
      "#accounts-page-wrapper",
      "#accounts-page-wrapper > div.page-nav-wrapper > div > div.page-header-wrapper > div > h1"
    ]
  },

  // Data extracted from the profile and shown in the popup.
  fields: [
    { key: "name", label: "Name" },
    { key: "username", label: "Username" },
    { key: "email", label: "Email" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" }
  ],

  // Exact spreadsheet order. Use { label: "" } for an intentionally blank column.
  outputColumns: [
    { key: "name", label: "Name" },
    { key: "username", label: "Username" },
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "email", label: "Email" },
    { key: "linkedin", label: "LinkedIn" }
  ],

  // Customize the copied spreadsheet output here.
  spreadsheet: {
    delimiter: "\t",
    lineEnding: "\r\n",
    includeHeader: false,
    // Switch to "raw" to copy extracted values instead of Excel formulas.
    outputMode: "formatted",
    namedFunctions: {
      username: "ESNACCOUNT",
      facebook: "FB",
      instagram: "INSTA",
      linkedin: "LINKEDIN"
    }
  },

  selectors: {
    name: '#block-views-block-user-block-block-1 > div > div > div > div > div.views-field.views-field-nothing > span',
    username: '#accounts-page-wrapper > div.page-nav-wrapper > div > div.page-header-wrapper > div > h1',
    email: '#bootstrap-panel > div.panel-body > div.field.field--name-field-esn-email.field--type-email.field--label-inline > div.field--item',

    facebook: '#panel-group-social-networks > div.panel-body > ul > li.field.field--name-field-facebook-profile.field--type-link.field--label-hidden.field--item.social > a',
    linkedin: '#panel-group-social-networks > div.panel-body > ul > li.field.field--name-field-linkedin-profile.field--type-link.field--label-hidden.field--item.social > a',
    instagram: '#panel-group-social-networks > div.panel-body > ul > li.field.field--name-field-instagram-profile.field--type-link.field--label-hidden.field--item.social > a'
  }
};
