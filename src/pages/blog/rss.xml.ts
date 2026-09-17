import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIRoute } from "astro";
import { SITE } from "../../lib/site";

export const GET: APIRoute = async (context) => {
  const posts = await getCollection("posts");
  return rss({
    title: `${SITE.name} — Guides`,
    description: SITE.description,
    site: context.site ?? SITE.url,
    items: posts
      .sort((a, b) => b.data.publishedDate.valueOf() - a.data.publishedDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.excerpt,
        pubDate: post.data.publishedDate,
        link: `/blog/${post.data.slug}/`,
      })),
    customData: `<language>en-gb</language>`,
  });
};
