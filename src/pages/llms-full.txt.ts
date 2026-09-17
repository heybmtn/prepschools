import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { boardingLabel, genderLabel, schoolHref } from "../lib/schools";
import { SITE } from "../lib/site";

export const GET: APIRoute = async () => {
  const schools = (await getCollection("schools")).sort((a, b) => a.data.name.localeCompare(b.data.name));
  const posts = (await getCollection("posts")).sort(
    (a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf()
  );

  const lines: string[] = [];
  lines.push(`# ${SITE.name} — Full Directory`);
  lines.push("");
  lines.push(`> ${SITE.description}`);
  lines.push("");
  lines.push("## Prep schools");
  lines.push("");
  for (const school of schools) {
    const url = new URL(schoolHref(school.data), SITE.url).toString();
    lines.push(
      `- [${school.data.name}](${url}) — ${school.data.town}, ${school.data.county}, ${school.data.nation}. ` +
        `${boardingLabel[school.data.boarding]}, ${genderLabel[school.data.gender]}, ages ${school.data.ageRange}. ` +
        `${school.data.description} JSON: ${url.replace(/\/$/, "")}.json`
    );
  }
  lines.push("");
  lines.push("## Guides");
  lines.push("");
  for (const post of posts) {
    const url = new URL(`/blog/${post.data.slug}/`, SITE.url).toString();
    lines.push(`- [${post.data.title}](${url}) — ${post.data.excerpt}`);
  }
  lines.push("");

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
