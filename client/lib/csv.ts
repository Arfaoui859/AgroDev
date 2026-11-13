/**
 * Client-side CSV export.
 *
 * Several report screens export the rows the user is currently looking at.
 * Exporting is a pure presentation concern, so it stays in the browser — no
 * server round-trip and no risk of exporting another user's records, since the
 * caller only ever holds rows it already fetched under RLS.
 */

/** Escape one CSV field: wrap in quotes and double any embedded quote. */
function escapeField(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

/** Serialise a header row plus data rows to a CSV string. */
export function toCsv(headers: string[], rows: unknown[][]): string {
  return [headers, ...rows]
    .map((row) => row.map(escapeField).join(","))
    .join("\n");
}

/**
 * Trigger a browser download of `csv` as `filename`.
 *
 * A UTF-8 BOM is prepended so Excel renders Arabic (ar-TN) correctly instead of
 * mojibake.
 */
export function downloadCsv(filename: string, csv: string): void {
  const blob = new Blob(["\uFEFF" + csv], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
