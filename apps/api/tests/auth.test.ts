import { beforeEach, afterAll, describe, expect, it } from "vitest";
import request from "supertest";
import type { Express } from "express";
import { createApp } from "../src/app.js";
import { prisma } from "../src/lib/prisma.js";
import { requireAuth } from "../src/modules/auth/auth.middleware.js";

// Ruta de prueba protegida: demuestra cómo otros módulos usarán `requireAuth`.
const app: Express = createApp((a) => {
  a.get("/__test/me", requireAuth, (req, res) => {
    res.json({ userId: req.userId });
  });
});

const credentials = { email: "ana@example.com", password: "clave1234", birthDate: "1998-05-20" };

function cookieOf(res: request.Response): string {
  const header = res.headers["set-cookie"] as unknown as string[] | undefined;
  const cookie = header?.find((c) => c.startsWith("refreshToken="));
  if (!cookie) throw new Error("La respuesta no incluye la cookie refreshToken");
  return cookie.split(";")[0]!;
}

beforeEach(async () => {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "users" CASCADE');
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("POST /api/v1/auth/register", () => {
  it("crea la cuenta, devuelve el access token y fija la cookie httpOnly", async () => {
    const res = await request(app).post("/api/v1/auth/register").send(credentials);

    expect(res.status).toBe(201);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(res.body.user.email).toBe("ana@example.com");
    expect(res.body.user).not.toHaveProperty("passwordHash");

    const setCookie = (res.headers["set-cookie"] as unknown as string[]).join(";");
    expect(setCookie).toContain("refreshToken=");
    expect(setCookie).toContain("HttpOnly");
    expect(setCookie).toContain("Path=/api/v1/auth");
  });

  it("guarda la contraseña hasheada con argon2id", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
    const user = await prisma.user.findUniqueOrThrow({ where: { email: credentials.email } });
    expect(user.passwordHash).toMatch(/^\$argon2id\$/);
  });

  it("rechaza a menores de edad con 400", async () => {
    const year = new Date().getUTCFullYear() - 16;
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...credentials, birthDate: `${year}-01-01` });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    expect(await prisma.user.count()).toBe(0);
  });

  it("rechaza un email ya registrado con 409 (sin distinguir mayúsculas)", async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...credentials, email: "ANA@example.com" });

    expect(res.status).toBe(409);
    expect(res.body.error.code).toBe("CONFLICT");
  });

  it("devuelve el detalle por campo ante un payload inválido", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({ email: "x", password: "1" });

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("VALIDATION_ERROR");
    const fields = res.body.error.details.map((d: { field: string }) => d.field);
    expect(fields).toEqual(expect.arrayContaining(["email", "password", "birthDate"]));
  });
});

describe("POST /api/v1/auth/login", () => {
  beforeEach(async () => {
    await request(app).post("/api/v1/auth/register").send(credentials);
  });

  it("inicia sesión con credenciales correctas", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "ANA@example.com", password: credentials.password });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(cookieOf(res)).toMatch(/^refreshToken=/);
  });

  it("responde 401 genérico con contraseña incorrecta o email inexistente", async () => {
    const wrongPassword = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: credentials.email, password: "otra-clave1" });
    const unknownEmail = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: "nadie@example.com", password: "clave1234" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.error.message).toBe(unknownEmail.body.error.message);
  });

  it("rechaza cuentas eliminadas", async () => {
    await prisma.user.update({ where: { email: credentials.email }, data: { deletedAt: new Date() } });
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: credentials.email, password: credentials.password });

    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/refresh", () => {
  it("rota el refresh token y entrega un nuevo access token", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(credentials);
    const first = cookieOf(reg);

    const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", first);

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
    expect(cookieOf(res)).not.toBe(first);
  });

  it("sin cookie responde 401", async () => {
    const res = await request(app).post("/api/v1/auth/refresh");
    expect(res.status).toBe(401);
  });

  it("reutilizar un refresh token ya rotado da 401 y revoca todas las sesiones", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(credentials);
    const first = cookieOf(reg);

    const rotated = await request(app).post("/api/v1/auth/refresh").set("Cookie", first);
    const second = cookieOf(rotated);

    const replay = await request(app).post("/api/v1/auth/refresh").set("Cookie", first);
    expect(replay.status).toBe(401);

    // El token legítimo más reciente también quedó revocado por la detección de reutilización.
    const afterReplay = await request(app).post("/api/v1/auth/refresh").set("Cookie", second);
    expect(afterReplay.status).toBe(401);
  });

  it("rechaza un token manipulado", async () => {
    const res = await request(app).post("/api/v1/auth/refresh").set("Cookie", "refreshToken=no.es.un.jwt");
    expect(res.status).toBe(401);
  });
});

describe("POST /api/v1/auth/logout", () => {
  it("revoca el refresh token y responde 204", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(credentials);
    const cookie = cookieOf(reg);

    const res = await request(app).post("/api/v1/auth/logout").set("Cookie", cookie);
    expect(res.status).toBe(204);

    const refresh = await request(app).post("/api/v1/auth/refresh").set("Cookie", cookie);
    expect(refresh.status).toBe(401);
  });

  it("es idempotente: sin sesión también responde 204", async () => {
    const res = await request(app).post("/api/v1/auth/logout");
    expect(res.status).toBe(204);
  });
});

describe("requireAuth", () => {
  it("permite el acceso con un access token válido y expone req.userId", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(credentials);

    const res = await request(app).get("/__test/me").set("Authorization", `Bearer ${reg.body.accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.userId).toBe(reg.body.user.id);
  });

  it("responde 401 sin token, con esquema incorrecto o con token inválido", async () => {
    expect((await request(app).get("/__test/me")).status).toBe(401);
    expect((await request(app).get("/__test/me").set("Authorization", "Basic abc")).status).toBe(401);
    expect((await request(app).get("/__test/me").set("Authorization", "Bearer basura")).status).toBe(401);
  });

  it("un refresh token no sirve como access token", async () => {
    const reg = await request(app).post("/api/v1/auth/register").send(credentials);
    const refreshJwt = cookieOf(reg).replace("refreshToken=", "");

    const res = await request(app).get("/__test/me").set("Authorization", `Bearer ${refreshJwt}`);
    expect(res.status).toBe(401);
  });
});
