/**
 * Livestock demo-herd consistency.
 *
 * `/api/livestock-management/*` serves a seeded demonstration herd because no
 * livestock database is wired yet. Every generator used to call `Math.random()`
 * per request, so `/animals` and `/health-alerts` each drew a *different* herd:
 * alert.animalId never matched a rendered animal and the client could not join
 * the two lists. `/breeding-schedule` also referenced an undefined `animals`
 * binding and threw a ReferenceError (500) on every call.
 *
 * These tests pin the contract: one deterministic herd shared by all endpoints,
 * stable IDs, and honest "simulated" provenance.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

let app: express.Application;
beforeAll(() => {
  app = createServer();
});

const ANIMALS = "/api/livestock-management/animals";

describe("🐄 Livestock demo herd consistency", () => {
  test("repeated requests return the identical herd", async () => {
    const first = await request(app).get(ANIMALS).expect(200);
    const second = await request(app).get(ANIMALS).expect(200);
    expect(second.body.data.map((a: any) => a.id)).toEqual(
      first.body.data.map((a: any) => a.id),
    );
    expect(second.body.summary).toEqual(first.body.summary);
  });

  test("the herd is stable across a fresh server instance", async () => {
    // A process restart must not reshuffle the demo herd.
    const other = createServer();
    const a = await request(app).get(ANIMALS).expect(200);
    const b = await request(other).get(ANIMALS).expect(200);
    expect(b.body.data).toEqual(a.body.data);
  });

  test("animal IDs are stable and unique", async () => {
    const { body } = await request(app).get(ANIMALS).expect(200);
    const ids = body.data.map((a: any) => a.id);
    expect(ids.length).toBeGreaterThan(0);
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids).toContain("animal_1");
  });

  test("every health alert references an existing animal", async () => {
    const animals = await request(app).get(ANIMALS).expect(200);
    const ids = new Set(animals.body.data.map((a: any) => a.id));
    const alerts = await request(app)
      .get("/api/livestock-management/health-alerts")
      .expect(200);
    expect(alerts.body.data.length).toBeGreaterThan(0);
    for (const alert of alerts.body.data) {
      expect(ids.has(alert.animalId)).toBe(true);
    }
  });

  test("every breeding record references existing animals", async () => {
    const animals = await request(app).get(ANIMALS).expect(200);
    const ids = new Set(animals.body.data.map((a: any) => a.id));
    const schedule = await request(app)
      .get("/api/livestock-management/breeding-schedule")
      .expect(200);
    expect(schedule.body.success).toBe(true);
    for (const entry of schedule.body.data) {
      expect(ids.has(entry.animalId)).toBe(true);
    }
  });

  test("animal detail resolves for a known ID and 404s for an unknown one", async () => {
    const animals = await request(app).get(ANIMALS).expect(200);
    const id = animals.body.data[0].id;
    const found = await request(app)
      .get(`/api/livestock-management/animals/${id}`)
      .expect(200);
    expect(found.body.data.id).toBe(id);

    const missing = await request(app)
      .get("/api/livestock-management/animals/does-not-exist")
      .expect(404);
    expect(missing.body.success).toBe(false);
  });

  test("breeding summary counts come from the same herd", async () => {
    const animals = await request(app).get(ANIMALS).expect(200);
    const expectedActive = animals.body.data.filter(
      (a: any) => a.breedingStatus === "active",
    ).length;
    const schedule = await request(app)
      .get("/api/livestock-management/breeding-schedule")
      .expect(200);
    expect(schedule.body.summary.totalBreedingAnimals).toBe(expectedActive);
    expect(schedule.body.data.length).toBe(expectedActive);
  });

  test("production analytics and feed inventory share the herd", async () => {
    const animals = await request(app).get(ANIMALS).expect(200);
    const producers = animals.body.data.filter((a: any) => a.milkProduction).length;
    const analytics = await request(app)
      .get("/api/livestock-management/production-analytics")
      .expect(200);
    expect(analytics.body.data.milk.totalProducers).toBe(producers);

    const feed = await request(app)
      .get("/api/livestock-management/feed-inventory")
      .expect(200);
    const feedAgain = await request(app)
      .get("/api/livestock-management/feed-inventory")
      .expect(200);
    expect(feedAgain.body.data).toEqual(feed.body.data);
  });

  test("demo data is labelled simulated and never claimed as real", async () => {
    for (const path of [
      ANIMALS,
      "/api/livestock-management/health-alerts",
      "/api/livestock-management/breeding-schedule",
      "/api/livestock-management/feed-inventory",
      "/api/livestock-management/production-analytics",
    ]) {
      const { body } = await request(app).get(path).expect(200);
      expect(body.dataSource).toBe("simulated");
      expect(body.isRealData).toBe(false);
      expect(typeof body.disclaimer).toBe("string");
      expect(body.disclaimer.length).toBeGreaterThan(0);
    }
  });
});
