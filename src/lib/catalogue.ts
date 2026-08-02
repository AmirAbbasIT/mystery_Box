import { getPrismaClient } from "@/lib/db/client";
import type { Product, ProductImage, AgeSuitability } from "@/types/product";
import type { Category, CategorySlug } from "@/types/category";
import type { Theme } from "@/types/theme";
import type { PrizePool } from "@/types/prize-pool";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Storefront-facing read layer — Products/Categories/Themes/Wheel-Spin-PrizePool are live in
 * Postgres now (see claude/09-database-schema.md), so these replace the equivalent src/data/*.ts
 * mock arrays for the pages that have been wired up. Deliberately separate from
 * src/admin/services/*.ts: those return admin-shaped records for CRUD screens; these return the
 * exact same Product/Category/Theme/PrizePool shapes the storefront components already expect, so
 * components needed zero shape changes — only their data source changed.
 *
 * BirthdayPackage/SeasonalCollection are NOT here yet — no admin CRUD for those, so their pages
 * still read src/data/*.ts.
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

const PRIZE_POOL_INCLUDE = {
  prizeItems: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.PrizePoolInclude;

type PrizePoolWithItems = Prisma.PrizePoolGetPayload<{ include: typeof PRIZE_POOL_INCLUDE }>;

function toPrizePool(row: PrizePoolWithItems): PrizePool {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    kind: row.kind as PrizePool["kind"],
    quantity: row.quantity ?? undefined,
    price: row.pricePence / 100,
    image: row.image,
    prizes: row.prizeItems.map((item) => ({
      id: item.id,
      label: item.label,
      rarity: item.rarity as PrizePool["prizes"][number]["rarity"],
      weight: item.weight.toNumber(),
    })),
  };
}

/**
 * The single active Wheel Spin config — "first created wheel-kind pool", since there's no
 * `active`/featured flag on PrizePool and the storefront only ever shows one wheel at a time. If
 * multiple wheels/rotation ever becomes a real need, that's a schema addition, not a query change.
 */
export async function getWheelPrizePool(): Promise<PrizePool | null> {
  const row = await getPrismaClient().prizePool.findFirst({
    where: { kind: "wheel" },
    include: PRIZE_POOL_INCLUDE,
    orderBy: { createdAt: "asc" },
  });
  return row ? toPrizePool(row) : null;
}

/** All Mystery Egg tiers (single/5/10/15-pack), ordered smallest to largest by quantity. */
export async function getEggPrizePools(): Promise<PrizePool[]> {
  const rows = await getPrismaClient().prizePool.findMany({
    where: { kind: "egg" },
    include: PRIZE_POOL_INCLUDE,
    orderBy: { quantity: "asc" },
  });
  return rows.map(toPrizePool);
}
