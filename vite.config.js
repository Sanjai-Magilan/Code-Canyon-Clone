import { defineConfig } from "vite";
import { visualizer } from "rollup-plugin-visualizer";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  base: "./",

  plugins: [
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  resolve: {
    alias: {
      phaser: path.resolve(__dirname, "phaser-dist/phaser-custom.js"),
    },
  },
});