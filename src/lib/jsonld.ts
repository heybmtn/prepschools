import type { SchoolEntry } from "./schools";
import { schoolHref } from "./schools";
import { SITE } from "./site";

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE.name,
    url: SITE.url,
    description: SITE.description,
    logo: new URL("/favicon.svg", SITE.url).toString(),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE.name,
    url: SITE.url,
    inLanguage: "en-GB",
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE.url}/prep-schools/?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: new URL(item.url, SITE.url).toString(),
    })),
  };
}

export function itemListJsonLd(name: string, schools: SchoolEntry[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name,
    itemListElement: schools.map((school, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: new URL(schoolHref(school.data), SITE.url).toString(),
      name: school.data.name,
    })),
  };
}

export function schoolJsonLd(school: SchoolEntry): JsonLd {
  const { name, town, county, nation, website, description, image, socials, founded } = school.data;
  const sameAs = socials ? Object.values(socials).filter((v): v is string => !!v) : [];

  return {
    "@context": "https://schema.org",
    "@type": ["EducationalOrganization", "School"],
    name,
    description,
    url: new URL(schoolHref(school.data), SITE.url).toString(),
    sameAs: sameAs.length ? sameAs : undefined,
    ...(website ? { "@id": website } : {}),
    address: {
      "@type": "PostalAddress",
      addressLocality: town,
      addressRegion: county,
      addressCountry: nation === "Scotland" || nation === "Wales" || nation === "Northern Ireland" ? "GB" : "GB",
    },
    areaServed: {
      "@type": "AdministrativeArea",
      name: `${county}, ${nation}`,
    },
    ...(image ? { image: new URL(image.src, SITE.url).toString() } : {}),
    ...(founded ? { foundingDate: String(founded) } : {}),
  };
}

export function blogPostingJsonLd(params: {
  title: string;
  excerpt: string;
  url: string;
  image?: string;
  publishedDate: Date;
  updatedDate?: Date;
}): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: params.title,
    description: params.excerpt,
    url: new URL(params.url, SITE.url).toString(),
    image: params.image ? new URL(params.image, SITE.url).toString() : undefined,
    datePublished: params.publishedDate.toISOString(),
    dateModified: (params.updatedDate ?? params.publishedDate).toISOString(),
    author: {
      "@type": "Organization",
      name: SITE.name,
    },
    publisher: {
      "@type": "Organization",
      name: SITE.name,
      logo: {
        "@type": "ImageObject",
        url: new URL("/favicon.svg", SITE.url).toString(),
      },
    },
  };
}
