import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // @vitejs/plugin-react injects a preamble that references import.meta.hot
  // for Fast Refresh. In an IIFE bundle (used by the APEX plugin) import.meta
  // doesn't exist and the preamble throws, so it's stubbed out at build time.
  define: command === "build" ? { "import.meta.hot": "undefined" } : {},
  build: {
    rollupOptions: {
      output: {
        // IIFE scopes every top-level binding inside a wrapper function
        // instead of the page's global scope. Without this, our minified
        // identifiers (e.g. `$s`) can collide with APEX's own globals of the
        // same name on the host page — APEX's clear/setValue handling then
        // calls OUR function instead of its own and throws.
        format: "iife",
        // Fixed, unhashed names so the built bundle can be uploaded as a static
        // APEX plugin file (pivot-table.js / pivot-table.css) without having to
        // re-point the plugin's file references on every build.
        entryFileNames: "pivot-table.js",
        // Single output file — no chunk splitting.
        manualChunks: undefined,
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((n) => n.endsWith(".css"))
            ? "pivot-table.css"
            : "assets/[name]-[hash][extname]",
      },
    },
    // Emit a single JS file instead of multiple chunks.
    cssCodeSplit: false,
  },
}));