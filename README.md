# Esencia

> Nombre provisional del producto — cámbienlo libremente en este archivo y en [`docs/00-vision.md`](docs/00-vision.md) cuando el equipo decida el definitivo.

Aplicación web de citas **sin fotos**. En lugar de deslizar sobre imágenes, las personas se conocen a través de una biografía extensa y respuestas a preguntas guiadas; el match nace de leer y comentar lo que la otra persona escribió, no de su apariencia.

Proyecto integrador de **Computación en la Nube (INFO-02028)** — Escuela de Ingeniería Informática. Ver el enunciado completo en [`docs/referencia/proyectoNube.md`](docs/referencia/proyectoNube.md).

- 🌐 **URL pública (frontend):** _pendiente — se agrega en el Sprint 0_
- 🔌 **URL pública (API):** _pendiente — se agrega en el Sprint 0_
- 📋 **Tablero del proyecto:** _pendiente — se agrega el enlace a GitHub Projects_

## 1. Qué es

Ver el detalle completo en [`docs/00-vision.md`](docs/00-vision.md) (problema, usuarios objetivo, propuesta de valor) y en [`docs/01-alcance-mvp.md`](docs/01-alcance-mvp.md) (qué incluye y qué excluye el MVP).

## 2. Arquitectura (resumen)

Monolito modular con capas separadas: **Frontend** (SPA), **Backend/API** (REST + WebSocket), **Persistencia** (PostgreSQL) y **Caché** (Redis), más servicios SaaS externos de observabilidad y CI/CD.

| Capa | Tecnología | Dónde corre |
|---|---|---|
| Frontend | React + Vite + TypeScript | Vercel |
| Backend / API | Node.js + Express + TypeScript + Socket.IO (en Docker) | Render |
| Persistencia | PostgreSQL 16 (Prisma ORM) | Supabase |
| Caché | Redis | Upstash |
| CI/CD | GitHub Actions + GHCR | GitHub |

Diagramas completos, justificación de cada decisión y el mapeo a modelos cloud (IaaS/PaaS/SaaS/DBaaS) en [`docs/02-arquitectura.md`](docs/02-arquitectura.md), [`docs/10-guia-diagramas.md`](docs/10-guia-diagramas.md) y [`docs/05-modelos-cloud.md`](docs/05-modelos-cloud.md). Las decisiones y sus alternativas descartadas están registradas como ADRs en [`docs/adr/`](docs/adr/).

## 3. Estructura del repositorio

```
apps/
  api/      Backend Express + TypeScript (Dockerizado)
  web/      Frontend React + Vite + TypeScript
infra/      Infraestructura como código (Terraform) — bonus, ver infra/README.md
.github/    Workflows de CI/CD y plantillas de PR/issues
```

## 4. Cómo correr el proyecto en local

Requisitos: Node.js 20+, npm, Docker Desktop (opcional pero recomendado).

### Opción A — con Docker Compose (recomendado, levanta API + PostgreSQL + Redis)

```bash
cp .env.example .env
docker compose up --build
```

La API queda disponible en `http://localhost:8080/api/v1/health`.

### Opción B — cada app por separado

```bash
# Backend
cd apps/api
cp .env.example .env
npm install
npm run dev

# Frontend (en otra terminal)
cd apps/web
cp .env.example .env
npm install
npm run dev
```

## 5. Documentación

| Documento | Contenido |
|---|---|
| [00-vision.md](docs/00-vision.md) | Problema, usuarios objetivo, propuesta de valor |
| [01-alcance-mvp.md](docs/01-alcance-mvp.md) | Incluido/excluido del MVP, historias de usuario |
| [02-arquitectura.md](docs/02-arquitectura.md) | Arquitectura completa y decisiones |
| [03-modelo-datos.md](docs/03-modelo-datos.md) | Modelo de datos y ERD |
| [04-api.md](docs/04-api.md) | Contrato de la API REST y eventos de Socket.IO |
| [05-modelos-cloud.md](docs/05-modelos-cloud.md) | IaaS/PaaS/SaaS/DBaaS, proveedores, costos |
| [06-equipo-roles.md](docs/06-equipo-roles.md) | Roles del equipo y matriz RACI |
| [07-plan-trabajo.md](docs/07-plan-trabajo.md) | Metodología Scrum, épicas y sprints |
| [08-convenciones.md](docs/08-convenciones.md) | Flujo de Git, commits, PRs, Definition of Done |
| [09-escalabilidad-riesgos.md](docs/09-escalabilidad-riesgos.md) | Cuellos de botella y plan ante más tráfico |
| [10-guia-diagramas.md](docs/10-guia-diagramas.md) | Catálogo y convenciones de diagramas |
| [11-casos-de-uso.md](docs/11-casos-de-uso.md) | Diagrama y especificación de casos de uso |
| [diagramas/](docs/diagramas/) | Fuente Mermaid de cada diagrama (DIA-01…DIA-17) |
| [sprints/](docs/sprints/) | Planificación y resultado de cada sprint |
| [adr/](docs/adr/) | Registro de decisiones de arquitectura (ADRs) |

## 6. Equipo

| Integrante | Rol |
|---|---|
| _(usuario)_ | Arquitecto de Software / Tech Lead |
| _por definir_ | Product Owner + Frontend Lead |
| _por definir_ | Scrum Master + QA Lead |
| _por definir_ | Backend & Data Engineer |
| _por definir_ | DevOps / Cloud & Security Engineer |

Detalle de responsabilidades en [`docs/06-equipo-roles.md`](docs/06-equipo-roles.md).

## 7. Licencia

Proyecto académico — Escuela de Ingeniería Informática, Computación en la Nube (INFO-02028).
