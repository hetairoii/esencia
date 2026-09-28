import { useEffect, useState } from "react";
import { getHealth, getReady, API_URL, type ReadyResponse } from "./api/client.js";

type Status = "pending" | "ok" | "down";

/**
 * Página de estado del esqueleto de la Fase 1: demuestra el flujo completo
 * frontend → backend/API → persistencia/caché exigido por el 1.er corte de
 * revisión (docs/referencia/proyectoNube.md, sección 8). Las pantallas reales
 * del producto (registro, perfil, descubrimiento, chat) se construyen a
 * partir del Sprint 1 (docs/07-plan-trabajo.md).
 */
export default function App() {
  const [apiStatus, setApiStatus] = useState<Status>("pending");
  const [ready, setReady] = useState<ReadyResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getHealth()
      .then(() => setApiStatus("ok"))
      .catch((err: Error) => {
        setApiStatus("down");
        setError(err.message);
      });

    getReady()
      .then(setReady)
      .catch(() => {
        /* /ready puede no estar disponible aún; no es crítico para esta vista */
      });
  }, []);

  return (
    <main className="page">
      <h1>
        Esencia<span className="accent">.</span>
      </h1>
      <p className="muted">Conecta por lo que dices, no por cómo te ves.</p>

      <section className="card">
        <h2>Estado del sistema</h2>
        <p className="muted">
          Verificación en vivo del flujo Frontend → Backend/API, consumiendo{" "}
          <code>{API_URL}/api/v1/health</code>.
        </p>

        <div className="status-row">
          <span className={`dot ${apiStatus}`} />
          <span>API: {apiStatus === "pending" ? "verificando…" : apiStatus === "ok" ? "en línea" : "sin respuesta"}</span>
        </div>

        {ready && (
          <>
            <div className="status-row">
              <span className={`dot ${ready.dependencies.database === "ok" ? "ok" : "down"}`} />
              <span>Base de datos (PostgreSQL): {ready.dependencies.database}</span>
            </div>
            <div className="status-row">
              <span className={`dot ${ready.dependencies.redis === "ok" ? "ok" : "down"}`} />
              <span>Caché (Redis): {ready.dependencies.redis}</span>
            </div>
          </>
        )}

        {error && <p className="muted">Detalle: {error}</p>}
      </section>

      <p className="muted" style={{ marginTop: "2rem" }}>
        Ver la documentación completa del proyecto en <code>docs/</code> del repositorio.
      </p>
    </main>
  );
}
