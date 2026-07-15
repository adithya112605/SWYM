import { defineConfig } from "vite";

export default defineConfig({
  // Relative assets keep the production bundle portable on GitHub Pages,
  // including project pages served from /repository-name/.
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
  },
});
