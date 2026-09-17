import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { schoolHref } from "../../lib/schools";
import { SITE } from "../../lib/site";

// Static (prerendered) bulk index used by /webmcp.js and any other client
// that wants to search/filter listings without hitting every detail page.
export const GET: APIRoute = async () => {
  const schools = await getCollection("schools");

  const body = JSON.stringify(
    schools.map((school) => ({
      slug: school.data.slug,
      name: school.data.name,
      town: school.data.town,
      county: school.data.county,
      nation: school.data.nation,
      ageRange: school.data.ageRange,
      gender: school.data.gender,
      boarding: school.data.boarding,
      description: school.data.description,
      verified: school.data.verified,
      url: new URL(schoolHref(school.data), SITE.url).toString(),
    }))
  );

  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
