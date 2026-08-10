// Programmatic / pain-point SEO pages (business plan §F). languages × formats × angles → /solutions/:slug.
// Each becomes a prerendered static HTML page with its own meta + JSON-LD.
export interface SolutionFormat {
  code: string;
  label: string;          // genitive ("audiobook narration")
  icon: string;           // ICON key (see lib/marketing)
  share: string;          // "What you get" headline
  body: string;           // plain-language explainer
  points: string[];       // bullets (non-technical)
}
export interface SolutionPage {
  slug: string;
  title: string;
  h1: string;
  intent: string;
  format?: SolutionFormat;
  standalone?: { icon: string; share: string; body: string; points: string[] };
}

const LANGUAGES = [
  { code: "bangla", label: "Bangla" },
  { code: "south-asian-english", label: "South-Asian English" },
];

const FORMATS: SolutionFormat[] = [
  {
    code: "audiobook", label: "audiobook narration", icon: "book",
    share: "A complete audiobook, read in a human-sounding voice",
    body: "Paste each chapter and get distribution-ready audio — chapters with front/back matter, consistent character narration, and loudness fixed to audiobook specs (ACX ready).",
    points: ["Chaptered, loudness-normalized audio", "Same voice across the whole book", "ACX-ready specs (EBU R128, MP3 192 kbps)"],
  },
  {
    code: "elearning", label: "e-learning / course audio", icon: "grad",
    share: "Course audio that keeps attention, lesson after lesson",
    body: "Turn written course material into warm, clear narration in your own accent and language, at the pace your students need — or turn a lesson into a short narrated video.",
    points: ["English, Hindi or Bangla narration", "Re-recordable any lesson without starting over", "Narrated explainer videos included"],
  },
  {
    code: "faceless-video", label: "faceless-video voiceover", icon: "rocket",
    share: "A narrated, animated video with no cameras and no on-screen face",
    body: "Feed your script a paragraph at a time and get a finished video: scene-by-scene visuals, a narrator that matches the mood, subtitles and an original score.",
    points: ["Storyboard planned by an AI director", "Your voice or a library voice", "Music + subtitles included"],
  },
  {
    code: "podcast", label: "podcast production", icon: "megaphone",
    share: "Episodes voiced, edited and leveled to broadcast-ready audio",
    body: "Script an episode, pick a voice, and receive clean, sectioned audio you can drop straight into any podcast host — with intros and outros handled.",
    points: ["Clean, level playback audio", "Sections and show structure respected", "Bangla & South-Asian-English voices"],
  },
];

// Standalone high-intent pages (non-technical, marketing voice).
const STANDALONES: { slug: string; title: string; h1: string; intent: string; icon: string; share: string; body: string; points: string[] }[] = [
  {
    slug: "acx-ready-ai-narration",
    title: "ACX-ready AI audiobook narration",
    h1: "ACX-ready AI narration",
    intent: "Ready-for-publish audiobook narration — loudness, chaptering and quality specs automated.",
    icon: "book",
    share: "Audiobook audio that passes ACX’s checklist the first time",
    body: "Loudness, chapter timing, and per-chapter files are checked for you, so your book is ready to submit — no manual audio fixing required.",
    points: ["Loudness normalized to ACX specs", "Chapters exported as separate files", "Bangla & South-Asian-English voices"],
  },
  {
    slug: "storybook-video",
    title: "Turn children's stories into narrated videos",
    h1: "Narrated storybook videos",
    intent: "Bedtime stories and picture books become narrated animated videos parents and kids love.",
    icon: "star",
    share: "A picture book that plays itself",
    body: "Upload the story text and a narrator reads it aloud over gentle animated scenes your kids will love — subtitled, softly paced, and done in minutes.",
    points: ["Gentle, story-timed narration", "Soothing original music bed", "Re-render any page until it feels right"],
  },
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
        format: f,
      });
    }
  }
  for (const s of STANDALONES) {
    pages.push({
      slug: s.slug, title: s.title, h1: s.h1, intent: s.intent,
      standalone: { icon: s.icon, share: s.share, body: s.body, points: s.points },
    });
  }
  return pages;
}

export function seoMatrixPaths(): string[] {
  return solutionPages().map((p) => `/solutions/${p.slug}`);
}