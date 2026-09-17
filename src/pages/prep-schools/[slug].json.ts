import type { APIRoute } from "astro";
import { getCollection } from "astro:content";
import { schoolHref } from "../../lib/schools";
import { SITE } from "../../lib/site";

export async function getStaticPaths() {
  const schools = await getCollection("schools");
  return schools.map((school) => ({
    params: { slug: school.data.slug },
    props: { school },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { school } = props as { school: Awaited<ReturnType<typeof getCollection<"schools">>>[number] };
  const body = JSON.stringify(
    {
      ...school.data,
      url: new URL(schoolHref(school.data), SITE.url).toString(),
      about: school.body,
    },
    null,
    2
  );

  return new Response(body, {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
};
