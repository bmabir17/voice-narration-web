# frontend/ — static SPA (React + Vite + React Router v7)

Hosted **free on GitHub Pages**, prerendered for SEO. Talks to the Supabase Edge Functions over
HTTPS/CORS; auth via Supabase (PKCE); billing via the Lemon Squeezy hosted overlay. No server
secrets live here — RLS and signature checks are the guard.

## SEO + Pages strategy (the linchpin)

`react-router.config.ts` uses `ssr:false` + `prerender`, emitting real static HTML (200 status,
per-page `meta()` + JSON-LD) for `/`, `/pricing`, `/demo`, `/docs`, `/blog`, and every
`/solutions/:slug` from `app/content/solutions/seo-matrix.ts`. The authed app (`/app/*`) is served by
the SPA fallback (`__spa-fallback.html` → `404.html`, copied in `postbuild`) and is not indexed.

Migrate to Cloudflare Pages/Vercel (flip `ssr:true`) only when you need real SSR — the same code runs.

## Dev

```sh
cp .env.example .env    # publishable VITE_* values
npm install
npm run dev
```

## Key flows

- **Voice clone** (`routes/app.voices.new.tsx` + `components/ConsentGate.tsx`): uploads reference audio
  straight to the private `reference-audio` bucket, then posts the clone request with the §H consent
  attestation (`CONSENT_STATEMENT_VERSION = "h-v3"`, which the Edge Function enforces). The **server**
  records the authoritative consent log (IP/UA/timestamp).
- **Narrate** (`routes/app.narrate.tsx`): pick voice → paste manuscript (`# Chapter N` headings) →
  choose format → `POST /v1/jobs`.
- **Dashboard** (`routes/app.dashboard.tsx`): job list + usage; live updates via Supabase Realtime.

## Deploy

Pushing to `main` runs `.github/workflows/frontend-deploy.yml` (build → `404.html` fallback →
GitHub Pages). Set repo **Variables** `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`,
`VITE_API_BASE_URL`, and point the custom domain at Pages (`public/CNAME`), fronted by Cloudflare.

## Remaining (per plan, not yet scaffolded)

- MDX blog/docs content pipeline + per-post prerender path injection.
- Billing page wiring `lib/billing.ts` overlay + entitlement read.
- Settings/API-key management screen (endpoints exist: `/v1-keys`).
