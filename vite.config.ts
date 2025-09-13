import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc"; // plugin que você já tem instalado
import { componentTagger } from "lovable-tagger";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"), // <-- alias @ apontando para /src
    },
  },
  esbuild: { jsx: "automatic" },
  build: { sourcemap: true },
}));
