import { randomUUID } from "node:crypto";
import argon2 from "argon2";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { badRequest, conflict, unauthorized } from "../../lib/errors.js";
import type { LoginInput, RegisterInput } from "./auth.schemas.js";
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from "./tokens.js";

export const MIN_AGE = 18;

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  /** Instante de expiración del refresh token (para la cookie). */
  refreshExpiresAt: Date;
  user: { id: string; email: string };
}

/** Edad en años cumplidos a la fecha `now` (UTC). Función pura, para poder probarla. */
export function calculateAge(birthDate: Date, now: Date = new Date()): number {
  let age = now.getUTCFullYear() - birthDate.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - birthDate.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < birthDate.getUTCDate())) age -= 1;
  return age;
}

/** Hash usado para igualar el tiempo de respuesta cuando el email no existe (evita enumerar cuentas). */
let dummyHash: Promise<string> | undefined;
const getDummyHash = () => (dummyHash ??= argon2.hash("contraseña-inexistente", { type: argon2.argon2id }));

/** Crea una fila RefreshToken y devuelve el par de tokens firmados. */
async function issueTokens(
  user: { id: string; email: string },
  tx: Prisma.TransactionClient | typeof prisma = prisma,
): Promise<AuthResult> {
  const tokenId = randomUUID();
  const refreshToken = signRefreshToken(user.id, tokenId);
  const { exp } = verifyRefreshToken(refreshToken);
  const refreshExpiresAt = new Date(exp * 1000);

  await tx.refreshToken.create({
    data: { id: tokenId, userId: user.id, tokenHash: hashToken(refreshToken), expiresAt: refreshExpiresAt },
  });

  return { accessToken: signAccessToken(user.id), refreshToken, refreshExpiresAt, user };
}

export async function register(input: RegisterInput): Promise<AuthResult> {
  if (calculateAge(input.birthDate) < MIN_AGE) {
    throw badRequest("Debes ser mayor de edad para registrarte", [
      { field: "birthDate", issue: `Se requiere una edad mínima de ${MIN_AGE} años` },
    ]);
  }

  const passwordHash = await argon2.hash(input.password, { type: argon2.argon2id });

  try {
    const user = await prisma.user.create({
      data: { email: input.email, passwordHash, birthDate: input.birthDate },
      select: { id: true, email: true },
    });
    return await issueTokens(user);
  } catch (err) {
    // La restricción UNIQUE(email) es la fuente de verdad; evita la condición de carrera
    // de "comprobar y luego insertar".
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw conflict("Ya existe una cuenta con ese email");
    }
    throw err;
  }
}

export async function login(input: LoginInput): Promise<AuthResult> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  const hash = user && !user.deletedAt ? user.passwordHash : await getDummyHash();
  const valid = await argon2.verify(hash, input.password).catch(() => false);

  // Mensaje genérico: no revela si falló el email o la contraseña.
  if (!user || user.deletedAt || !valid) throw unauthorized("Email o contraseña incorrectos");

  return issueTokens({ id: user.id, email: user.email });
}

/**
 * Rota el refresh token: el presentado se revoca y se emite uno nuevo.
 * Si se presenta uno ya revocado (posible robo), se revocan todas las sesiones del usuario.
 */
export async function refresh(presentedToken: string | undefined): Promise<AuthResult> {
  if (!presentedToken) throw unauthorized("Sesión no iniciada");
  const payload = verifyRefreshToken(presentedToken);

  const stored = await prisma.refreshToken.findUnique({
    where: { id: payload.jti },
    include: { user: { select: { id: true, email: true, deletedAt: true } } },
  });

  if (!stored || stored.userId !== payload.sub || stored.tokenHash !== hashToken(presentedToken)) {
    throw unauthorized("Sesión inválida");
  }

  if (stored.revokedAt) {
    await prisma.refreshToken.updateMany({
      where: { userId: stored.userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    throw unauthorized("Sesión inválida");
  }

  if (stored.expiresAt <= new Date() || stored.user.deletedAt) throw unauthorized("Sesión expirada");

  return prisma.$transaction(async (tx) => {
    // updateMany condicionado a `revokedAt: null` hace atómica la rotación:
    // si dos peticiones usan el mismo token a la vez, solo una gana.
    const revoked = await tx.refreshToken.updateMany({
      where: { id: stored.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (revoked.count === 0) throw unauthorized("Sesión inválida");
    return issueTokens({ id: stored.user.id, email: stored.user.email }, tx);
  });
}

/** Revoca el refresh token presentado. Es idempotente: un token desconocido no es un error. */
export async function logout(presentedToken: string | undefined): Promise<void> {
  if (!presentedToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(presentedToken), revokedAt: null },
    data: { revokedAt: new Date() },
  });
}
