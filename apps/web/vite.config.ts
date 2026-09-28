import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Ver docs/02-arquitectura.md para el rol del frontend en la arquitectura general.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
