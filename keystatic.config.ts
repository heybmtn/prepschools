import { config, fields, collection } from "@keystatic/core";

// Thin CMS layer: every field here maps 1:1 onto the Zod schema in
// src/content/config.ts. Swap this file (and the storage block below) for a
// different backend later without touching any template or page.
const isProd = process.env.NODE_ENV === "production";

export default config({
  storage: isProd
    ? {
        kind: "github",
        repo: { owner: "heybmtn", name: "prepschools" },
      }
    : { kind: "local" },

  ui: {
    brand: { name: "UK Prep Schools Directory" },
  },

  collections: {
    schools: collection({
      label: "Prep Schools",
      slugField: "slug",
      path: "src/content/schools/*",
      format: { contentField: "about" },
      entryLayout: "content",
      schema: {
        slug: fields.text({
          label: "Slug",
          description: "URL segment, e.g. dragon-school. Lowercase, hyphenated.",
          validation: { isRequired: true, length: { min: 2 } },
        }),
        name: fields.text({
          label: "School name",
          validation: { isRequired: true },
        }),
        town: fields.text({ label: "Town", validation: { isRequired: true } }),
        county: fields.text({ label: "County", validation: { isRequired: true } }),
        nation: fields.select({
          label: "Nation",
          options: [
            { label: "England", value: "England" },
            { label: "Scotland", value: "Scotland" },
            { label: "Wales", value: "Wales" },
            { label: "Northern Ireland", value: "Northern Ireland" },
          ],
          defaultValue: "England",
        }),
        ageRange: fields.text({
          label: "Age range",
          description: 'e.g. "4–13"',
          validation: { isRequired: true },
        }),
        gender: fields.select({
          label: "Gender",
          options: [
            { label: "Co-ed", value: "co-ed" },
            { label: "Boys", value: "boys" },
            { label: "Girls", value: "girls" },
          ],
          defaultValue: "co-ed",
        }),
        boarding: fields.select({
          label: "Day / boarding",
          options: [
            { label: "Day only", value: "day" },
            { label: "Boarding only", value: "boarding" },
            { label: "Day and boarding", value: "day-and-boarding" },
          ],
          defaultValue: "day",
        }),
        founded: fields.integer({
          label: "Founded (year)",
          validation: { isRequired: false },
        }),
        religiousAffiliation: fields.text({
          label: "Religious affiliation",
          description: "Leave blank if none / not applicable",
        }),
        feederSchools: fields.array(fields.text({ label: "Feeder / linked senior school" }), {
          label: "Feeder schools",
          itemLabel: (props) => props.value || "Untitled",
        }),
        website: fields.url({
          label: "Official website",
          validation: { isRequired: true },
        }),
        description: fields.text({
          label: "Short description",
          description: "1–2 sentences, factual and neutral. Used on cards and previews.",
          multiline: true,
          validation: { isRequired: true },
        }),
        facilities: fields.array(fields.text({ label: "Facility" }), {
          label: "Facilities",
          itemLabel: (props) => props.value || "Untitled",
        }),
        socials: fields.object(
          {
            twitter: fields.url({ label: "Twitter / X" }),
            facebook: fields.url({ label: "Facebook" }),
            instagram: fields.url({ label: "Instagram" }),
            linkedin: fields.url({ label: "LinkedIn" }),
          },
          { label: "Social links" }
        ),
        image: fields.object(
          {
            src: fields.image({
              label: "Photo",
              directory: "public/images/schools",
              publicPath: "/images/schools/",
            }),
            alt: fields.text({ label: "Alt text" }),
          },
          { label: "Listing photo" }
        ),
        verified: fields.checkbox({
          label: "Verified listing",
          description: "Paid flag only — never set this from seed/import data.",
          defaultValue: false,
        }),
        lastUpdated: fields.date({
          label: "Last updated",
          defaultValue: { kind: "today" },
        }),
        about: fields.mdx({
          label: "About",
          description: "Longer body shown on the school's detail page.",
        }),
      },
    }),

    posts: collection({
      label: "Blog Posts",
      slugField: "slug",
      path: "src/content/posts/*",
      format: { contentField: "content" },
      entryLayout: "content",
      schema: {
        slug: fields.text({
          label: "Slug",
          validation: { isRequired: true, length: { min: 2 } },
        }),
        title: fields.text({ label: "Title", validation: { isRequired: true } }),
        excerpt: fields.text({
          label: "Excerpt",
          multiline: true,
          validation: { isRequired: true },
        }),
        heroImage: fields.object(
          {
            src: fields.image({
              label: "Hero image",
              directory: "public/images/blog",
              publicPath: "/images/blog/",
            }),
            alt: fields.text({ label: "Alt text" }),
          },
          { label: "Hero image" }
        ),
        region: fields.text({
          label: "County / region tag",
          description: "Optional, e.g. Surrey",
        }),
        publishedDate: fields.date({
          label: "Published date",
          defaultValue: { kind: "today" },
        }),
        updatedDate: fields.date({ label: "Updated date", validation: { isRequired: false } }),
        content: fields.mdx({ label: "Body" }),
      },
    }),
  },
});
