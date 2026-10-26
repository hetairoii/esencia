/**
 * Error de aplicación con código HTTP y código estable para el cliente.
 * Los códigos siguen el contrato de docs/04-api.md (formato de error estándar):
 * VALIDATION_ERROR, UNAUTHORIZED, FORBIDDEN, NOT_FOUND, CONFLICT, RATE_LIMITED.
 */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new AppError(400, "VALIDATION_ERROR", message, details);
export const unauthorized = (message = "No autenticado") => new AppError(401, "UNAUTHORIZED", message);
export const forbidden = (message = "Acción no permitida") => new AppError(403, "FORBIDDEN", message);
export const notFound = (message = "Recurso no encontrado") => new AppError(404, "NOT_FOUND", message);
export const conflict = (message: string) => new AppError(409, "CONFLICT", message);
