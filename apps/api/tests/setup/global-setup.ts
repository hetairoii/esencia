import { execSync } from "node:child_process";

/**
 * Aplica las migraciones de Prisma al schema `test` antes de correr las pruebas, de modo
 * que las pruebas de integración usen exactamente el esquema real del proyecto.
 */
export default function setup() {
  const url =
    process.env.TEST_DATABASE_URL ?? "postgresql://esencia:esencia_dev_password@localhost:5432/esencia?schema=test";

  execSync("npx prisma migrate deploy", {
    cwd: process.cwd(),
    stdio: "pipe",
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
  });
}
