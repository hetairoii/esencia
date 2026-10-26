import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// En producción, Vercel reenvía /api/* a la API (vercel.json), de modo que el navegador solo
// habla con un dominio. En desarrollo, Vite hace lo mismo: así el entorno local se comporta
// igual que producción (cookies de primera parte, sin CORS).
// Si tu API local no está en el puerto 8080, define API_PROXY_TARGET en apps/web/.env.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        "/api": { target: env.API_PROXY_TARGET ?? "http://localhost:8080", changeOrigin: true },
      },
    },
  };
});
