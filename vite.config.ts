import { reactRouter } from "@react-router/dev/vite";
import mdx from "@mdx-js/rollup";
import { defineConfig } from "vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
  // Hosted as a GitHub Pages project site at bmabir17.github.io/voice-narration-web/. `base` fixes
  // asset URLs; the router basename (react-router.config.ts) and the postbuild flatten dir must match
  // this exact segment. Swap all three to "/" when moving to the apex domain (voicenarration.dev).
  base: "/voice-narration-web/",
  // Rollup doesn't read tsconfig `paths`, so mirror the "~/*" → app/* alias here for the build.
  resolve: {
    alias: { "~": fileURLToPath(new URL("./app", import.meta.url)) },
  },
  plugins: [mdx(), reactRouter()],
});
