import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    outDir: "build",
    rollupOptions: {
      input: {
        main: "index.html",
        docs: "docs.html"
      }
    }
  }
});
