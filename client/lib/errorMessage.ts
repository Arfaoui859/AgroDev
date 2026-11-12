/**
 * Coerce an unknown thrown value into a lowercase message string.
 *
 * `catch (error: any)` followed by `error.message.includes(...)` throws a
 * `TypeError` whenever the rejection is not an `Error` with a string message
 * (a bare string, a Supabase `PostgrestError`-shaped object, `undefined`). That
 * secondary throw escapes the catch block, unmounts the page and surfaces the
 * generic "حدث خطأ غير متوقع" boundary — the reported unexpected-error page.
 */
export function errorMessageText(error: unknown): string {
  if (typeof error === "string") return error;
  if (error && typeof error === "object") {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") return message;
  }
  return "";
}

/** Case-insensitive substring test that never throws on a malformed error. */
export function errorMessageIncludes(error: unknown, needle: string): boolean {
  return errorMessageText(error).toLowerCase().includes(needle.toLowerCase());
}
