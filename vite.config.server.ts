import { defineConfig } from "vite";
import path from "path";

// Server build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, "server/node-build.ts"),
      name: "server",
      fileName: "production",
      formats: ["es"],
    },
    // The server bundle must NOT live under the statically-served client
    // output (`dist`). When it did, the whole `dist/server` tree — including the
    // bundle and its source map (which embeds the backend TypeScript via
    // `sourcesContent`) — was publicly downloadable. `build/server` is outside
    // the static root, so those paths can never be served.
    outDir: "build/server",
    target: "node22",
    ssr: true,
    rollupOptions: {
      external: [
        // Node.js built-ins
        "fs",
        "path",
        "url",
        "http",
        "https",
        "os",
        "crypto",
        "stream",
        "util",
        "events",
        "buffer",
        "querystring",
        "child_process",
        // External dependencies that should not be bundled
        "express",
        "cors",
      ],
      output: {
        format: "es",
        entryFileNames: "[name].mjs",
      },
    },
    // The server bundle is never served to clients, so readability is not worth
    // shipping a source map: `sourcesContent` embeds the backend TypeScript.
    minify: true,
    sourcemap: false,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./client"),
      "@shared": path.resolve(__dirname, "./shared"),
    },
  },
  define: {
    "process.env.NODE_ENV": '"production"',
  },
});
