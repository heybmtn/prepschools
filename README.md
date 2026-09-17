# UK Prep Schools — directory

A curated, editorial directory of UK independent preparatory schools (day and
boarding, ages ~4–13), built with Astro and deployed on Cloudflare. Content
lives in the repo as MDX/JSON and is edited either by hand or through
[Keystatic](https://keystatic.com) at `/keystatic`.

## Architecture

- **Astro 7**, static-first. Every page prerenders to HTML at build time
  except `/api/submit` (the form handler) and `/keystatic` (the CMS editor),
  which run on request.
- **`@astrojs/cloudflare`** adapter targets Cloudflare's Worker-with-static-assets
  runtime — the current unified successor to "Pages + Pages Functions" (see
  [Deploying](#deploying) below for what this means in practice).
- **Content Collections** (`src/content.config.ts`) are the single source of
  truth for listings and posts, validated with strict Zod schemas. Data lives
  as MDX files in `src/content/schools/*.mdx` and `src/content/posts/*.mdx`.
- **Keystatic** (`keystatic.config.ts`) is a thin editing layer directly on
  top of those same files — every field maps 1:1 onto the Zod schema, so
  there's no second source of truth. It writes straight back to the MDX
  files (GitHub storage mode in production, so a save commits and redeploys;
  local filesystem storage in dev). If you ever want to swap in a hosted CMS
  (e.g. Sanity), only `keystatic.config.ts` and the small `astro:content`
  loader in `src/content.config.ts` need to change — templates and pages
  read plain Content Collection data and don't know Keystatic exists.
- **D1** stores draft `/submit/` form submissions for manual review
  (`migrations/0001_init.sql`). Nothing submitted through the form is ever
  auto-published — an editor promotes a submission into a Keystatic-managed
  MDX file by hand.
- **TypeScript** throughout; no client framework except React, which is only
  used by Keystatic's own admin UI. The site's own interactivity (the
  `/prep-schools/` facet filters, the submit form, the mobile nav toggle) is
  plain vanilla JS.

## Project structure

```
src/
  content/schools/*.mdx     10 seed listings
  content/posts/*.mdx       1 seed guide
  content.config.ts         Zod schemas (the source of truth)
  layouts/Base.astro        <head>, JSON-LD injection, header/footer
  components/               SchoolCard, PostCard, CountyChips, Tag, Breadcrumbs…
  lib/                      site config, school helpers, JSON-LD builders
  pages/
    index.astro                        home
    prep-schools/index.astro           browse + facet filters
    prep-schools/[slug]/index.astro    school detail
    prep-schools/[slug].json.ts        machine-readable listing
    [nation]/index.astro               nation index (/england/ etc.)
    [nation]/[county]/index.astro      county hub
    blog/                              guides index + post + rss.xml
    submit/index.astro                 submission form (Turnstile + honeypot)
    api/submit.ts                      form handler -> D1 + email
    api/schools.json.ts                bulk JSON index (used by webmcp.js)
    llms-full.txt.ts                   generated machine-readable summary
keystatic.config.ts
migrations/0001_init.sql
public/
  llms.txt, robots.txt, webmcp.js, favicon.svg, og-default.svg
wrangler.toml
```

## Getting started

```bash
npm install
cp .env.example .env               # PUBLIC_TURNSTILE_SITE_KEY, PUBLIC_WEBMCP_ENABLED
cp .dev.vars.example .dev.vars     # secrets for the /api/submit function
npm run dev
```

- Site: http://localhost:4321
- CMS editor: http://localhost:4321/keystatic (local filesystem storage in
  dev — edits write straight to `src/content/**/*.mdx` on disk)

`npm run build` produces a Cloudflare-ready build in `dist/` (`dist/client`
for static assets, `dist/server` for the Worker, including a generated
`dist/server/wrangler.json` — see [Deploying](#deploying)).

## Adding or editing a listing

**Via Keystatic (recommended):** open `/keystatic`, pick **Prep Schools**,
create or edit an entry. Every field in the editor is the same field the
page templates read — there's nothing else to keep in sync. `slug` becomes
the URL at `/prep-schools/<slug>/`; `about` is the long-form MDX body shown
on the detail page.

**By hand:** add a new `.mdx` file to `src/content/schools/`, e.g.:

```mdx
---
name: "Example School"
slug: "example-school"
town: "Anytown"
county: "Kent"
nation: "England"
ageRange: "4–13"
gender: "co-ed"
boarding: "day"
website: "https://example-school.example"
description: "One or two neutral, factual sentences."
verified: false
lastUpdated: 2026-09-17
---

Longer body about the school goes here as MDX.
```

Only `verified: true` is treated as a paid/confirmed flag — never set it on
imported or submitted data. Blog posts follow the same pattern in
`src/content/posts/`.

## The submit flow

1. A visitor fills in `/submit/` (school name, town, county, website, age
   range, gender, day/boarding, description, their name + email). A hidden
   honeypot field and Cloudflare Turnstile guard against bots.
2. The form `fetch()`s `/api/submit` (`src/pages/api/submit.ts`), which:
   - rejects anything with the honeypot filled in or a missing/invalid field,
   - verifies the Turnstile token server-side (skipped only if
     `TURNSTILE_SECRET_KEY` isn't set, e.g. in a quick local test),
   - inserts a `pending` row into the D1 `submissions` table,
   - best-effort emails a notification via Resend or MailChannels
     (`EMAIL_PROVIDER` env var selects the provider).
3. Nothing is published automatically. An editor reviews pending rows in D1
   (`wrangler d1 execute prepschools_submissions --command "select * from submissions where status = 'pending'"`)
   and, if approved, creates the corresponding listing in Keystatic by hand,
   then marks the row `approved`.

## Deploying to Cloudflare

Cloudflare has consolidated "Pages + Pages Functions" into **Workers with
static assets** — the same platform, one deployment model. That's what
`@astrojs/cloudflare` (v14+) and this repo target: static pages are served
straight from `dist/client`, and only `/api/submit` and `/keystatic` run as
Worker code, same as a Pages Function would have.

1. **D1 database** — already provisioned: `prepschools_submissions`
   (`e726bf33-1827-4025-9f5b-391bdaaacd03`), with the `0001_init.sql`
   migration applied, wired into `wrangler.toml` under `[[d1_databases]]`.
   If you'd rather use your own database, create a new one and swap the ID:
   ```bash
   npx wrangler d1 create prepschools_submissions
   npm run db:migrate:remote   # applies migrations/0001_init.sql
   ```
   (`npm run db:migrate:local` runs the same migration against a local
   dev-only database for `wrangler dev`.)

2. **Log in to Cloudflare** from a machine with account access — this
   repo's sandbox build environment has no Cloudflare credentials, so the
   steps below need to run from wherever you deploy from:
   ```bash
   npx wrangler login
   ```

3. **Set environment variables and secrets** (Cloudflare dashboard →
   Workers & Pages → your project → Settings → Variables, or via CLI once
   the Worker exists):
   - `PUBLIC_TURNSTILE_SITE_KEY` — Turnstile site key (public; also needs to
     be set at **build** time, since it's baked into the static `/submit/`
     page — set it in your CI/build environment too, not just the dashboard).
   - `TURNSTILE_SECRET_KEY` — Turnstile secret (server-side, set as a secret).
   - `EMAIL_PROVIDER` — `resend` or `mailchannels`.
   - `EMAIL_FROM`, `EMAIL_TO` — notification email addresses.
   - `RESEND_API_KEY` (if using Resend) — set as a secret.
   - `PUBLIC_WEBMCP_ENABLED` — `true` to load `/webmcp.js` (off by default).

4. **Build and deploy**
   ```bash
   npm run build
   npm run deploy   # wrangler deploy --config dist/server/wrangler.json
   ```
   The build step generates `dist/server/wrangler.json`, merging this
   repo's `wrangler.toml` (D1 binding, vars) with the correct `main` and
   `[assets]` paths for the built output — deploy with that generated file,
   not the root `wrangler.toml` directly.

5. **Keystatic in production** uses GitHub storage mode
   (`keystatic.config.ts`, repo `heybmtn/prepschools`) so saving in the
   editor commits straight to the repo and triggers a redeploy. This needs a
   [Keystatic GitHub App](https://keystatic.com/docs/github-model) connected
   to the repo, with `KEYSTATIC_GITHUB_CLIENT_ID`, `KEYSTATIC_GITHUB_CLIENT_SECRET`
   and `KEYSTATIC_SECRET` set as Worker secrets.

### Local preview of the Worker build

```bash
npm run preview   # astro build && wrangler dev --config dist/server/wrangler.json
```

## Verifying JSON-LD

Every listing (`/prep-schools/[slug]/`) emits `BreadcrumbList` +
`EducationalOrganization`/`School` JSON-LD; hub and browse pages emit
`BreadcrumbList` + `ItemList`; every page carries sitewide `Organization` +
`WebSite`; blog posts carry `BlogPosting`. To check a live page:

- [Google Rich Results Test](https://search.google.com/test/rich-results)
- [Schema.org validator](https://validator.schema.org/)
- or locally: `curl -s http://localhost:4321/prep-schools/dragon-school/ | grep -o '<script type="application/ld+json">.*</script>'`

## LLM / agent-facing surfaces

- `/llms.txt` — short summary + links to key sections.
- `/llms-full.txt` — every listing and guide, one line each, generated at
  build time from the content collections.
- `/prep-schools/[slug].json` — full structured record per listing, linked
  from the detail page via `<link rel="alternate" type="application/json">`.
- `/api/schools.json` — bulk index of all listings (used by `webmcp.js`).
- `/webmcp.js` — registers `directory.search` and `directory.schools`
  [WebMCP](https://github.com/webmachinelearning/webmcp) tools when
  `navigator.modelContext` exists. Feature-flagged off by default via
  `PUBLIC_WEBMCP_ENABLED`.
- `robots.txt` explicitly allows GPTBot, ClaudeBot, Google-Extended,
  PerplexityBot, CCBot and others.

## Seed data

The 10 seeded listings are real, well-known UK prep schools, filled in only
with publicly well-known facts (name, town/county, age range, gender,
day/boarding, official website, a short neutral description). Fees, head
names and anything not confidently known are left blank. All ship with
`verified: false`.

The website URLs were originally filled in from general knowledge, then
spot-checked with live web searches. Four were wrong and have been
corrected: Cheam School (`cheamschool.co.uk` → `cheamschool.com`, and its
county corrected to Berkshire), Cranleigh Preparatory School
(`cranleighprep.co.uk` → `cranprep.org`), Beaudesert Park School
(`beaudesertpark.co.uk` → `beaudesert.gloucs.sch.uk`), and Aysgarth School
(`.co.uk` → `.com`; it also became fully co-educational in September 2024,
so its `gender` field was updated from `boys` to `co-ed`). This check was
done via search-result snippets, not by loading each page directly, so it's
still worth a final human click-through before this goes live — but it's a
meaningfully stronger baseline than the original unverified pass.

## Known limitations / follow-ups

- The `/prep-schools/` facet filters are client-side (vanilla JS filtering
  already-rendered cards) rather than server-rendered per-combination pages —
  fine at this scale (10–100s of schools), revisit if the directory grows
  into the thousands.
- Image handling for listings/posts is wired up in the schema and Keystatic
  config but no seed listing ships with a photo; add one via Keystatic to
  see the card/detail image layout in practice.
- `founded`/`religiousAffiliation`/`feederSchools`/`facilities` are optional
  and mostly left blank in the seed data per the brief's "omit rather than
  invent" instruction.
