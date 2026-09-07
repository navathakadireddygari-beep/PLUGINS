

import path from "path"
import { defineConfig, type Plugin, type ViteDevServer, type Connect } from 'vite'
import type { ServerResponse } from 'http'
import react from '@vitejs/plugin-react'

function rootIndexRedirect(): Plugin {
  return {
    name: "root-index-redirect",
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req: Connect.IncomingMessage, res: ServerResponse, next: Connect.NextFunction) => {
        if (req.url === "/") {
          res.statusCode = 302;
          res.setHeader("Location", "/index.html");
          res.end();
          return;
        }
        next();
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [rootIndexRedirect(), react()],

  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },

  // ── Only active during `npm run build` ────────────────────────
  // @vitejs/plugin-react injects a preamble that references
  // import.meta.hot for Fast Refresh. In an IIFE bundle (used by
  // the APEX plugin) import.meta doesn't exist and the preamble
  // throws. Replacing it with `undefined` at build time makes the
  // condition evaluate to false and the preamble block is skipped.
  define: command === "build" ? {
    "import.meta.hot": "undefined",
  } : {},

  build: {
    rollupOptions: {
      output: {
        // IIFE wraps everything in (function(){...})() so no variables
        // leak into the global scope — avoids '$x' collision with APEX
        format: "iife",

        // Single output file — no chunk splitting
        manualChunks: undefined,

        // Predictable file names (no hash) for easy APEX plugin reference
        entryFileNames: "pivot-table.js",
        assetFileNames: "pivot-table.[ext]",
      },
    },
    // Emit a single JS file instead of multiple chunks
    cssCodeSplit: false,
  },
}))
