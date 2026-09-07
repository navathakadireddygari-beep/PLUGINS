// import path from "path"
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },
// })


// import path from "path"
// import { defineConfig } from 'vite'
// import react from '@vitejs/plugin-react'

// // https://vitejs.dev/config/
// export default defineConfig({
//   plugins: [react()],
//   resolve: {
//     alias: {
//       "@": path.resolve(__dirname, "./src"),
//     },
//   },

//   server: {
//     proxy: {
//       "/api": {
//         target:       "https://eappsysdmone.eappsys.com:8443",
//         changeOrigin: true,   // rewrites the Host header to match target
//         secure:       false,  // skips SSL validation for self-signed cert on :8443
//         rewrite:      (path) => path.replace(/^\/api/, "/ords/xxea_test"),
//       },
//     },
//   },

//   build: {
//     rollupOptions: {
//       output: {
//         // IIFE wraps everything in (function(){...})() so no variables
//         // leak into the global scope — avoids '$x' collision with APEX
//         format: "iife",

//         // Single output file — no chunk splitting
//         manualChunks: undefined,

//         // Predictable file names (no hash) for easy APEX plugin reference
//         entryFileNames: "pivot-table.js",
//         assetFileNames: "pivot-table.[ext]",
//       },
//     },
//     // Emit a single JS file instead of multiple chunks
//     cssCodeSplit: false,
//   },
// })


import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function rootIndexRedirect() {
  return {
    name: "root-index-redirect",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
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

  server: {
    proxy: {
      "/api": {
        target:       "https://eappsysdmone.eappsys.com:8443",
        changeOrigin: true,   // rewrites the Host header to match target
        secure:       false,  // skips SSL validation for self-signed cert on :8443
        rewrite:      (p) => p.replace(/^\/api/, "/ords/xxea_test"),
      },
    },
  },

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
