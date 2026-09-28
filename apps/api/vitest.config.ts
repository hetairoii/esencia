import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    // Valores dummy para que config/env.ts (validación con Zod) no falle al
    // arrancar la app en pruebas; ningún test de esta fase toca una BD/Redis
    // reales — health.test.ts solo verifica los endpoints de liveness/formato
    // de error. Ver docs/apps/api/README.md.
    env: {
      DATABASE_URL: "postgresql://esencia:esencia_dev_password@localhost:5432/esencia_test?schema=public",
      REDIS_URL: "redis://localhost:6379",
      JWT_ACCESS_SECRET: "test-access-secret-not-for-production",
      JWT_REFRESH_SECRET: "test-refresh-secret-not-for-production",
      CORS_ORIGIN: "http://localhost:5173",
    },
  },
});
