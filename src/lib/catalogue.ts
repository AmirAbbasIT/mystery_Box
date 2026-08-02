import { getPrismaClient } from "@/lib/db/client";
import type { Product, ProductImage, AgeSuitability } from "@/types/product";
import type { Category, CategorySlug } from "@/types/category";
import type { Theme } from "@/types/theme";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Storefront-facing read layer — Products/Categories/Themes are live in Postgres now (see
 * claude/09-database-schema.md), so these replace the equivalent src/data/*.ts mock arrays for
 * the pages that have been wired up. Deliberately separate from src/admin/services/*.ts: those
 * return admin-shaped records (pricePence, categoryId, all products including inactive ones) for
 * CRUD screens; these return the exact same Product/Category/Theme shapes the storefront
 * components already expect (price in pounds, category as a flat slug, active-only), so
 * ProductCard/ProductGrid/etc. needed zero shape changes — only their data source changed.
 *
 * PrizePool/BirthdayPackage/SeasonalCollection are NOT here yet — those tables have no admin CRUD
 * or seed data, so the pages backed by them (Mystery Eggs, Wheel Spin, Birthday Packages,
 * Seasonal) still read src/data/*.ts. Wiring them here would just show empty results.
 */

const PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  themes: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

function toProduct(row: ProductWithRelations): Product {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    price: row.pricePence / 100,
    category: row.category.slug as CategorySlug,
    themeIds: row.themes.map((t) => t.themeId),
    images: row.images.map((image): ProductImage => ({ src: image.src, alt: image.alt })),
    ageSuitability: row.ageSuitability as AgeSuitability[],
    stock: row.stock,
    active: row.active,
    whatCouldBeInside: row.whatCouldBeInside,
    featured: row.featured,
    seasonal: row.seasonal,
  };
}

export async function getProducts(): Promise<Product[]> {
  const rows = await getPrismaClient().product.findMany({
    where: { active: true },
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProduct);
}

export async function getProductsByCategory(categorySlug: CategorySlug): Promise<Product[]> {
  const rows = await getPrismaClient().product.findMany({
    where: { active: true, category: { slug: categorySlug } },
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProduct);
}

export async function getCategories(): Promise<Category[]> {
  const prisma = getPrismaClient();
  const [categories, minPrices] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.product.groupBy({ by: ["categoryId"], where: { active: true }, _min: { pricePence: true } }),
  ]);

  const priceFromByCategoryId = new Map(
    minPrices.map((row) => [row.categoryId, (row._min.pricePence ?? 0) / 100]),
  );

  return categories.map((category) => ({
    id: category.id,
    slug: category.slug as CategorySlug,
    name: category.name,
    tagline: category.tagline,
    heroImage: category.heroImage,
    priceFrom: priceFromByCategoryId.get(category.id) ?? 0,
  }));
}

export async function getCategoryBySlug(slug: CategorySlug): Promise<Category | null> {
  const categories = await getCategories();
  return categories.find((category) => category.slug === slug) ?? null;
}

export async function getThemes(): Promise<Theme[]> {
  const rows = await getPrismaClient().theme.findMany({ orderBy: { name: "asc" } });
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    colorSwatch: row.colorSwatch,
    description: row.description,
  }));
}
