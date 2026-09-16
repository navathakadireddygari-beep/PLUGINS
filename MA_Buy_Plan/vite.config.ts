import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Fixed, unhashed names so the built bundle can be uploaded as a static
    // APEX plugin file (buy-plan.js / buy-plan.css) without having to
    // re-point the plugin's file references on every build.
    rollupOptions: {
      output: {
        entryFileNames: "buy-plan.js",
        chunkFileNames: "buy-plan.js",
        assetFileNames: (assetInfo) =>
          assetInfo.names?.some((n) => n.endsWith(".css"))
            ? "buy-plan.css"
            : "assets/[name]-[hash][extname]",
      },
    },
  },
});
