import { describe, it, expect } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("GET /api/v1/health", () => {
  it("responde 200 con status ok", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/health");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: "ok" });
  });
});

describe("GET /api/v1/not-found", () => {
  it("responde 404 con el formato de error estándar", async () => {
    const app = createApp();
    const res = await request(app).get("/api/v1/ruta-que-no-existe");

    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe("NOT_FOUND");
  });
});
