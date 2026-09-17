// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import keystatic from "@keystatic/astro";

const SITE_URL = "https://prepschools.pages.dev";

// Static-first: pages prerender by default, individual routes (the submit
// API, /keystatic) opt into on-request rendering with `export const prerender = false`.
export default defineConfig({
  site: SITE_URL,
  output: "static",
  adapter: cloudflare({
    imageService: "compile",
    // Persist D1/KV state between `astro dev` / `wrangler dev` runs locally.
    persistState: true,
    // The workerd prerender environment doesn't yet support React 19's
    // server renderer (MessageChannel), which @keystatic/astro's admin UI
    // pulls in. Prerender with Node instead; the deployed Worker still runs
    // on workerd as normal — this only affects the build-time render pass.
    prerenderEnvironment: "node",
  }),
  integrations: [mdx(), react(), sitemap(), keystatic()],
  vite: {
    resolve: {
      // Keystatic's admin UI needs the browser build of react-dom in the Cloudflare bundle.
      alias:
        process.env.NODE_ENV === "production"
          ? { "react-dom/server": "react-dom/server.browser" }
          : {},
    },
  },
});
