# Esencia

**Plataforma web de citas sin fotografías.** Esencia propone una forma distinta de conocer personas: en lugar de deslizar sobre imágenes, cada perfil se construye con una biografía extensa, respuestas a preguntas guiadas e intereses. La conexión nace de leer y conversar sobre lo que la otra persona escribió, no de su apariencia.

Proyecto integrador de la asignatura **Computación en la Nube (INFO-02028)** — Escuela de Ingeniería Informática.

| | |
|---|---|
| **Repositorio** | <https://github.com/hetairoii/esencia> |
| **Estado** | Sprint 0 — fundaciones del proyecto (documentación, arquitectura y esqueleto ejecutable) |
| **Versión** | 0.1.0 |

---

## Tabla de contenidos

1. [Propuesta de valor](#1-propuesta-de-valor)
2. [Alcance funcional del MVP](#2-alcance-funcional-del-mvp)
3. [Arquitectura](#3-arquitectura)
4. [Estado actual del proyecto](#4-estado-actual-del-proyecto)
5. [Estructura del repositorio](#5-estructura-del-repositorio)
6. [Puesta en marcha local](#6-puesta-en-marcha-local)
7. [Variables de entorno](#7-variables-de-entorno)
8. [Calidad e integración continua](#8-calidad-e-integración-continua)
9. [Despliegue](#9-despliegue)
10. [Hoja de ruta](#10-hoja-de-ruta)
11. [Documentación](#11-documentación)
12. [Metodología y convenciones](#12-metodología-y-convenciones)
13. [Equipo](#13-equipo)
14. [Licencia](#14-licencia)

---

## 1. Propuesta de valor

Las aplicaciones de citas tradicionales priorizan la imagen y reducen la decisión a un gesto de segundos. Esencia invierte ese modelo:

- **Sin fotografías.** No se almacenan ni se muestran imágenes de perfil ni en el chat ([ADR-0009](docs/adr/0009-sin-almacenamiento-de-imagenes.md)).
- **Perfiles basados en texto.** Una biografía mínima de ~300 caracteres, al menos tres respuestas a preguntas guiadas y un conjunto de intereses o valores.
- **Match con contexto.** Al reaccionar a un perfil, la persona puede citar y comentar una respuesta concreta, de modo que la primera interacción ya tiene contenido.
- **Seguridad básica integrada.** Bloqueo bidireccional, reportes y eliminación de cuenta forman parte del alcance del MVP.

El planteamiento completo del problema, los usuarios objetivo y la propuesta de valor se desarrollan en [`docs/00-vision.md`](docs/00-vision.md) y [`docs/PROBLEMA-USUARIOS-ALCANCE.md`](docs/PROBLEMA-USUARIOS-ALCANCE.md).

## 2. Alcance funcional del MVP

| # | Funcionalidad | Descripción |
|---|---|---|
| 1 | Registro y autenticación | Email y contraseña (hash con argon2), validación de mayoría de edad, JWT de acceso de corta duración y refresh token en cookie `httpOnly` |
| 2 | Perfil sin fotos | Alias, ciudad, género, relación buscada, biografía, respuestas a prompts e intereses |
| 3 | Catálogo de prompts | Conjunto fijo de preguntas guiadas que la persona elige y responde |
| 4 | Preferencias | Rango de edad, ciudad y género buscado |
| 5 | Descubrimiento | Feed de perfiles que cumplen las preferencias mutuas, excluyendo vistos, bloqueados y con match previo |
| 6 | Like / Pass | Reacción simple, con comentario opcional sobre una respuesta concreta |
| 7 | Match | Creación automática cuando el like es mutuo |
| 8 | Chat en tiempo real | Mensajería de texto por WebSocket, historial persistido e indicador de leído/no leído |
| 9 | Bloqueo y reporte | Ocultamiento mutuo entre usuarios y registro de reportes para revisión manual |
| 10 | Eliminación de cuenta | Borrado o anonimización de datos personales |

**Fuera de alcance:** fotografías, geolocalización por GPS, pagos y suscripciones, notificaciones push o por correo, aplicaciones nativas, matching por IA, videollamadas, verificación de identidad y moderación automática. El detalle y la justificación de cada exclusión están en [`docs/01-alcance-mvp.md`](docs/01-alcance-mvp.md).

## 3. Arquitectura

Esencia adopta un **monolito modular** con separación por capas ([ADR-0002](docs/adr/0002-monolito-modular.md)): una SPA como frontend, una API REST con canal WebSocket como backend, PostgreSQL como persistencia y Redis como caché. Todos los componentes se ejecutan sobre servicios cloud administrados.

| Capa | Tecnología | Plataforma | Modelo cloud |
|---|---|---|---|
| Frontend | React 18, Vite, TypeScript | Vercel | PaaS |
| Backend / API | Node.js 20, Express, TypeScript, Socket.IO, Prisma (contenedor Docker) | Render | PaaS |
| Base de datos | PostgreSQL 16 | Supabase | DBaaS |
| Caché, rate limiting y adaptador de Socket.IO | Redis | Upstash | DBaaS |
| CI/CD | GitHub Actions, GitHub Container Registry | GitHub | SaaS |

### Módulos del backend

`auth` · `users` · `prompts` · `discovery` · `likes-matches` · `chat` · `safety` · `health`

Cada módulo mantiene su propio directorio en [`apps/api/src/modules/`](apps/api/src/modules) con la descripción de su responsabilidad y los endpoints que expone.

### Decisiones técnicas principales

- Autenticación propia con JWT y refresh tokens rotados ([ADR-0008](docs/adr/0008-autenticacion-jwt-propia.md)).
- Comunicación en tiempo real con Socket.IO, escalable horizontalmente mediante el adaptador de Redis ([ADR-0005](docs/adr/0005-socket-io-tiempo-real.md)).
- Caché *cache-aside* del feed de descubrimiento en Redis ([ADR-0006](docs/adr/0006-redis-en-upstash.md)).
- Contenedorización del backend y despliegue desde imágenes versionadas en GHCR ([ADR-0007](docs/adr/0007-vercel-render-docker.md), [ADR-0010](docs/adr/0010-cicd-github-actions.md)).
- Monorepo sin workspaces y flujo GitHub Flow ([ADR-0012](docs/adr/0012-monorepo-github-flow.md)).

Los diagramas (contexto, contenedores, componentes, despliegue, pipeline, ERD, secuencias, estados, casos de uso y escalabilidad) están en [`docs/diagramas/`](docs/diagramas), y el análisis completo en [`docs/02-arquitectura.md`](docs/02-arquitectura.md), [`docs/05-modelos-cloud.md`](docs/05-modelos-cloud.md) y [`docs/ARQUITECTURA-INICIAL.md`](docs/ARQUITECTURA-INICIAL.md). Las doce decisiones registradas, con sus alternativas descartadas, se encuentran en [`docs/adr/`](docs/adr).

### Modelo de datos

El esquema de [Prisma](apps/api/prisma/schema.prisma) define las entidades `User`, `Profile`, `Prompt`, `ProfileAnswer`, `Interest`, `ProfileInterest`, `Preference`, `Like`, `Match`, `Message`, `Block`, `Report` y `RefreshToken`. Su documentación y el diagrama entidad-relación están en [`docs/03-modelo-datos.md`](docs/03-modelo-datos.md).

### Contrato de la API

La API se expone bajo el prefijo `/api/v1`, con formato de error uniforme (`{ "error": { "code", "message" } }`). El contrato completo de endpoints REST y eventos de Socket.IO está en [`docs/04-api.md`](docs/04-api.md).

## 4. Estado actual del proyecto

El proyecto se encuentra en el **Sprint 0**. La documentación de diseño está completa y existe un esqueleto ejecutable de ambas aplicaciones; las funcionalidades de negocio se implementan a partir del Sprint 1.

| Área | Estado | Detalle |
|---|---|---|
| Documentación de diseño | Completa | Visión, alcance, arquitectura, modelo de datos, contrato de API, modelos cloud, plan de trabajo, convenciones, escalabilidad, 17 diagramas, casos de uso y 12 ADRs |
| Esquema de base de datos | Definido | Modelo Prisma completo; las migraciones se generan con la implementación del primer módulo |
| Backend (`apps/api`) | Esqueleto | Servidor Express con `helmet`, CORS, logging estructurado (`pino`), validación de entorno (`zod`) y endpoints `GET /api/v1/health` y `GET /api/v1/ready`. Los módulos de negocio cuentan con su especificación y están pendientes de implementación |
| Frontend (`apps/web`) | Esqueleto | SPA React + Vite que consume el endpoint de salud de la API |
| Entorno local | Operativo | `docker compose up` levanta PostgreSQL, Redis y la API con healthchecks |
| Integración continua | Configurada | Lint, typecheck, pruebas, build de imagen Docker, validación de diagramas y escaneo de secretos |
| Pipeline de despliegue | Configurado | Build y publicación de imagen en GHCR, migraciones de Prisma y *deploy hook* de Render |
| Infraestructura como código | No iniciado | Planificada con Terraform; ver [`infra/README.md`](infra/README.md) |
| Pruebas de carga | No iniciado | Planificadas para el Sprint 5 con k6 |

El avance sprint a sprint se registra en [`docs/sprints/`](docs/sprints).

## 5. Estructura del repositorio

```
.
├── apps/
│   ├── api/                  Backend: Express + TypeScript + Socket.IO + Prisma
│   │   ├── prisma/           Esquema de base de datos
│   │   ├── src/
│   │   │   ├── config/       Carga y validación de variables de entorno
│   │   │   ├── lib/          Clientes compartidos (Prisma, Redis, logger)
│   │   │   └── modules/      Módulos de dominio (auth, users, discovery, ...)
│   │   ├── tests/            Pruebas con Vitest y Supertest
│   │   └── Dockerfile        Imagen multi-etapa de producción
│   └── web/                  Frontend: React + Vite + TypeScript
├── docs/                     Documentación, ADRs, diagramas y planificación de sprints
├── infra/                    Infraestructura como código (alcance opcional)
├── scripts/                  Utilidades de repositorio (validación de diagramas Mermaid)
├── .github/                  Workflows de CI/CD, plantillas de PR e issues, CODEOWNERS
├── docker-compose.yml        Entorno local: PostgreSQL + Redis + API
└── .env.example              Variables para Docker Compose
```

## 6. Puesta en marcha local

**Requisitos:** Node.js 20 o superior, npm y, para el modo recomendado, Docker Desktop.

### Opción A — Docker Compose (API + PostgreSQL + Redis)

```bash
cp .env.example .env
docker compose up --build
```

La API queda disponible en `http://localhost:8080/api/v1/health`. El frontend se ejecuta fuera de Docker, igual que en producción, donde se sirve desde Vercel:

```bash
cd apps/web
cp .env.example .env
npm install
npm run dev
```

### Opción B — Aplicaciones por separado

Requiere instancias accesibles de PostgreSQL y Redis configuradas en `apps/api/.env`.

```bash
# Backend
cd apps/api
cp .env.example .env
npm install
npm run prisma:generate
npm run dev

# Frontend (en otra terminal)
cd apps/web
cp .env.example .env
npm install
npm run dev
```

### Comandos disponibles

| Ubicación | Comando | Función |
|---|---|---|
| `apps/api` | `npm run dev` | Servidor en modo desarrollo con recarga |
| `apps/api` | `npm run build` / `npm start` | Compilación y ejecución de producción |
| `apps/api` | `npm run lint` · `npm run typecheck` · `npm test` | Análisis estático, tipos y pruebas |
| `apps/api` | `npm run prisma:migrate:dev` | Crear y aplicar migraciones en desarrollo |
| `apps/web` | `npm run dev` · `npm run build` · `npm run preview` | Desarrollo, compilación y vista previa |
| `apps/web` | `npm run lint` · `npm run typecheck` | Análisis estático y tipos |
| raíz | `npm run diagrams` · `npm run diagrams:check` | Renderizar o validar los diagramas Mermaid |

## 7. Variables de entorno

Cada aplicación incluye un archivo `.env.example` con todas sus variables documentadas:

- [`.env.example`](.env.example) — Docker Compose (credenciales y puertos de PostgreSQL y Redis).
- [`apps/api/.env.example`](apps/api/.env.example) — API (puerto, base de datos, Redis, secretos JWT, origen CORS).
- [`apps/web/.env.example`](apps/web/.env.example) — Frontend (URL base de la API).

Los archivos `.env` no se versionan; el pipeline ejecuta un escaneo de secretos con gitleaks en cada cambio.

## 8. Calidad e integración continua

El workflow [`ci.yml`](.github/workflows/ci.yml) se ejecuta en cada Pull Request hacia `main` y en cada push a `main`, con cuatro trabajos independientes:

| Trabajo | Verificaciones |
|---|---|
| `api` | Generación del cliente Prisma, lint, typecheck, pruebas y build de la imagen Docker |
| `web` | Lint, typecheck y build |
| `docs` | Validación de sintaxis de todos los diagramas Mermaid |
| `secrets-scan` | Búsqueda de secretos en el historial con gitleaks |

La plantilla de Pull Request, las plantillas de issues (historia de usuario y bug) y el archivo `CODEOWNERS` formalizan el proceso de revisión.

## 9. Despliegue

| Componente | Destino | Mecanismo |
|---|---|---|
| Frontend | Vercel | Integración nativa con GitHub; configuración en [`apps/web/vercel.json`](apps/web/vercel.json) |
| API | Render | Workflow [`deploy-api.yml`](.github/workflows/deploy-api.yml): construye la imagen, la publica en GHCR (`:latest` y `:<sha>`), aplica migraciones de Prisma y dispara el *deploy hook* |
| Base de datos | Supabase (PostgreSQL 16) | Servicio administrado |
| Caché | Upstash (Redis) | Servicio administrado |

El despliegue de la API se activa únicamente tras un push a `main` que modifique `apps/api/**`, una vez que la integración continua ha validado el cambio. El diagrama del pipeline está en [`DIA-05`](docs/diagramas/DIA-05-pipeline-cicd.md) y el de despliegue en [`DIA-04`](docs/diagramas/DIA-04-despliegue.md).

## 10. Hoja de ruta

El trabajo se organiza en Scrum con sprints de una a dos semanas, ocho épicas (E1–E8) y puntos de control alineados con las entregas de la asignatura. El detalle está en [`docs/07-plan-trabajo.md`](docs/07-plan-trabajo.md).

| Sprint | Fechas | Objetivo |
|---|---|---|
| 0 | 28 sep – 4 oct | Repositorio, documentación base, esqueleto ejecutable y primer despliegue |
| 1 | 5 – 18 oct | Registro de usuarios y construcción del perfil sin fotos |
| 2 | 19 – 27 oct | Descubrimiento, like/pass y match — **1.er corte (28–30 oct)** |
| 3 | 2 – 15 nov | Chat en tiempo real, caché del feed, rate limiting y adaptador Redis de Socket.IO |
| 4 | 16 – 29 nov | Bloqueo, reporte, eliminación de cuenta, observabilidad (Sentry, logs, uptime) y endurecimiento |
| 5 | 30 nov – 8 dic | Pruebas de carga, análisis de escalabilidad e IaC — **2.º corte (9–11 dic)** |
| Cierre | 12 – 14 dic | Informe técnico y presentación — **Entrega final (15–16 dic)** |

## 11. Documentación

| Documento | Contenido |
|---|---|
| [PROBLEMA-USUARIOS-ALCANCE](docs/PROBLEMA-USUARIOS-ALCANCE.md) | Planteamiento del problema, solución, usuarios objetivo y alcance del MVP (entregable del 1.er corte) |
| [ARQUITECTURA-INICIAL](docs/ARQUITECTURA-INICIAL.md) | Decisiones de arquitectura y diagrama inicial (entregable del 1.er corte) |
| [00 · Visión](docs/00-vision.md) | Problema, usuarios objetivo y propuesta de valor |
| [01 · Alcance del MVP](docs/01-alcance-mvp.md) | Funcionalidades incluidas y excluidas, historias de usuario |
| [02 · Arquitectura](docs/02-arquitectura.md) | Arquitectura completa y comportamiento ante fallos |
| [03 · Modelo de datos](docs/03-modelo-datos.md) | Entidades, relaciones e índices |
| [04 · API](docs/04-api.md) | Endpoints REST y eventos de Socket.IO |
| [05 · Modelos cloud](docs/05-modelos-cloud.md) | IaaS/PaaS/SaaS/DBaaS, proveedores y costos |
| [06 · Equipo y roles](docs/06-equipo-roles.md) | Roles y matriz RACI |
| [07 · Plan de trabajo](docs/07-plan-trabajo.md) | Metodología, épicas y backlog por sprint |
| [08 · Convenciones](docs/08-convenciones.md) | Flujo de Git, commits, Pull Requests y Definition of Done |
| [09 · Escalabilidad y riesgos](docs/09-escalabilidad-riesgos.md) | Cuellos de botella y estrategia ante mayor carga |
| [10 · Guía de diagramas](docs/10-guia-diagramas.md) | Catálogo y convenciones de diagramas |
| [11 · Casos de uso](docs/11-casos-de-uso.md) | Diagrama y especificación de casos de uso |
| [diagramas/](docs/diagramas) | Fuentes Mermaid DIA-01 a DIA-17 |
| [sprints/](docs/sprints) | Planificación y resultados por sprint |
| [adr/](docs/adr) | Registro de decisiones de arquitectura |

## 12. Metodología y convenciones

- **Gestión:** Scrum con sprints, Definition of Ready y Definition of Done ([`docs/07-plan-trabajo.md`](docs/07-plan-trabajo.md)).
- **Control de versiones:** GitHub Flow sobre `main` protegida, ramas por funcionalidad y Pull Requests con revisión obligatoria.
- **Commits:** [Conventional Commits](https://www.conventionalcommits.org/).
- **Formato:** configuración compartida mediante [`.editorconfig`](.editorconfig) y ESLint en ambas aplicaciones.

Las reglas completas se detallan en [`docs/08-convenciones.md`](docs/08-convenciones.md).

## 13. Equipo

Equipo de cinco integrantes, con responsabilidades definidas por rol (detalle y matriz RACI en [`docs/06-equipo-roles.md`](docs/06-equipo-roles.md)):

| Rol | Responsabilidad principal |
|---|---|
| Arquitecto de Software / Tech Lead | Diseño general del sistema, ADRs, chat en tiempo real y caché |
| Product Owner y Frontend Lead | Backlog, criterios de aceptación y SPA en React |
| Scrum Master y QA Lead | Ceremonias, tablero y estrategia de pruebas |
| Backend y Data Engineer | API REST, modelo de datos, migraciones y respaldo |
| DevOps / Cloud y Security Engineer | Docker, CI/CD, despliegues, secretos y observabilidad |

## 14. Licencia

Proyecto académico desarrollado para la asignatura Computación en la Nube (INFO-02028), Escuela de Ingeniería Informática. Todos los derechos reservados por sus autores.
