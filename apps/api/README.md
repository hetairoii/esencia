# apps/api — Backend de Esencia

API REST + WebSocket (Socket.IO) en Node.js 20 + Express + TypeScript. Contenerizada con Docker (`Dockerfile` en este directorio). Ver la arquitectura completa en [`../../docs/02-arquitectura.md`](../../docs/02-arquitectura.md) y el contrato de la API en [`../../docs/04-api.md`](../../docs/04-api.md).

## Imagen Docker (requisito explícito de la sección 4 del enunciado)

- **Build multi-stage**: una etapa `build` (instala todas las dependencias, genera el cliente de Prisma, compila TypeScript a `dist/`) y una etapa `runtime` mínima (`node:20-alpine`, solo dependencias de producción, usuario no root `esencia`).
- **Puerto**: `8080` por defecto, controlado por la variable de entorno `PORT` (Render la inyecta automáticamente en producción).
- **Variables de entorno**: ver [`.env.example`](.env.example) — ninguna tiene un valor real, se inyectan en tiempo de ejecución (local: `.env` vía `dotenv`; producción: configuración del Web Service de Render).
- **Healthcheck**: la propia imagen define un `HEALTHCHECK` que llama a `/api/v1/health`, usado por Docker/Render para saber si el contenedor está sano.

### Construir y correr la imagen manualmente

```bash
docker build -t esencia-api .
docker run --rm -p 8080:8080 --env-file .env esencia-api
```

(Normalmente no se hace así en desarrollo: se usa `docker compose up --build` desde la raíz del repo, que además levanta Postgres y Redis — ver el [`README.md`](../../README.md) raíz).

## Correr en local sin Docker

```bash
cp .env.example .env   # y ajustar DATABASE_URL/REDIS_URL si no se usa docker-compose
npm install
npm run prisma:generate
npm run dev
```

## Estructura

```
src/
├── index.ts            # arranque del servidor HTTP + Socket.IO
├── app.ts               # configuración de Express (middlewares, rutas)
├── config/env.ts         # validación de variables de entorno con Zod
├── lib/
│   ├── logger.ts          # instancia de pino
│   ├── prisma.ts          # cliente de Prisma (singleton)
│   └── redis.ts            # cliente de Redis (ioredis, singleton)
└── modules/
    ├── health/             # implementado: GET /health, GET /ready
    ├── auth/                # responsabilidad documentada, implementación en Sprint 1
    ├── users/                # responsabilidad documentada, implementación en Sprint 1
    ├── prompts/               # responsabilidad documentada, implementación en Sprint 1
    ├── discovery/              # responsabilidad documentada, implementación en Sprint 2
    ├── likes-matches/           # responsabilidad documentada, implementación en Sprint 2
    ├── chat/                     # responsabilidad documentada, implementación en Sprint 3
    └── safety/                    # responsabilidad documentada, implementación en Sprint 4
```

Cada carpeta de módulo sin código todavía tiene un `README.md` explicando qué le corresponde, para que el esqueleto del repositorio deje clara la arquitectura objetivo desde el primer commit (ver `docs/02-arquitectura.md`, sección 3, y `docs/07-plan-trabajo.md` para el sprint en que se implementa cada uno).

## Pruebas

```bash
npm test
```

En este primer corte solo existe la prueba de `health` (`tests/health.test.ts`); cada módulo añade sus propias pruebas al implementarse (Definition of Done, `docs/08-convenciones.md`).
