import { PrismaClient } from "@prisma/client";
import { logger } from "./logger.js";

/**
 * Cliente de Prisma como singleton: evita abrir múltiples pools de conexión
 * hacia el connection pooler de Supabase (ver docs/05-modelos-cloud.md).
 */
export const prisma = new PrismaClient({
  log: [
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

prisma.$on("warn" as never, (e: unknown) => logger.warn({ prisma: e }, "Prisma warning"));
prisma.$on("error" as never, (e: unknown) => logger.error({ prisma: e }, "Prisma error"));

export async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (err) {
    logger.error({ err }, "Fallo de conexión a la base de datos");
    return false;
  }
}
