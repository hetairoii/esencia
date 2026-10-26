import { defineConfig } from "vitest/config";

// Las pruebas de integración usan un Postgres real, en un schema aparte (`test`) para no
// tocar los datos de desarrollo. En local lo provee `docker compose up -d postgres`; en CI,
// el servicio postgres del job. Se puede sobreescribir con TEST_DATABASE_URL (p. ej. si el
// puerto 5432 está ocupado en tu máquina).
const testDatabaseUrl =
  process.env.TEST_DATABASE_URL ?? "postgresql://esencia:esencia_dev_password@localhost:5432/esencia?schema=test";

export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    globals: false,
    globalSetup: ["tests/setup/global-setup.ts"],
    // Los archivos comparten la misma BD y la truncan: se ejecutan uno tras otro.
    fileParallelism: false,
    env: {
      NODE_ENV: "test",
      DATABASE_URL: testDatabaseUrl,
      DIRECT_URL: testDatabaseUrl,
      REDIS_URL: "redis://localhost:6379",
      JWT_ACCESS_SECRET: "test-access-secret-not-for-production",
      JWT_REFRESH_SECRET: "test-refresh-secret-not-for-production",
      CORS_ORIGIN: "http://localhost:5173",
      LOG_LEVEL: "silent",
    },
  },
});
