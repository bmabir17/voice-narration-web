import { reactRouter } from "@react-router/dev/vite";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // GitHub Pages project site serves under /voice-narration/. `base` fixes asset URLs; the router
  // basename (react-router.config.ts) must match. Swap both to "/" when moving to the apex domain.
  base: "/voice-narration/",
  // Rollup doesn't read tsconfig `paths`, so mirror the "~/*" → app/* alias here for the build.
  resolve: {
    alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
  },
  plugins: [mdx(), reactRouter()],
});
