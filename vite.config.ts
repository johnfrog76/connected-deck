import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
  },
  server: {
    port: 5174,
    proxy: {
      // Narration only — see server/index.js and README.md's "Presenter mode
      // & narration" section. Everything else in the app runs with no backend.
      "/api": {
        target: "http://localhost:5175",
        changeOrigin: true,
      },
    },
  },
  // `vite preview` (production build check) needs the same proxy as `dev` —
  // otherwise narration silently breaks in preview even with the server
  // running, since preview doesn't inherit `server.proxy`.
  preview: {
    proxy: {
      "/api": {
        target: "http://localhost:5175",
        changeOrigin: true,
      },
    },
  },
});
