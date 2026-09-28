# apps/web — Frontend de Esencia

SPA en React + Vite + TypeScript, desplegada en Vercel. Ver la arquitectura completa en [`../../docs/02-arquitectura.md`](../../docs/02-arquitectura.md) y el wireflow de pantallas en [`../../docs/diagramas/DIA-16-wireflow.md`](../../docs/diagramas/DIA-16-wireflow.md).

## Correr en local

```bash
cp .env.example .env
npm install
npm run dev
```

Se abre en `http://localhost:5173`. Consume la API en `VITE_API_URL` (por defecto `http://localhost:8080`, coherente con `docker-compose.yml` en la raíz del repo).

## Estado de este esqueleto

Esta primera fase solo incluye una página de estado (`App.tsx`) que consulta `GET /api/v1/health` de la API, para demostrar el flujo completo **frontend → backend/API** exigido por el 1.er corte de revisión. Las pantallas reales (registro, perfil, descubrimiento, chat) se construyen a partir del Sprint 1, siguiendo el wireflow de [DIA-16](../../docs/diagramas/DIA-16-wireflow.md) y las historias de usuario de [`docs/01-alcance-mvp.md`](../../docs/01-alcance-mvp.md).

## `vercel.json`

Contiene el *rewrite* necesario para que cualquier ruta de la SPA (manejada por `react-router-dom` en el cliente) sirva `index.html` en vez de devolver un 404 de Vercel.
