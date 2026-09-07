import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Fixed, unhashed names so the built bundle can be uploaded as a static
    // APEX plugin file (pivot-table.js / pivot-table.css) without having to
    // re-point the plugin's file references on every build.
    rollupOptions: {
      output: {
        entryFileNames: "pivot-table.js",
        chunkFileNames: "pivot-table.js",
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((n) => n.endsWith(".css"))
            ? "pivot-table.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});