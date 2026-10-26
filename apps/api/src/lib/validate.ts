import type { NextFunction, Request, Response } from "express";
import { ZodError, type ZodTypeAny } from "zod";
import { badRequest } from "./errors.js";

/** Convierte un ZodError en el detalle `[{ field, issue }]` del formato de error estándar. */
export function zodDetails(err: ZodError) {
  return err.issues.map((i) => ({ field: i.path.join("."), issue: i.message }));
}

/**
 * Middleware que valida `req.body` con un esquema Zod y reemplaza el body por el
 * resultado parseado (ya normalizado). Ante un payload inválido responde
 * 400 VALIDATION_ERROR con el detalle por campo.
 */
export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      return next(badRequest("Datos de entrada inválidos", zodDetails(parsed.error)));
    }
    req.body = parsed.data;
    next();
  };
}
