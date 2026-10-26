import { z } from "zod";

/**
 * Validación de variables de entorno con Zod: si falta o está mal formada
 * alguna variable requerida, el proceso falla al arrancar (fail-fast) en vez
 * de fallar más tarde, en medio de una request, de forma difícil de rastrear.
 *
 * Ver docs/05-modelos-cloud.md (sección 4) para dónde vive cada variable en
 * cada entorno, y apps/api/.env.example para los valores de referencia.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(8080),

  DATABASE_URL: z.string().min(1, "DATABASE_URL es requerida"),
  REDIS_URL: z.string().min(1, "REDIS_URL es requerida"),

  JWT_ACCESS_SECRET: z.string().min(16, "JWT_ACCESS_SECRET debe tener al menos 16 caracteres"),
  JWT_REFRESH_SECRET: z.string().min(16, "JWT_REFRESH_SECRET debe tener al menos 16 caracteres"),
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  JWT_REFRESH_EXPIRES_IN: z.string().default("30d"),

  // Orígenes permitidos por CORS y Socket.IO; admite una lista separada por comas.
  CORS_ORIGIN: z.string().default("http://localhost:5173"),

  // Número de proxies entre el usuario y la API. En producción hay dos (Vercel → Render);
  // con un valor menor, `req.ip` sería la de Vercel y el rate limit bloquearía a todos a la vez.
  TRUST_PROXY: z.coerce.number().int().min(0).default(1),

  // Política SameSite de la cookie de sesión. Con el proxy de Vercel el navegador ve un solo
  // dominio y basta `lax`; `none` solo hace falta si el frontend llama a la API en otro dominio.
  COOKIE_SAME_SITE: z.enum(["lax", "strict", "none"]).default("lax"),

  SENTRY_DSN: z.string().optional(),
  LOG_LEVEL: z.enum(["silent", "fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
});

export type Env = z.infer<typeof envSchema>;

/** Convierte "https://a.com/, https://b.com" en ["https://a.com", "https://b.com"]. */
export function parseOrigins(value: string): string[] {
  return value
    .split(",")
    .map((origin) => origin.trim().replace(/\/+$/, ""))
    .filter(Boolean);
}

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("❌ Variables de entorno inválidas:\n", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export const corsOrigins = parseOrigins(env.CORS_ORIGIN);
