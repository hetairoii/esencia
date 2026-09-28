/**
 * Cliente HTTP mínimo hacia la API. Se amplía en Sprint 1 con manejo de
 * accessToken (memoria), refresh automático y los endpoints de cada módulo
 * (ver docs/04-api.md).
 */
const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8080";

export interface HealthResponse {
  status: "ok";
}

export interface ReadyResponse {
  status: "ok" | "degraded";
  dependencies: {
    database: "ok" | "down";
    redis: "ok" | "down";
  };
}

export async function getHealth(): Promise<HealthResponse> {
  const res = await fetch(`${API_URL}/api/v1/health`);
  if (!res.ok) throw new Error(`GET /health respondió ${res.status}`);
  return res.json() as Promise<HealthResponse>;
}

export async function getReady(): Promise<ReadyResponse> {
  const res = await fetch(`${API_URL}/api/v1/ready`);
  // /ready puede responder 503 intencionalmente si alguna dependencia falla;
  // igual queremos leer el body para mostrar el detalle.
  return res.json() as Promise<ReadyResponse>;
}

export { API_URL };
