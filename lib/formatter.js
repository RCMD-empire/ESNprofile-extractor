/*

* Converts extracted values into one spreadsheet row.
 * Tabs/newlines are replaced so a profile always occupies exactly one row.
 */
globalThis.ProfileRowFormatter = {
  decodeUrlComponent(value) {
    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  },

  cleanCell(value) {
    return String(value ?? "")
      .replace(/[\t\r\n]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  },

  extractUsername(value) {
    const input = this.cleanCell(value);
    if (!input) return "";

    try {
      const url = new URL(input);
      const hostname = url.hostname.toLowerCase();
      const isFacebookProfileUrl =
        (hostname === "fb.com" || hostname === "facebook.com" || hostname.endsWith(".facebook.com")) &&
        url.pathname.toLowerCase() === "/profile.php" &&
        url.searchParams.has("id");

      if (isFacebookProfileUrl) {
        return this.cleanCell(url.searchParams.get("id"));
      }

      const isFacebookShareUrl =
        (hostname === "fb.com" || hostname === "facebook.com" || hostname.endsWith(".facebook.com")) &&
        /^\/share(?:\/|$)/i.test(url.pathname);

      if (isFacebookShareUrl) return input;

      const segments = url.pathname.split("/").filter(Boolean);
      const username = segments[segments.length - 1] || input;
      return this.cleanCell(this.decodeUrlComponent(username)).replace(/^@/, "");
    } catch {
      return input.replace(/^@/, "");
    }
  },

  toNamedFunctionFormula(functionName, value) {
    const username = this.extractUsername(value);
    if (!functionName || !username) return "";

    const escapedUsername = username.replace(/"/g, "\"\"");
    return `=${functionName}("${escapedUsername}")`;
  },

  toESNAccountFormula(value, functionName = "ESNACCOUNT") {
    return this.toNamedFunctionFormula(functionName, value);
  },

  toFacebookFormula(value, functionName = "FB") {
    return this.toNamedFunctionFormula(functionName, value);
  },

  toInstagramFormula(value, functionName = "INSTA") {
    return this.toNamedFunctionFormula(functionName, value);
  },

  toLinkedInFormula(value, functionName = "LINKEDIN") {
    return this.toNamedFunctionFormula(functionName, value);
  },

  toFormattedValue(key, value, namedFunctions = {}) {
    switch (key) {
      case "username":
        return this.toESNAccountFormula(value, namedFunctions.username);
      case "facebook":
        return this.toFacebookFormula(value, namedFunctions.facebook);
      case "instagram":
        return this.toInstagramFormula(value, namedFunctions.instagram);
      case "linkedin":
        return this.toLinkedInFormula(value, namedFunctions.linkedin);
      default:
        return this.cleanCell(value);
    }
  },

  toSpreadsheet(data, columns, options = {}) {
    const delimiter = options.delimiter ?? "\t";
    const lineEnding = options.lineEnding ?? "\r\n";
    const rows = [];

    if (options.includeHeader) {
      rows.push(columns.map(column => this.cleanCell(column.label)).join(delimiter));
    }

    rows.push(columns
      .map(column => {
        if (!column.key) return "";
        if (options.outputMode === "formatted") {
          return this.toFormattedValue(column.key, data[column.key], options.namedFunctions);
        }
        return this.cleanCell(data[column.key]);
      })
      .join(delimiter));

    return rows.join(lineEnding);
  },

  toTsvRow(data, columns) {
    return this.toSpreadsheet(data, columns);
  }
};
