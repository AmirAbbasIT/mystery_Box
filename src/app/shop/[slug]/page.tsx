import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getCategoryBySlug, getProductsByCategory, getThemes } from "@/lib/catalogue";
import { CategoryShopSection } from "@/components/product";
import { JsonLd } from "@/components/seo/JsonLd";
import { absoluteUrl, breadcrumbJsonLd, pageMetadata } from "@/lib/seo";
import type { Product } from "@/types";

export const revalidate = 60;

// Empty = no category pages at build time; each is rendered on first visit then cached (ISR), so
// categories added in the admin work without a redeploy.
export function generateStaticParams() {
  return [];
}

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

/** "valentines" -> "Valentines" — category names are admin-typed, so normalise for titles. */
function titleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const category = await getCategoryBySlug((await params).slug);
  if (!category) return {};
  const name = titleCase(category.name);

  return pageMetadata({
    title: `${name} Mystery Gift Boxes`,
    description: `${category.tagline} — ${name.toLowerCase()} mystery gift boxes from Mystery Packed Gifts, hand-packed and delivered across the UK.`,
    path: `/shop/${category.slug}`,
    // Nothing on sale = thin page; it's also left out of the sitemap until products return.
    noIndex: category.priceFrom === null,
  });
}

function productListJsonLd(products: Product[], categoryName: string): object {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${categoryName} mystery gift boxes`,
    itemListElement: products.map((product, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "Product",
        name: product.name,
        description: product.description,
        ...(product.images[0] ? { image: product.images[0].src } : {}),
        offers: {
          "@type": "Offer",
          price: product.price.toFixed(2),
          priceCurrency: "GBP",
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          url: absoluteUrl(`/shop/${product.category}`),
        },
      },
    })),
  };
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) notFound();

  const [categoryProducts, themes] = await Promise.all([
    getProductsByCategory(slug),
    getThemes(),
  ]);
  const name = titleCase(category.name);

  return (
    <>
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Shop", path: "/shop" },
            { name, path: `/shop/${category.slug}` },
          ]),
          ...(categoryProducts.length > 0
            ? [productListJsonLd(categoryProducts, name)]
            : []),
        ]}
      />
      <CategoryShopSection
        title={name}
        tagline={category.tagline}
        products={categoryProducts}
        themes={themes}
      />
    </>
  );
}
