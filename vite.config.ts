import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDevelopment = command === "serve";

  return {
    // 🔥 IMPORTANT for Vercel static hosting (fix blank page)
    base: "/",

    plugins: [
      react(),
      // Run Express only in development (NOT in Vercel production)
      isDevelopment ? expressPlugin() : undefined,
    ].filter(Boolean) as Plugin[],

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./client"),
        "@shared": path.resolve(__dirname, "./shared"),
      },
    },

    server: {
      host: "0.0.0.0",
      port: 8080,
      fs: {
        // The SPA entry `index.html` lives at the repo root, so it must be
        // allow-listed or Vite answers 403 for "/". Allow-list the exact entry
        // file plus the real source trees and the public dir -- never the whole
        // root, which would expose backend/config files despite the deny rules
        // below (Vite gives `allow` precedence over `deny`).
        allow: ["./index.html", "./client", "./shared", "./public"],
        deny: [".env", ".env.*", "*.{crt,pem}", "**/.git/**", "server/**"],
      },
      hmr: true,
    },

    build: {
      outDir: "dist",
      sourcemap: false,
      minify: "esbuild",
      emptyOutDir: true,
      rollupOptions: {
        output: {
          assetFileNames: "assets/[name]-[hash][extname]",
          chunkFileNames: "assets/[name]-[hash].js",
          entryFileNames: "assets/[name]-[hash].js",
          // Keep framework and heavyweight shared dependencies out of the SPA
          // entry chunk. Route-level React.lazy() imports remain independently
          // loadable; these stable vendor groups avoid duplicating shared code.
          manualChunks(id) {
            if (!id.includes("/node_modules/")) return;

            const packagePath = id.split("/node_modules/")[1] ?? "";

            if (/^(react|react-dom|scheduler)\\//.test(packagePath)) {
              return "vendor-react";
            }
            if (/^(react-router-dom|@remix-run\\/router)\\//.test(packagePath)) {
              return "vendor-router";
            }
            if (packagePath.startsWith("@supabase/")) return "vendor-supabase";
            if (packagePath.startsWith("@tanstack/")) return "vendor-query";
            if (packagePath.startsWith("@radix-ui/")) return "vendor-radix";
            if (
              packagePath.startsWith("react-hook-form/") ||
              packagePath.startsWith("@hookform/") ||
              packagePath.startsWith("zod/")
            ) {
              return "vendor-forms";
            }
            if (
              packagePath.startsWith("date-fns/") ||
              packagePath.startsWith("react-day-picker/")
            ) {
              return "vendor-date";
            }
            if (packagePath.startsWith("lucide-react/")) return "vendor-icons";
          },
        },
      },
    },

    preview: {
      port: 8080,
      host: "0.0.0.0",
    },
  };
});

function expressPlugin(): Plugin {
  return {
    name: "express-plugin",
    apply: "serve", // only dev mode
    configureServer(server) {
      const app = createServer();
      server.middlewares.use(app);
    },
  };
}
