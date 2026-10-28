import { Router, type Request, type Response, type NextFunction } from "express";
import rateLimit from "express-rate-limit";
import { env } from "../../config/env.js";
import { validateBody } from "../../lib/validate.js";
import { loginSchema, registerSchema, type LoginInput, type RegisterInput } from "./auth.schemas.js";
import * as authService from "./auth.service.js";
import type { AuthResult } from "./auth.service.js";

export const REFRESH_COOKIE = "refreshToken";
const COOKIE_PATH = "/api/v1/auth";
const sameSite = env.COOKIE_SAME_SITE;
// `Secure` es obligatorio en producción y siempre que SameSite sea `none`.
const secure = env.NODE_ENV === "production" || sameSite === "none";

/**
 * Cookie del refresh token. En producción el navegador accede a la API a través del proxy
 * de Vercel (mismo dominio), por lo que basta `SameSite=Lax; Secure`; si el frontend llamara
 * a la API en otro dominio habría que usar COOKIE_SAME_SITE=none (ADR-0008).
 * `path` la limita a los endpoints de auth: no viaja en el resto de las peticiones.
 */
function setRefreshCookie(res: Response, result: AuthResult) {
  res.cookie(REFRESH_COOKIE, result.refreshToken, {
    httpOnly: true,
    secure,
    sameSite,
    path: COOKIE_PATH,
    expires: result.refreshExpiresAt,
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE, { httpOnly: true, secure, sameSite, path: COOKIE_PATH });
}

const body = (result: AuthResult) => ({ accessToken: result.accessToken, user: result.user });

/** 10 intentos / 15 min por IP en login y registro (docs/04-api.md, sección 10). */
const credentialsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  handler: (_req, res) =>
    res.status(429).json({ error: { code: "RATE_LIMITED", message: "Demasiados intentos, inténtalo más tarde" } }),
});

// Express 4 no captura rechazos de handlers async: se reenvían al manejador de errores.
const wrap =
  (fn: (req: Request, res: Response) => Promise<void>) => (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

export const authRouter = Router();

authRouter.post(
  "/register",
  credentialsLimiter,
  validateBody(registerSchema),
  wrap(async (req, res) => {
    const result = await authService.register(req.body as RegisterInput);
    setRefreshCookie(res, result);
    res.status(201).json(body(result));
  }),
);

authRouter.post(
  "/login",
  credentialsLimiter,
  validateBody(loginSchema),
  wrap(async (req, res) => {
    const result = await authService.login(req.body as LoginInput);
    setRefreshCookie(res, result);
    res.status(200).json(body(result));
  }),
);

authRouter.post(
  "/refresh",
  wrap(async (req, res) => {
    try {
      const result = await authService.refresh(req.cookies?.[REFRESH_COOKIE]);
      setRefreshCookie(res, result);
      res.status(200).json(body(result));
    } catch (err) {
      clearRefreshCookie(res);
      throw err;
    }
  }),
);

authRouter.post(
  "/logout",
  wrap(async (req, res) => {
    await authService.logout(req.cookies?.[REFRESH_COOKIE]);
    clearRefreshCookie(res);
    res.status(204).end();
  }),
);
