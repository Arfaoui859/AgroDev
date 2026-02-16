import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { createServer } from "./server";

// https://vitejs.dev/config/
export default defineConfig(({ command }) => {
  const isDevelopment = command === "serve";

  return {
    // 🔥 IMPORTANT for Vercel static hosting (fix blank page)
    base: "./",

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
        allow: ["./client", "./shared"],
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
