import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { pinoHttp } from "pino-http";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { healthRouter } from "./modules/health/health.routes.js";

/**
 * Configuración de Express. Separado de index.ts para poder importar `app`
 * directamente en las pruebas (supertest) sin levantar un socket real ni
 * el servidor de Socket.IO.
 */
export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      credentials: true,
    }),
  );
  app.use(express.json());
  app.use(pinoHttp({ logger }));

  // Los endpoints de salud viven en la raíz de /api/v1 sin autenticación,
  // ver docs/04-api.md, sección 2.
  app.use("/api/v1", healthRouter);

  // A medida que se implementen los módulos (docs/07-plan-trabajo.md),
  // sus routers se montan aquí, por ejemplo:
  // app.use("/api/v1/auth", authRouter);
  // app.use("/api/v1", usersRouter);
  // ...

  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Recurso no encontrado" } });
  });

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, "Error no controlado");
    res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Error interno del servidor" } });
  });

  return app;
}
