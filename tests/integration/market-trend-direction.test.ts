/**
 * Market trend-direction regression tests.
 *
 * `analyzeTrends` builds per-day averages and asks `calculateTrend` /
 * `calculateVolatility` for a direction. Those helpers read `price_per_kg`, but
 * the daily-average objects only carried `{ date, averagePrice }` — so the slope
 * and volatility were always NaN and every crop reported "مستقر" (stable)
 * regardless of the real movement. These tests pin the corrected behaviour:
 * a rising series must read "صاعد", a falling one "هابط", and a series with
 * fewer than two days must say the direction is unknown rather than "stable".
 */
import { analyzeTrends } from "../../server/routes/market";

function series(prices: Array<[string, number]>) {
  return prices.map(([date, price]) => ({
    price_date: `${date}T00:00:00.000Z`,
    price_per_kg: price,
    market_location: "Tunis",
    quality_grade: "A",
  }));
}

describe("📈 Market trend direction", () => {
  test("a clearly rising series reports صاعد (rising)", () => {
    const trend = analyzeTrends(
      series([
        ["2024-01-01", 2.0],
        ["2024-01-02", 3.0],
        ["2024-01-03", 4.0],
        ["2024-01-04", 5.0],
        ["2024-01-05", 6.0],
      ]),
    );
    expect(trend.overallTrend).toBe("صاعد");
    expect(trend.trendStrength).toBeGreaterThan(0);
    expect(Number.isFinite(trend.trendStrength)).toBe(true);
    expect(trend.insufficientData).toBeUndefined();
  });

  test("a clearly falling series reports هابط (falling)", () => {
    const trend = analyzeTrends(
      series([
        ["2024-01-01", 6.0],
        ["2024-01-02", 5.0],
        ["2024-01-03", 4.0],
        ["2024-01-04", 3.0],
        ["2024-01-05", 2.0],
      ]),
    );
    expect(trend.overallTrend).toBe("هابط");
    expect(trend.trendStrength).toBeGreaterThan(0);
  });

  test("a flat series reports مستقر (stable) with zero volatility", () => {
    const trend = analyzeTrends(
      series([
        ["2024-01-01", 3.0],
        ["2024-01-02", 3.0],
        ["2024-01-03", 3.0],
      ]),
    );
    expect(trend.overallTrend).toBe("مستقر");
    expect(trend.volatility).toBe(0);
  });

  test("fewer than two days reports an unknown direction, not 'stable'", () => {
    const trend = analyzeTrends(series([["2024-01-01", 3.0]]));
    expect(trend.overallTrend).toBe("غير معروف");
    expect(trend.insufficientData).toBe(true);
  });

  test("trendStrength and volatility are always finite numbers", () => {
    const trend = analyzeTrends(
      series([
        ["2024-01-01", 2.0],
        ["2024-01-02", 2.5],
        ["2024-01-03", 2.2],
      ]),
    );
    expect(Number.isFinite(trend.trendStrength)).toBe(true);
    expect(Number.isFinite(trend.volatility)).toBe(true);
  });
});
