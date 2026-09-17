export const SITE = {
  name: "UK Prep Schools",
  tagline: "The independent directory of UK preparatory schools",
  description:
    "A curated, independent directory of UK preparatory schools — day and boarding, ages 4 to 13 — with county guides and Common Entrance advice.",
  url: "https://prepschools.pages.dev",
  themeColor: "#0c5c57",
  locale: "en-GB",
  twitter: "@ukprepschools",
};

export const NAV = [
  { href: "/prep-schools/", label: "Prep Schools" },
  { href: "/blog/", label: "Guides" },
  { href: "/about/", label: "About" },
  { href: "/submit/", label: "Submit a School" },
];

export const NATIONS = ["England", "Scotland", "Wales", "Northern Ireland"] as const;

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
