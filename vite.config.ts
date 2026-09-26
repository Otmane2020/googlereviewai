import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import path from "path";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    tanstackStart({
      srcDirectory: "src",
    }),
    nitro(),
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
      "react-router-dom": path.resolve(import.meta.dirname, "./src/lib/router-compat.tsx"),
    },
  },
});
