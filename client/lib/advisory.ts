/**
 * Helpers for the LLM advisory attached to AI analysis results.
 *
 * Services attach an `advisory` object only when a provider actually produced
 * text. Screens must render nothing when it is absent rather than inventing a
 * fallback, so the presence check lives here (plain TS, unit-testable) instead
 * of being duplicated in every component.
 */

export interface Advisory {
  text?: string;
  language?: string;
  model_source?: string;
}

/** True when an advisory carries non-blank text. */
export function hasAdvisory(advisory?: Advisory | null): boolean {
  return typeof advisory?.text === "string" && advisory.text.trim().length > 0;
}

/** Trimmed advisory text, or null when there is nothing to render. */
export function advisoryText(advisory?: Advisory | null): string | null {
  return hasAdvisory(advisory) ? advisory!.text!.trim() : null;
}

/** Best-effort display name of the model that wrote the advisory. */
export function advisoryModel(advisory?: Advisory | null): string | null {
  const model = advisory?.model_source;
  return typeof model === "string" && model.trim() ? model : null;
}
