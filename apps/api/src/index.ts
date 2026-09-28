import "dotenv/config";
import { createServer } from "node:http";
import { Server as SocketIOServer } from "socket.io";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";
import { createApp } from "./app.js";

const app = createApp();
const httpServer = createServer(app);

/**
 * El servidor de Socket.IO se monta sobre el mismo servidor HTTP que Express
 * (mismo puerto, mismo contenedor) — ver docs/02-arquitectura.md, sección 2.
 * La configuración completa de namespaces, autenticación por JWT en el
 * handshake y el adaptador de Redis se añade en el Sprint 3 al implementar
 * el módulo `chat` (ver docs/07-plan-trabajo.md y ADR-0005).
 */
export const io = new SocketIOServer(httpServer, {
  cors: { origin: env.CORS_ORIGIN, credentials: true },
});

httpServer.listen(env.PORT, () => {
  logger.info(`🚀 API de Esencia escuchando en el puerto ${env.PORT} (${env.NODE_ENV})`);
});

function shutdown(signal: string) {
  logger.info(`Señal ${signal} recibida, cerrando servidor...`);
  httpServer.close(() => {
    logger.info("Servidor cerrado correctamente");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
