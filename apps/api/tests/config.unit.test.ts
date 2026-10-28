import { describe, expect, it } from "vitest";
import express from "express";
import request from "supertest";
import { parseOrigins } from "../src/config/env.js";

describe("parseOrigins", () => {
  it("acepta un solo origen", () => {
    expect(parseOrigins("http://localhost:5173")).toEqual(["http://localhost:5173"]);
  });

  it("separa por comas, recorta espacios y quita barras finales", () => {
    expect(parseOrigins(" https://esencia.vercel.app/ , https://otro.com// ")).toEqual([
      "https://esencia.vercel.app",
      "https://otro.com",
    ]);
  });

  it("ignora entradas vacías", () => {
    expect(parseOrigins("https://a.com,, ,")).toEqual(["https://a.com"]);
  });
});

describe("trust proxy", () => {
  // Reproduce la cadena de producción: usuario → Vercel → Render (2 proxies).
  const ipSeenBy = async (trustProxy: number) => {
    const app = express();
    app.set("trust proxy", trustProxy);
    app.get("/ip", (req, res) => {
      res.json({ ip: req.ip });
    });
    const res = await request(app).get("/ip").set("X-Forwarded-For", "203.0.113.7, 76.76.21.21");
    return res.body.ip as string;
  };

  it("con TRUST_PROXY=2 la IP es la del usuario real", async () => {
    expect(await ipSeenBy(2)).toBe("203.0.113.7");
  });

  it("con TRUST_PROXY=1 se vería la IP de Vercel (el error que se evita)", async () => {
    expect(await ipSeenBy(1)).toBe("76.76.21.21");
  });
});
