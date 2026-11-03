/**
 * Financial CRUD lifecycle test.
 *
 * ExpenseTracker.tsx and RevenueAnalysis.tsx implement edit and delete, but the
 * backend only had create + list, so saving an edit or deleting silently did
 * nothing (404). This exercises the full create -> update -> delete lifecycle
 * through the real Express app.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("💰 Expense / revenue CRUD lifecycle", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("expense create -> update -> delete", async () => {
    const created = await request(app)
      .post("/api/expenses")
      .send({
        farmerId: "test-farmer",
        category: "seeds",
        subcategory: "wheat",
        amount: 100,
        currency: "TND",
        date: "2026-01-01",
        description: "initial",
        isRecurring: false,
        paymentMethod: "cash",
        tags: [],
      })
      .expect(200);
    expect(created.body.success).toBe(true);
    const id = created.body.data.id;
    expect(id).toBeTruthy();

    const updated = await request(app)
      .put(`/api/expenses/${id}`)
      .send({ amount: 250, description: "updated" })
      .expect(200);
    expect(updated.body.success).toBe(true);
    expect(updated.body.data.amount).toBe(250);
    expect(updated.body.data.description).toBe("updated");
    // Identity must be preserved across the update.
    expect(updated.body.data.id).toBe(id);

    await request(app).delete(`/api/expenses/${id}`).expect(200);

    // A second delete must report not-found, not silently succeed.
    await request(app).delete(`/api/expenses/${id}`).expect(404);
  });

  test("revenue create -> update -> delete", async () => {
    const created = await request(app)
      .post("/api/revenues")
      .send({
        farmerId: "test-farmer",
        cropType: "wheat",
        varietyName: "Karim",
        quantitySold: 10,
        unit: "ton",
        pricePerUnit: 800,
        totalRevenue: 8000,
        currency: "TND",
        saleDate: "2026-06-01",
        buyer: "market",
        marketLocation: "Tunis",
        qualityGrade: "A",
        seasonYear: 2026,
        harvestDate: "2026-05-20",
        storageTime: 5,
        transportationCost: 100,
        marketingCost: 50,
        netRevenue: 7850,
      })
      .expect(200);
    expect(created.body.success).toBe(true);
    const id = created.body.data.id;

    const updated = await request(app)
      .put(`/api/revenues/${id}`)
      .send({ quantitySold: 12 })
      .expect(200);
    expect(updated.body.data.quantitySold).toBe(12);
    expect(updated.body.data.id).toBe(id);

    await request(app).delete(`/api/revenues/${id}`).expect(200);
    await request(app).delete(`/api/revenues/${id}`).expect(404);
  });

  test("updating a non-existent expense is a clean 404", async () => {
    const response = await request(app)
      .put("/api/expenses/does-not-exist")
      .send({ amount: 1 })
      .expect(404);
    expect(response.body.success).toBe(false);
  });

  test("list endpoints still work", async () => {
    await request(app).get("/api/expenses").expect(200);
    await request(app).get("/api/revenues").expect(200);
  });
});
