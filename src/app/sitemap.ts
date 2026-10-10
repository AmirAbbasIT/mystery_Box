import type { MetadataRoute } from "next";
import { getPrismaClient } from "@/lib/db/client";
import { absoluteUrl, isIndexable } from "@/lib/seo";

/**
 * /sitemap.xml — every public, indexable page. Category pages come from the DB, so a category
 * added in the admin appears here within the hour without a redeploy. Categories with nothing on
 * sale are left out (an empty page is thin content). Private pages (basket, checkout, admin) are
 * never listed.
 */

export const revalidate = 3600;

type Entry = MetadataRoute.Sitemap[number];

const STATIC_PAGES: Array<
  Pick<Entry, "changeFrequency" | "priority"> & { path: string }
> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.9 },
  { path: "/seasonal", changeFrequency: "weekly", priority: 0.8 },
  { path: "/mystery-eggs", changeFrequency: "monthly", priority: 0.8 },
  { path: "/wheel-spin", changeFrequency: "monthly", priority: 0.8 },
  { path: "/birthday-packages", changeFrequency: "monthly", priority: 0.8 },
  { path: "/birthday-packages/kids", changeFrequency: "monthly", priority: 0.7 },
  { path: "/birthday-packages/adult-party", changeFrequency: "monthly", priority: 0.7 },
  { path: "/custom-request", changeFrequency: "yearly", priority: 0.6 },
  { path: "/about", changeFrequency: "yearly", priority: 0.5 },
  { path: "/track", changeFrequency: "yearly", priority: 0.3 },
  { path: "/legal-notice", changeFrequency: "yearly", priority: 0.2 },
];

async function categoryEntries(): Promise<MetadataRoute.Sitemap> {
  const categories = await getPrismaClient().category.findMany({
    where: { products: { some: { active: true } } },
    select: {
      slug: true,
      heroImage: true,
      createdAt: true,
      products: {
        where: { active: true },
        select: { updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  return categories.map((category) => ({
    url: absoluteUrl(`/shop/${category.slug}`),
    lastModified: category.products[0]?.updatedAt ?? category.createdAt,
    changeFrequency: "weekly",
    priority: 0.9,
    images: category.heroImage.startsWith("http")
      ? [category.heroImage]
      : [absoluteUrl(category.heroImage)],
  }));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Never advertise pages of a non-indexable deployment (e.g. dev.mysterypickedgifts.com).
  if (!isIndexable()) return [];

  const staticEntries: MetadataRoute.Sitemap = STATIC_PAGES.map(({ path, ...rest }) => ({
    url: absoluteUrl(path),
    ...rest,
  }));

  try {
    return [...staticEntries, ...(await categoryEntries())];
  } catch (error) {
    // A DB hiccup should degrade to the static pages, not break /sitemap.xml entirely.
    console.error("Sitemap: could not load categories", error);
    return staticEntries;
  }
}
