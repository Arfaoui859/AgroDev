import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const TARGET_USER_ID = "2f1c7b2a-6f9d-4e7a-9f4b-1a3c5d7e9b11";
let app: express.Application;

beforeAll(() => {
  app = createServer();
});

describe("administrator user mutations require a verified admin session", () => {
  test.each([
    ["PATCH", "role", { role: "farmer" }],
    ["PATCH", "status", { isActive: false }],
  ])("%s /api/admin/users/:userId/%s rejects an anonymous/demo identity", async (method, endpoint, body) => {
    const response = await request(app)
      .patch(`/api/admin/users/${TARGET_USER_ID}/${endpoint}`)
      .send(body);

    expect([401, 403]).toContain(response.status);
    expect(response.body.success).not.toBe(true);
  });

  test("profile update endpoint rejects an anonymous/demo identity", async () => {
    const response = await request(app)
      .patch(`/api/admin/users/${TARGET_USER_ID}/profile`)
      .send({ fullName: "Updated User" });

    expect([401, 403]).toContain(response.status);
    expect(response.body.success).not.toBe(true);
  });

  test("user invitation endpoint rejects an anonymous/demo identity", async () => {
    const response = await request(app)
      .post("/api/admin/users")
      .send({ email: "new-user@example.com", fullName: "New User", role: "farmer" });

    expect([401, 403]).toContain(response.status);
    expect(response.body.success).not.toBe(true);
  });

  test("account status endpoint rejects non-boolean status values", async () => {
    const response = await request(app)
      .patch(`/api/admin/users/${TARGET_USER_ID}/status`)
      .send({ isActive: "false" });

    expect([400, 401, 403]).toContain(response.status);
    expect(response.body.success).not.toBe(true);
  });
});
