/**
 * Environment variable helpers.
 *
 * Several AI service URLs have accumulated more than one name across the
 * project's history (e.g. MARKET_PREDICTION_URL vs MARKET_FORECAST_URL, or
 * INTELLIGENT_AGENT_URL vs SMART_ASSISTANT_URL). A deployment that sets only
 * the older alias used to look "unconfigured" to code reading the newer name,
 * which silently disabled a service that was actually running. These helpers
 * accept any of the known aliases so a configured URL is never missed.
 */

/** First non-empty value among the given environment variable names. */
export function firstEnv(...names: string[]): string | undefined {
  for (const name of names) {
    const value = process.env[name];
    if (value && value.trim()) return value.trim();
  }
  return undefined;
}
