# apps/api — Backend de Esencia

API REST y WebSocket (Socket.IO) en Node.js 20, Express y TypeScript, contenerizada con Docker. La arquitectura se describe en [`docs/02-arquitectura.md`](../../docs/02-arquitectura.md) y el contrato de la API en [`docs/04-api.md`](../../docs/04-api.md).

## Imagen Docker

- **Build multi-stage.** La etapa `build` instala las dependencias, genera el cliente de Prisma y compila TypeScript a `dist/`. La etapa `runtime` usa `node:20-alpine`, solo dependencias de producción y un usuario no root (`esencia`).
- **Puerto.** `8080` por defecto, configurable con la variable `PORT` (Render la inyecta en producción).
- **Variables de entorno.** Documentadas en [`.env.example`](.env.example). Se inyectan en tiempo de ejecución: en local mediante `.env` (`dotenv`) y en producción desde la configuración del Web Service de Render.
- **Healthcheck.** La imagen define un `HEALTHCHECK` que consulta `/api/v1/health`.

### Construcción y ejecución manual

```bash
docker build -t esencia-api .
docker run --rm -p 8080:8080 --env-file .env esencia-api
```

En desarrollo se recomienda `docker compose up --build` desde la raíz del repositorio, que además levanta PostgreSQL y Redis ([`README.md`](../../README.md)).

## Ejecución local sin Docker

```bash
cp .env.example .env   # ajustar DATABASE_URL y REDIS_URL si no se usa docker compose
npm install
npm run prisma:generate
npm run dev
```

## Estructura

```
src/
├── index.ts             Arranque del servidor HTTP y Socket.IO
├── app.ts               Configuración de Express (middlewares y rutas)
├── config/env.ts        Validación de variables de entorno con Zod
├── lib/
│   ├── logger.ts        Instancia de pino
│   ├── prisma.ts        Cliente de Prisma (singleton)
│   └── redis.ts         Cliente de Redis (ioredis, singleton)
└── modules/
    ├── health/          Implementado: GET /health y GET /ready
    ├── auth/            Sprint 1
    ├── users/           Sprint 1
    ├── prompts/         Sprint 1
    ├── discovery/       Sprint 2
    ├── likes-matches/   Sprint 2
    ├── chat/            Sprint 3
    └── safety/          Sprint 4
```

Cada módulo pendiente de implementación incluye un `README.md` con su responsabilidad. El sprint de implementación de cada uno está en [`docs/07-plan-trabajo.md`](../../docs/07-plan-trabajo.md).

## Pruebas

```bash
npm test
```

Actualmente existe la prueba de `health` ([`tests/health.test.ts`](tests/health.test.ts)); cada módulo incorpora las suyas al implementarse ([`docs/08-convenciones.md`](../../docs/08-convenciones.md)).
