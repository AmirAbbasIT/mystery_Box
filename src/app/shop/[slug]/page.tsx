import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategory, getThemes } from "@/lib/catalogue";
import { CategoryShopSection } from "@/components/product";

export const revalidate = 60;

// Empty = no category pages at build time; each is rendered on first visit then cached (ISR), so
// categories added in the admin work without a redeploy.
export function generateStaticParams() {
  return [];
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) return {};
  return { title: category.name, description: category.tagline };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [categoryProducts, themes] = await Promise.all([getProductsByCategory(slug), getThemes()]);

  return (
    <CategoryShopSection
      title={category.name}
      tagline={category.tagline}
      products={categoryProducts}
      themes={themes}
    />
  );
}
