import type { Config } from "@react-router/dev/config";
import { seoMatrixPaths } from "./app/content/solutions/seo-matrix";

// ssr:false + prerender → real static HTML (200, per-page meta/JSON-LD) for marketing/blog/docs/
// programmatic pages, plus __spa-fallback.html (renamed to 404.html) for the authed app. This is the
// SEO + GitHub Pages linchpin; migrate to Cloudflare/Vercel (flip ssr:true) only when SSR is needed.
export default {
  ssr: false,
  // Must match Vite `base` — the app is hosted at https://bmabir17.github.io/voice-narration-web/.
  // Set both back to "/" when moving to the apex domain (voicenarration.dev).
  basename: "/voice-narration-web/",
  async prerender() {
    return [
      "/", "/pricing", "/demo", "/pay",
      "/blog", // blog index; per-post paths added as MDX posts land
      "/docs",
      ...seoMatrixPaths(),
    ];
  },
} satisfies Config;
