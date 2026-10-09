# apps/web — Frontend de Esencia

SPA en React, Vite y TypeScript, desplegada en Vercel. La arquitectura se describe en [`docs/02-arquitectura.md`](../../docs/02-arquitectura.md) y el recorrido de pantallas en [`DIA-16`](../../docs/diagramas/DIA-16-wireflow.md).

## Ejecución local

```bash
cp .env.example .env
npm install
npm run dev
```

La aplicación se sirve en `http://localhost:5173` y consume la API en `VITE_API_URL` (por defecto `http://localhost:8080`, coherente con `docker-compose.yml`).

## Estado

Incluye una página de estado ([`App.tsx`](src/App.tsx)) que consulta `GET /api/v1/health` de la API y verifica la comunicación entre frontend y backend. Las pantallas de registro, perfil, descubrimiento y chat se construyen a partir del Sprint 1, según el wireflow y las historias de usuario de [`docs/01-alcance-mvp.md`](../../docs/01-alcance-mvp.md).

## `vercel.json`

Define el *rewrite* que hace que cualquier ruta de la SPA, gestionada en el cliente por `react-router-dom`, sirva `index.html` en lugar de responder 404.
