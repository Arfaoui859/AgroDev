import { equipmentPayload, taskPayload, validDate } from "../../server/routes/farm-operations";

const userId = "11111111-1111-4111-8111-111111111111";
const otherUserId = "22222222-2222-4222-8222-222222222222";
const farmId = "33333333-3333-4333-8333-333333333333";

describe("farm equipment and task input validation", () => {
  it("accepts valid calendar dates and rejects impossible dates", () => {
    expect(validDate("2026-11-10")).toBe(true);
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("10/11/2026")).toBe(false);
  });

  it("normalizes valid equipment and fixes the launch currency to TND", () => {
    expect(equipmentPayload({
      name: "Tractor",
      category: "tractor",
      purchase_cost: "12000",
      currency: "TND",
      created_by: otherUserId,
      owner_id: otherUserId,
    })).toEqual(expect.objectContaining({
      name: "Tractor",
      category: "tractor",
      purchase_cost: 12000,
      currency: "TND",
    }));
    expect(equipmentPayload({ name: "Tractor", currency: "EUR" })).toBeNull();
    expect(equipmentPayload({ name: "", currency: "TND" })).toBeNull();
  });

  it("does not allow browser fields to override tenant or creator identity", () => {
    const payload = equipmentPayload({
      farm_id: otherUserId,
      created_by: otherUserId,
      owner_id: otherUserId,
      name: "Pump",
    });
    expect(payload).not.toHaveProperty("farm_id");
    expect(payload).not.toHaveProperty("created_by");
    expect(payload).not.toHaveProperty("owner_id");
  });

  it("sets completion timestamps server-side and rejects cross-user assignment", () => {
    const payload = taskPayload({
      title: "Irrigate field",
      status: "completed",
      assigned_to: userId,
      created_by: otherUserId,
      farm_id: otherUserId,
    }, userId);
    expect(payload).toEqual(expect.objectContaining({
      title: "Irrigate field",
      status: "completed",
      assigned_to: userId,
    }));
    expect(payload?.completed_at).toEqual(expect.any(String));
    expect(payload).not.toHaveProperty("created_by");
    expect(payload).not.toHaveProperty("farm_id");
    expect(taskPayload({ title: "Inspect", assigned_to: otherUserId }, userId)).toBeNull();
  });

  it("rejects unsupported statuses, categories, and negative amounts", () => {
    expect(equipmentPayload({ name: "Pump", purchase_cost: -1 })).toBeNull();
    expect(equipmentPayload({ name: "Pump", category: "spaceship" })).toBeNull();
    expect(taskPayload({ title: "Inspect", status: "maybe" }, userId)).toBeNull();
    expect(taskPayload({ title: "Inspect", priority: "critical-ish" }, userId)).toBeNull();
  });
});
