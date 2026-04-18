import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import pkg from "./package.json";

export default defineConfig({
  plugins: [react()],
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@shared-types": path.resolve(__dirname, "../packages/shared-types/src"),
    },
  },
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    proxy: {
      "/agent-apps": { target: "http://localhost:8000", changeOrigin: true },
      "/files": { target: "http://localhost:8000", changeOrigin: true },
    },
  },
});
