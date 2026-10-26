import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { ZodError } from "zod";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { AppError } from "./lib/errors.js";
import { zodDetails } from "./lib/validate.js";
import { healthRouter } from "./modules/health/health.routes.js";
import { authRouter } from "./modules/auth/auth.routes.js";

/**
 * Configuración de Express. Separado de index.ts para poder importar `app`
 * directamente en las pruebas (supertest) sin levantar un socket real ni
 * el servidor de Socket.IO.
 */
export function createApp(): Express {
  const app = express();

  // Render (y Vercel) terminan TLS en un proxy: sin esto `req.ip` sería la del proxy
  // y las cookies `Secure` no se emitirían correctamente.
  app.set("trust proxy", 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(cookieParser());
  app.use(pinoHttp({ logger }));

  // Los endpoints de salud viven en la raíz de /api/v1 sin autenticación,
  // ver docs/04-api.md, sección 2.
  app.use("/api/v1", healthRouter);
  app.use("/api/v1/auth", authRouter);

  // A medida que se implementen los módulos (docs/07-plan-trabajo.md),
  // sus routers se montan aquí, por ejemplo:
  // app.use("/api/v1", usersRouter);
  // ...

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Recurso no encontrado" } });
  });

  // Manejador de errores central: traduce AppError y ZodError al formato estándar
  // de docs/04-api.md; cualquier otro error es un 500 sin filtrar detalles.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
      return;
    }
    if (err instanceof ZodError) {
      res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Datos de entrada inválidos", details: zodDetails(err) } });
      return;
    }
    logger.error({ err }, "Error no controlado");
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } });
  });

  return app;
}
