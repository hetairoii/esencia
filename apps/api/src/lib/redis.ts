import { Redis } from "ioredis";
import { env } from "../config/env.js";
import { logger } from "./logger.js";

/**
 * Cliente de Redis como singleton — usado por discovery (caché del feed),
 * el rate limiter y el adaptador de Socket.IO (ver docs/02-arquitectura.md
 * y ADR-0006 en docs/adr/0006-redis-en-upstash.md).
 *
 * `maxRetriesPerRequest: null` evita que ioredis lance en cada comando si
 * Redis está temporalmente caído; el resto del sistema debe degradar con
 * gracia (ver docs/02-arquitectura.md, sección 5) en vez de caerse.
 */
export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  lazyConnect: true,
});

redis.on("error", (err: Error) => {
  logger.warn({ err }, "Error de conexión a Redis (el sistema puede degradar con gracia)");
});

export async function checkRedisConnection(): Promise<boolean> {
  try {
    if (redis.status === "wait" || redis.status === "end") {
      await redis.connect();
    }
    const pong = await redis.ping();
    return pong === "PONG";
  } catch (err) {
    logger.error({ err }, "Fallo de conexión a Redis");
    return false;
  }
}
