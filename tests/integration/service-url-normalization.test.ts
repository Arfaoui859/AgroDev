/**
 * AI service URL normalization.
 *
 * Render's `fromService` with `property: hostport` returns "host:port" with no
 * scheme (e.g. "agrogrowth-soil-analysis.onrender.com"). Axios rejects a
 * scheme-less URL, so without normalization every AI route would fail in a Render
 * deployment even though it works locally with explicit http://localhost URLs.
 */
import { normalizeServiceUrl } from "../../server/routes/ai-services-gateway";

describe("🔗 AI service URL normalization", () => {
  const fallback = "http://localhost:8001";

  test("adds http:// to Render hostport values", () => {
    expect(normalizeServiceUrl("agrogrowth-soil.onrender.com", fallback)).toBe(
      "http://agrogrowth-soil.onrender.com",
    );
  });

  test("preserves an explicit scheme", () => {
    expect(normalizeServiceUrl("https://soil.example.com", fallback)).toBe(
      "https://soil.example.com",
    );
    expect(normalizeServiceUrl("http://soil:8001", fallback)).toBe(
      "http://soil:8001",
    );
  });

  test("strips trailing slashes so request paths do not double up", () => {
    expect(normalizeServiceUrl("https://soil.example.com/", fallback)).toBe(
      "https://soil.example.com",
    );
    expect(normalizeServiceUrl("soil:8001///", fallback)).toBe(
      "http://soil:8001",
    );
  });

  test("falls back when the variable is unset or blank", () => {
    expect(normalizeServiceUrl(undefined, fallback)).toBe(fallback);
    expect(normalizeServiceUrl("", fallback)).toBe(fallback);
    expect(normalizeServiceUrl("   ", fallback)).toBe(fallback);
  });

  test("Docker Compose style URLs pass through unchanged", () => {
    expect(normalizeServiceUrl("http://soil-analysis:8001", fallback)).toBe(
      "http://soil-analysis:8001",
    );
  });
});
