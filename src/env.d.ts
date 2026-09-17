/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

// Cloudflare bindings and vars, typed for both `wrangler types` and manual
// use. Accessed at runtime via `import { env } from "cloudflare:workers"`
// (the Astro 6+ / @astrojs/cloudflare pattern — `Astro.locals.runtime.env`
// was removed). `Cloudflare.Env` is declared empty upstream for exactly
// this kind of augmentation.
declare namespace Cloudflare {
  interface Env {
    DB: D1Database;
    PUBLIC_TURNSTILE_SITE_KEY: string;
    TURNSTILE_SECRET_KEY: string;
    EMAIL_PROVIDER: "resend" | "mailchannels";
    EMAIL_FROM: string;
    EMAIL_TO: string;
    RESEND_API_KEY?: string;
    MAILCHANNELS_API_KEY?: string;
    PUBLIC_WEBMCP_ENABLED?: string;
  }
}

declare namespace App {
  interface Locals {
    cfContext: ExecutionContext;
  }
}
