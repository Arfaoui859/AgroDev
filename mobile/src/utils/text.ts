/** Arabic script range (base block). Used to detect Arabic-only prose. */
const ARABIC_RE = /[\u0600-\u06FF]/;

/**
 * True when a string contains Arabic script. The vision diagnosis path returns
 * model prose that the backend requests in Arabic, so for fr/en callers the
 * detail text can be Arabic even though the headings are localised. Screens use
 * this to show an honest "authored in Arabic" note instead of pretending the
 * text is in the user's language.
 */
export function containsArabic(value: string | null | undefined): boolean {
  return typeof value === 'string' && ARABIC_RE.test(value);
}

/** True when any string in a list contains Arabic script. */
export function anyContainsArabic(values: (string | null | undefined)[]): boolean {
  return values.some((v) => containsArabic(v));
}
