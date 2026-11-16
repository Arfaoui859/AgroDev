import { expensePayload, isValidISODate } from "../../server/routes/farm-finance";

describe("farm finance input validation", () => {
  it.each(["2026-02-30", "2026-13-01", "2026-00-10", "not-a-date", "2026-1-01", ""])(
    "rejects invalid calendar date %s",
    (date) => {
      expect(isValidISODate(date)).toBe(false);
    },
  );

  it("accepts a real ISO calendar date", () => {
    expect(isValidISODate("2026-11-10")).toBe(true);
  });

  it("rejects an expense linked to a malformed farm identifier", () => {
    expect(expensePayload({
      amount: 120,
      date: "2026-11-10",
      category: "seeds",
      farm_id: "not-a-uuid",
    }, "user-1")).toBeNull();
  });

  it("accepts a cultivation link only with a valid farm and cultivation UUID", () => {
    const validUuid = "33333333-3333-4333-8333-333333333333";
    expect(expensePayload({ amount: 25, date: "2026-11-10", category: "seeds", farm_id: validUuid, cultivation_id: validUuid }, "user-1"))
      .toMatchObject({ farm_id: validUuid, cultivation_id: validUuid });
    expect(expensePayload({ amount: 25, date: "2026-11-10", category: "seeds", cultivation_id: validUuid }, "user-1")).toBeNull();
    expect(expensePayload({ amount: 25, date: "2026-11-10", category: "seeds", farm_id: validUuid, cultivation_id: "bad-id" }, "user-1")).toBeNull();
  });

  it("persists accepted expense amounts in TND and binds the user id", () => {
    expect(expensePayload({
      amount: 120,
      date: "2026-11-10",
      category: "seeds",
      currency: "tnd",
    }, "verified-user")).toMatchObject({
      user_id: "verified-user",
      amount: 120,
      currency: "TND",
      expense_date: "2026-11-10",
    });
  });
});
