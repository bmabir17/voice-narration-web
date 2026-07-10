import { reactRouter } from "@react-router/dev/vite";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [mdx(), reactRouter()],
});
