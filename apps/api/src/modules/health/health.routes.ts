import { Router, type Request, type Response } from "express";
import { checkDatabaseConnection } from "../../lib/prisma.js";
import { checkRedisConnection } from "../../lib/redis.js";

export const healthRouter = Router();

/**
 * Liveness: responde si el proceso está vivo, sin comprobar dependencias.
 * Lo usa el HEALTHCHECK del Dockerfile y, potencialmente, Render.
 */
healthRouter.get("/health", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

/**
 * Readiness: comprueba las dependencias externas (Postgres, Redis).
 * Responde 503 si alguna falla — ver docs/02-arquitectura.md, sección 5,
 * para el comportamiento esperado del sistema ante cada tipo de fallo.
 */
healthRouter.get("/ready", async (_req: Request, res: Response) => {
  const [dbOk, redisOk] = await Promise.all([checkDatabaseConnection(), checkRedisConnection()]);

  const allOk = dbOk && redisOk;
  res.status(allOk ? 200 : 503).json({
    status: allOk ? "ok" : "degraded",
    dependencies: {
      database: dbOk ? "ok" : "down",
      redis: redisOk ? "ok" : "down",
    },
  });
});
