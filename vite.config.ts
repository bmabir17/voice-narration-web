import { reactRouter } from "@react-router/dev/vite";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // Served at the apex custom domain https://narration.me/ (GitHub Pages + public/CNAME). Root base;
  // the router basename (react-router.config.ts) and the postbuild step must stay in lockstep with it.
  base: "/",
  // Rollup doesn't read tsconfig `paths`, so mirror the "~/*" → app/* alias here for the build.
  resolve: {
    alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
  },
  plugins: [mdx(), reactRouter()],
});
