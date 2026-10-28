import { describe, expect, it } from "vitest";
import { calculateAge } from "../src/modules/auth/auth.service.js";
import { hashToken } from "../src/modules/auth/tokens.js";
import { registerSchema } from "../src/modules/auth/auth.schemas.js";

const utc = (iso: string) => new Date(`${iso}T00:00:00.000Z`);

describe("calculateAge", () => {
  const now = utc("2026-10-26");

  it("cuenta años cumplidos", () => {
    expect(calculateAge(utc("2000-01-01"), now)).toBe(26);
  });

  it("aún no cumple años este año: resta uno", () => {
    expect(calculateAge(utc("2008-10-27"), now)).toBe(17);
  });

  it("cumple años hoy: ya tiene la edad", () => {
    expect(calculateAge(utc("2008-10-26"), now)).toBe(18);
  });

  it("nacida el 29 de febrero", () => {
    expect(calculateAge(utc("2008-02-29"), utc("2026-02-28"))).toBe(17);
    expect(calculateAge(utc("2008-02-29"), utc("2026-03-01"))).toBe(18);
  });
});

describe("hashToken", () => {
  it("es determinista y no devuelve el token original", () => {
    expect(hashToken("abc")).toBe(hashToken("abc"));
    expect(hashToken("abc")).not.toBe("abc");
    expect(hashToken("abc")).not.toBe(hashToken("abd"));
  });
});

describe("registerSchema", () => {
  const valid = { email: "  Ana@Example.COM ", password: "clave1234", birthDate: "1998-05-20" };

  it("normaliza el email y convierte la fecha", () => {
    const parsed = registerSchema.parse(valid);
    expect(parsed.email).toBe("ana@example.com");
    expect(parsed.birthDate).toBeInstanceOf(Date);
  });

  it.each([
    ["contraseña corta", { ...valid, password: "a1" }],
    ["contraseña sin número", { ...valid, password: "soloLetras" }],
    ["contraseña sin letra", { ...valid, password: "12345678" }],
    ["email inválido", { ...valid, email: "no-es-email" }],
    ["fecha con formato incorrecto", { ...valid, birthDate: "20/05/1998" }],
    ["fecha inexistente", { ...valid, birthDate: "1998-02-31" }],
    ["fecha futura", { ...valid, birthDate: "2999-01-01" }],
  ])("rechaza %s", (_name, input) => {
    expect(registerSchema.safeParse(input).success).toBe(false);
  });
});
