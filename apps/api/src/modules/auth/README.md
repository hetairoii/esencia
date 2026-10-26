# Módulo `auth`

Registro, login, renovación y cierre de sesión. Emite y verifica los JWT, rota los refresh tokens y protege rutas con `requireAuth`. Implementa CU-01, CU-02 y CU-03 (HU-01 y HU-02).

**Referencias:** [`docs/04-api.md`](../../../../../docs/04-api.md#3-autenticación-auth--cu-01-cu-02-cu-03) · [DIA-08](../../../../../docs/diagramas/DIA-08-secuencia-registro-login.md) · [ADR-0008](../../../../../docs/adr/0008-autenticacion-jwt-propia.md)

## Archivos

| Archivo | Responsabilidad |
|---|---|
| `auth.routes.ts` | Endpoints, cookie del refresh token y rate limit |
| `auth.service.ts` | Lógica de negocio (`register`, `login`, `refresh`, `logout`, `calculateAge`) |
| `auth.schemas.ts` | Validación Zod de los payloads |
| `tokens.ts` | Firma/verificación de JWT y hash SHA-256 de refresh tokens |
| `auth.middleware.ts` | `requireAuth`, para proteger rutas de otros módulos |

## Endpoints (`/api/v1/auth`)

| Método | Ruta | Descripción | Respuesta |
|---|---|---|---|
| POST | `/register` | Crea la cuenta e inicia sesión | `201` |
| POST | `/login` | Inicia sesión | `200` |
| POST | `/refresh` | Rota el refresh token (cookie) y emite un access token nuevo | `200` |
| POST | `/logout` | Revoca el refresh token (idempotente) | `204` |

### `POST /register`

```json
{ "email": "ana@example.com", "password": "clave1234", "birthDate": "1998-05-20" }
```

- `email`: se normaliza (minúsculas, sin espacios). Único.
- `password`: 8–72 caracteres, con al menos una letra y un número.
- `birthDate`: `AAAA-MM-DD`. La edad mínima es **18 años** (si no, `400`).

Respuesta `201` (igual en `/login` y `/refresh`, con `200`):

```json
{ "accessToken": "<jwt>", "user": { "id": "<uuid>", "email": "ana@example.com" } }
```

Errores: `400 VALIDATION_ERROR` (con `details[{field, issue}]`), `409 CONFLICT` (email ya registrado), `401 UNAUTHORIZED` (login o refresh inválido), `429 RATE_LIMITED`.

## Sesión: dos tokens

| Token | Duración | Dónde viaja | Notas |
|---|---|---|---|
| Access token (JWT) | 15 min (`JWT_ACCESS_EXPIRES_IN`) | Cuerpo de la respuesta → cabecera `Authorization: Bearer <token>` | El frontend lo guarda **en memoria**, nunca en `localStorage` |
| Refresh token (JWT) | 30 d (`JWT_REFRESH_EXPIRES_IN`) | Cookie `refreshToken` | `httpOnly`, `path=/api/v1/auth`; en producción `Secure` + `SameSite=None` (Vercel y Render son dominios distintos) |

- El refresh token se guarda en BD **solo como hash SHA-256** (`RefreshToken.tokenHash`).
- Cada `/refresh` **rota** el token: revoca el presentado y emite uno nuevo, de forma atómica.
- Si se presenta un refresh token **ya revocado** (posible robo), se revocan **todas** las sesiones del usuario.
- El frontend debe llamar a `/refresh` con `credentials: "include"` al arrancar y cuando una petición devuelva `401`.

## Cómo proteger una ruta en otro módulo

```ts
import { requireAuth } from "../auth/auth.middleware.js";

router.get("/me", requireAuth, async (req, res) => {
  const userId = req.userId!; // id del usuario autenticado
  // ...
});
```

Sin token, con esquema distinto de `Bearer` o con token inválido/expirado responde `401 UNAUTHORIZED` en el formato de error estándar.

## Seguridad

- Contraseñas con **argon2id**.
- Login con mensaje genérico (`Email o contraseña incorrectos`) y verificación contra un hash señuelo cuando el email no existe, para no revelar qué cuentas existen.
- Rate limit en memoria de 10 intentos / 15 min por IP en `/register` y `/login` (se desactiva con `NODE_ENV=test`). Pasará a un almacén en Redis en el Sprint 3.
- Las cuentas con `deletedAt` no pueden iniciar sesión ni renovarla.

## Pruebas

`tests/auth.unit.test.ts` (funciones puras) y `tests/auth.test.ts` (integración con Postgres real). Ver el [README de la API](../../../README.md) para levantar la base de datos de pruebas.
