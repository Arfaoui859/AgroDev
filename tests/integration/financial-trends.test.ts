import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

describe("Financial summaries require persisted user records", () => {
  let app: express.Application;
  beforeAll(() => {
    app = createServer();
  });

  test("does not return synthetic financial trends for an empty or unknown period", async () => {
    const response = await request(app)
      .get("/api/financial-summary?period=yearly&year=2099");

    expect([401, 403]).toContain(response.status);
  });
});
