import pino from "pino";
import { env } from "../config/env.js";

/**
 * Logger estructurado (JSON) — ver ADR-0011 (docs/adr/0011-observabilidad.md).
 * En desarrollo se imprime en un formato legible; en producción se emite JSON
 * plano, que es lo que Render captura en sus logs del servicio.
 */
export const logger = pino({
  level: env.LOG_LEVEL,
  transport:
    env.NODE_ENV === "development"
      ? { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } }
      : undefined,
});
