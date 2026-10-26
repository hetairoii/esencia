import { createHash } from "node:crypto";
import jwt, { type SignOptions } from "jsonwebtoken";
import { env } from "../../config/env.js";
import { unauthorized } from "../../lib/errors.js";

export interface AccessPayload {
  sub: string;
}

export interface RefreshPayload {
  sub: string;
  /** Id de la fila `RefreshToken`, para localizarla y rotarla. */
  jti: string;
}

type Expiry = SignOptions["expiresIn"];

export function signAccessToken(userId: string): string {
  return jwt.sign({}, env.JWT_ACCESS_SECRET, {
    subject: userId,
    expiresIn: env.JWT_ACCESS_EXPIRES_IN as Expiry,
  });
}

export function signRefreshToken(userId: string, tokenId: string): string {
  return jwt.sign({}, env.JWT_REFRESH_SECRET, {
    subject: userId,
    jwtid: tokenId,
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as Expiry,
  });
}

export function verifyAccessToken(token: string): AccessPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    if (typeof payload === "string" || !payload.sub) throw new Error("payload inválido");
    return { sub: payload.sub };
  } catch {
    throw unauthorized("Token de acceso inválido o expirado");
  }
}

export function verifyRefreshToken(token: string): RefreshPayload & { exp: number } {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);
    if (typeof payload === "string" || !payload.sub || !payload.jti || !payload.exp) {
      throw new Error("payload inválido");
    }
    return { sub: payload.sub, jti: payload.jti, exp: payload.exp };
  } catch {
    throw unauthorized("Sesión inválida o expirada");
  }
}

/** Los refresh tokens se guardan hasheados: una filtración de la BD no expone sesiones. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
