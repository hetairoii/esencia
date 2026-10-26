import type { NextFunction, Request, Response } from "express";
import { unauthorized } from "../../lib/errors.js";
import { verifyAccessToken } from "./tokens.js";

/**
 * Protege una ruta: exige `Authorization: Bearer <accessToken>` válido y deja el id
 * del usuario en `req.userId`. Es la dependencia común de todos los módulos con
 * rutas autenticadas (users, discovery, likes-matches, safety…).
 *
 * Uso: `router.get("/me", requireAuth, handler)` o `router.use(requireAuth)`.
 */
export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return next(unauthorized("Falta el token de acceso"));

  const token = header.slice("Bearer ".length).trim();
  try {
    req.userId = verifyAccessToken(token).sub;
    next();
  } catch (err) {
    next(err);
  }
}
