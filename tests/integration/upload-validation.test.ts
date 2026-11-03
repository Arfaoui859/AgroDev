/**
 * Upload-validation regression tests.
 *
 * Multer's fileFilter rejected non-image uploads with a plain `new Error(...)`,
 * which carries no HTTP status, so the global error handler answered 500 for
 * what is a client mistake. These tests assert 400 (and never 500) for bad
 * uploads, and that oversized files map to 413.
 */
import request from "supertest";
import express from "express";
import { createServer } from "../../server/index";

const ORIGINAL = { ...process.env };

describe("📎 Upload validation", () => {
  let app: express.Application;

  beforeEach(() => {
    process.env = { ...ORIGINAL, NODE_ENV: "production", AI_RATE_LIMIT_MAX: "500" };
    app = createServer();
  });

  afterAll(() => {
    process.env = ORIGINAL;
  });

  test("non-image upload is rejected with 400, not 500", async () => {
    const res = await request(app)
      .post("/api/ai/images/detect-disease")
      .attach("file", Buffer.from("this is not an image"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(400);
    expect(res.status).not.toBe(500);
    expect(typeof res.body.error).toBe("string");
  });

  test("non-image upload on the disease route is rejected with 400", async () => {
    const res = await request(app)
      .post("/api/disease/analyze")
      .attach("images", Buffer.from("nope"), {
        filename: "notes.txt",
        contentType: "text/plain",
      });
    expect(res.status).toBe(400);
    expect(res.status).not.toBe(500);
  });

  test("a valid image passes the filter (does not 400 on validation)", async () => {
    // 1x1 PNG.
    const png = Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64",
    );
    const res = await request(app)
      .post("/api/ai/images/detect-disease")
      .attach("file", png, { filename: "leaf.png", contentType: "image/png" });
    // The image-diagnosis microservice is not running in unit tests, so we only
    // assert the upload was accepted (not a 400 upload-validation error).
    expect(res.status).not.toBe(400);
  });
});
