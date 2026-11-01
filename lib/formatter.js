/*
 * Converts extracted values into one spreadsheet row.
 * Tabs/newlines are replaced so a profile always occupies exactly one row.
 */
globalThis.ProfileRowFormatter = {
  cleanCell(value) {
    return String(value ?? "")
      .replace(/[\t\r\n]+/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();
  },

  toSpreadsheet(data, columns, options = {}) {
    const delimiter = options.delimiter ?? "\t";
    const lineEnding = options.lineEnding ?? "\r\n";
    const rows = [];

    if (options.includeHeader) {
      rows.push(columns.map(column => this.cleanCell(column.label)).join(delimiter));
    }

    rows.push(columns
      .map(column => this.cleanCell(column.key ? data[column.key] : ""))
      .join(delimiter));

    return rows.join(lineEnding);
  },

  toTsvRow(data, columns) {
    return this.toSpreadsheet(data, columns);
  }
};
