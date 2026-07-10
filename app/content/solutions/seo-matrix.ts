// Programmatic / pain-point SEO pages (business plan §F). languages × formats × angles → /solutions/:slug.
// Each becomes a prerendered static HTML page with its own meta + JSON-LD.
export interface SolutionPage {
  slug: string;
  title: string;
  h1: string;
  intent: string;
}

const LANGUAGES = [
  { code: "bangla", label: "Bangla" },
  { code: "south-asian-english", label: "South-Asian English" },
];
const FORMATS = [
  { code: "audiobook", label: "audiobook narration" },
  { code: "elearning", label: "e-learning / course audio" },
  { code: "faceless-video", label: "faceless-video voiceover" },
  { code: "podcast", label: "podcast production" },
];

export function solutionPages(): SolutionPage[] {
  const pages: SolutionPage[] = [];
  for (const l of LANGUAGES) {
    for (const f of FORMATS) {
      pages.push({
        slug: `${l.code}-${f.code}`,
        title: `${l.label} ${f.label} — AI voice narration`,
        h1: `${l.label} ${f.label}`,
        intent: `Long-form ${l.label} ${f.label} with authentic voices and flat, volume-friendly pricing.`,
      });
    }
  }
  // A couple of high-intent standalone pages.
  pages.push({ slug: "acx-ready-ai-narration", title: "ACX-ready AI audiobook narration",
    h1: "ACX-ready AI narration", intent: "EBU R128 loudness, <120-min chapters, MP3 192 kbps — ACX specs, automated." });
  return pages;
}

export function seoMatrixPaths(): string[] {
  return solutionPages().map((p) => `/solutions/${p.slug}`);
}
