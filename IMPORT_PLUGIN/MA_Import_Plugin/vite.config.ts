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
  // Same as Sales Contract: @vitejs/plugin-react's Fast Refresh preamble
  // references import.meta.hot, which does not exist in an IIFE bundle.
  define: command === "build" ? { "import.meta.hot": "undefined" } : {},
  build: {
    // Fixed, unhashed names so the built bundle can be uploaded as a static
    // APEX plugin file (pivot-table.js / pivot-table.css) without having to
    // re-point the plugin's file references on every build.
    rollupOptions: {
      output: {
        // IIFE wraps everything in (function(){...})() so minified names
        // (e.g. `$s`) don't leak into the global scope and clobber APEX's
        // own $s / $v / $x helpers used by Dynamic Actions.
        format: "iife",
        entryFileNames: "pivot-table.js",
        chunkFileNames: "pivot-table.js",
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((n) => n.endsWith(".css"))
            ? "pivot-table.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
}));
