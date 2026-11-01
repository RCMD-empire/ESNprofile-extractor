# Profile Data Extractor — Chrome Extension

Version: 1.0.0

A small Manifest V3 Chrome extension that reads the currently open profile page, previews the extracted fields, and copies one tab-separated row for Excel or Google Sheets.

## Included fields and output order

The popup shows these extracted fields:

1. Name
2. Username
3. Email
4. LinkedIn
5. Instagram
6. Facebook

The copied spreadsheet row uses the order configured in `outputColumns`.

## Installation

1. Extract the ZIP file into a folder on your computer.
2. Open Google Chrome.
3. Navigate to `chrome://extensions`.
4. Enable **Developer mode** (top-right).
5. Select **Load unpacked**.
6. Choose the extracted `profile-extractor-chrome` folder (the folder containing `manifest.json`).
7. Pin **Profile Data Extractor** to the Chrome toolbar if desired.

No build step, Node.js, server, account credentials, or external service is required.

## Usage

1. Sign in to the target website normally in Chrome.
2. Open an individual profile page.
3. Click the Profile Data Extractor toolbar icon.
4. Select **Extract profile**.
5. Review the detected values in the popup.
6. Select **Copy spreadsheet row**.
7. Select the destination cell in Excel or Google Sheets and paste.

The extension does not navigate to other profiles or process bookmarks. It only reads the active tab after you click the extraction button.

## Website-specific selectors

Edit `lib/selectors.js` to update the website name, page-detection selectors, extracted fields, spreadsheet output, or output order.

The supplied selectors are the ones provided for this first version:

- Name: `#block-views-block-user-block-block-1 > div > div > div > div > div.views-field.views-field-nothing > span`
- Username: `#accounts-page-wrapper > div.page-nav-wrapper > div > div.page-header-wrapper > div > h1`
- Email: `#bootstrap-panel > div.panel-body > div.field.field--name-field-esn-email.field--type-email.field--label-inline > div.field--item`
- Facebook: `#panel-group-social-networks > div.panel-body > ul > li.field--name-field-facebook-profile > a`
- LinkedIn: `#panel-group-social-networks > div.panel-body > ul > li.field--name-field-linkedin-profile > a`
- Instagram: `#panel-group-social-networks > div.panel-body > ul > li.field--name-field-instagram-profile > a`

Phone is not included in the extracted fields or spreadsheet output.

### Spreadsheet output

Customize the copied Excel-compatible output in the `spreadsheet` object in `lib/selectors.js`:

```js
spreadsheet: {
  delimiter: "\t",
  lineEnding: "\r\n",
  includeHeader: false
}
```

The `outputColumns` array controls the exact output order. Use `{ label: "" }` for a blank
spreadsheet column:

```js
outputColumns: [
  { key: "username", label: "Username" },
  { label: "" },
  { label: "" },
  { key: "email", label: "Email" },
  { key: "instagram", label: "Instagram" }
]
```

Set `includeHeader` to `true` to include labels as a header row. Blank columns remain blank
in both the header and data rows.

## How profile detection works

The extension checks for the supplied page signature selectors and requires a detected name or username. This avoids treating every ordinary website tab as a profile page.

The extension does not currently enforce a hostname because the profile website's URL/domain was not supplied. If you want strict domain matching, add the known hostname to `isSupportedPageUrl()` in `popup.js`.

## Permissions and privacy

The extension requests only:

- `activeTab`: temporary access to the tab after the user invokes the extension.
- `scripting`: inject the local extraction script into that tab.
- `clipboardWrite`: support copying the generated row.

It does not request bookmark, history, cookie, or broad host permissions. It does not store profile data or send it to a server.

Only extract and use profile information in ways permitted by the website's terms and applicable privacy/data-protection rules.

## Troubleshooting

### "Not detected"

- Confirm that you are on an individual profile page.
- Confirm that the page has finished loading.
- Check whether the username and name selectors still match in DevTools.
- The website may have changed its HTML structure; update `lib/selectors.js`.

### A field is blank

- Confirm the relevant selector in DevTools Console, for example:

```js
document.querySelector('YOUR_SELECTOR')?.textContent.trim()
```

- For social links, inspect the `href` attribute:

```js
document.querySelector('YOUR_SELECTOR')?.getAttribute('href')
```

- Update the corresponding selector in `lib/selectors.js`.

### Extension changes are not visible

After editing files, open `chrome://extensions` and click the extension's reload icon. Close and reopen its popup.

## Project structure

```text
profile-extractor-chrome/
├── manifest.json
├── popup.html
├── popup.css
├── popup.js
├── README.md
├── content/
│   └── extractor.js
└── lib/
    ├── selectors.js
    └── formatter.js
```
