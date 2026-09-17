// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";

const SITE_URL = "https://prepschools.pages.dev";

// `astro dev` puts "dev" in argv (whether run directly or via `npm run dev`,
// which also sets npm_lifecycle_event="dev"); `astro build`/`astro preview`
// do neither. Astro's defineConfig only accepts a plain object in this
// version, so this has to be computed before the config literal rather than
// via a factory-function form.
const isDev = process.argv.includes("dev") || process.env.npm_lifecycle_event === "dev";

// Static-first: every page prerenders to HTML at build time except the
// submit API route, which opts into on-request rendering with
// `export const prerender = false`.
//
// Keystatic (+ its React dependency) is only wired in for `astro dev` — see
// README.md "Adding or editing a listing". It is deliberately left out of
// `astro build`: bundling Keystatic's React admin UI into the production
// Worker repeatedly hit Cloudflare Workers runtime incompatibilities in
// React's SSR code (e.g. MessageChannel), which is unnecessary complexity
// for a route nobody needs reachable in production. Content edited through
// Keystatic locally still commits straight to GitHub (GitHub storage mode)
// and the live site still redeploys automatically on that push.
const integrations = [mdx(), sitemap()];

if (isDev) {
  const { default: react } = await import("@astrojs/react");
  const { default: keystatic } = await import("@keystatic/astro");
  integrations.push(react(), keystatic());
}

export default defineConfig({
  site: SITE_URL,
  output: "static",
  // Nothing in this app uses cookies/session state — without this, the
  // Cloudflare adapter silently auto-provisions a "SESSION" KV namespace on
  // every deploy, which is both unnecessary and a source of its own deploy
  // friction (namespace-already-exists collisions on repeat deploys).
  session: false,
  adapter: cloudflare({
    imageService: "compile",
    // Persist D1/KV state between `astro dev` / `wrangler dev` runs locally.
    persistState: true,
  }),
  integrations,
});
