import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

// Keystatic writes "empty" optional fields as "" / null / [] rather than
// omitting the key. These preprocessors normalise that to `undefined` so a
// listing edited in the CMS validates the same way a hand-written one does.
const nullish = (v: unknown) => (v === "" || v === null ? undefined : v);
const optionalText = z.preprocess(nullish, z.string().optional());
const optionalInt = z.preprocess(nullish, z.number().int().optional());

const optionalImage = z.preprocess((v) => {
  if (!v || typeof v !== "object") return undefined;
  const src = (v as Record<string, unknown>).src;
  return src ? v : undefined;
}, z.object({ src: z.string(), alt: z.string().default("") }).optional());

const optionalSocials = z.preprocess((v) => {
  if (!v || typeof v !== "object") return undefined;
  const entries = Object.entries(v as Record<string, unknown>).filter(([, val]) => !!val);
  return entries.length ? Object.fromEntries(entries) : undefined;
}, z
  .object({
    twitter: z.string().url().optional(),
    facebook: z.string().url().optional(),
    instagram: z.string().url().optional(),
    linkedin: z.string().url().optional(),
  })
  .optional());

const schools = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/schools" }),
  schema: z.object({
    name: z.string(),
    slug: z.string(),
    town: z.string(),
    county: z.string(),
    nation: z.enum(["England", "Scotland", "Wales", "Northern Ireland"]),
    ageRange: z.string(), // e.g. "4–13"
    gender: z.enum(["co-ed", "boys", "girls"]),
    boarding: z.enum(["day", "boarding", "day-and-boarding"]),
    founded: optionalInt,
    religiousAffiliation: optionalText,
    feederSchools: z.array(z.string()).optional(),
    website: z.string().url(),
    description: z.string(),
    facilities: z.array(z.string()).optional(),
    socials: optionalSocials,
    image: optionalImage,
    verified: z.boolean().default(false),
    lastUpdated: z.coerce.date(),
  }),
});

const posts = defineCollection({
  loader: glob({ pattern: "**/*.mdx", base: "./src/content/posts" }),
  schema: z.object({
    title: z.string(),
    slug: z.string(),
    excerpt: z.string(),
    heroImage: optionalImage,
    region: optionalText,
    publishedDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
  }),
});

export const collections = { schools, posts };
