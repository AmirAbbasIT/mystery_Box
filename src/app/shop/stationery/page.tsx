import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategory, getThemes } from "@/lib/catalogue";
import { CategoryShopSection } from "@/components/product";

export const revalidate = 60;

export async function generateMetadata(): Promise<Metadata> {
  const category = await getCategoryBySlug("stationery");
  if (!category) return {};
  return { title: category.name, description: category.tagline };
}

export default async function StationeryShopPage() {
  const category = await getCategoryBySlug("stationery");
  if (!category) notFound();

  const [categoryProducts, themes] = await Promise.all([
    getProductsByCategory("stationery"),
    getThemes(),
  ]);

  return (
    <CategoryShopSection
      title={category.name}
      tagline={category.tagline}
      products={categoryProducts}
      themes={themes}
    />
  );
}
