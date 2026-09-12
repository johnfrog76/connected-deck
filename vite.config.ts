import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Base stays "/" here for local dev/build/preview. The GitHub Pages
  // workflow overrides it at build time with `--base=/connected-deck/`
  // (project page, not a user/org page) — main.tsx reads the same value back
  // via import.meta.env.BASE_URL as the router's basename, so routing and
  // asset URLs move together instead of being configured in two places.
  //
  // `public/.nojekyll` is copied into the build regardless: GitHub Pages runs
  // Jekyll over an artifact unless told not to, and Jekyll skips paths
  // beginning with an underscore -- which is exactly what a hashed asset
  // bundle can produce. An empty file turns the whole pipeline off.
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
