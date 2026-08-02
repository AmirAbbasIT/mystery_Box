import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Business logic for the Products catalogue entity — the layer between admin Server Actions
 * and the DB client, per claude/10-admin-panel.md's Layering section. Nothing above this file
 * should import Prisma directly.
 */

export interface ProductImageInput {
  src: string;
  alt: string;
}

export interface ProductInput {
  slug: string;
  name: string;
  description: string;
  pricePence: number;
  categoryId: string;
  stock: number;
  active: boolean;
  ageSuitability: string[];
  whatCouldBeInside: string[];
  featured: boolean;
  seasonal: boolean;
  themeIds: string[];
  images: ProductImageInput[];
}

export interface ProductRecord extends ProductInput {
  id: string;
  categorySlug: string;
  categoryName: string;
  createdAt: string;
  updatedAt: string;
}

const PRODUCT_INCLUDE = {
  category: true,
  images: { orderBy: { sortOrder: "asc" } },
  themes: true,
} satisfies Prisma.ProductInclude;

type ProductWithRelations = Prisma.ProductGetPayload<{ include: typeof PRODUCT_INCLUDE }>;

function toProductRecord(row: ProductWithRelations): ProductRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    pricePence: row.pricePence,
    categoryId: row.categoryId,
    categorySlug: row.category.slug,
    categoryName: row.category.name,
    stock: row.stock,
    active: row.active,
    ageSuitability: row.ageSuitability,
    whatCouldBeInside: row.whatCouldBeInside,
    featured: row.featured,
    seasonal: row.seasonal,
    themeIds: row.themes.map((t) => t.themeId),
    images: row.images.map((image) => ({ src: image.src, alt: image.alt })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toProductData(input: ProductInput) {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    pricePence: input.pricePence,
    categoryId: input.categoryId,
    stock: input.stock,
    active: input.active,
    ageSuitability: input.ageSuitability,
    whatCouldBeInside: input.whatCouldBeInside,
    featured: input.featured,
    seasonal: input.seasonal,
  };
}

export async function listProducts(): Promise<ProductRecord[]> {
  const rows = await getPrismaClient().product.findMany({
    include: PRODUCT_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toProductRecord);
}

export async function getProduct(id: string): Promise<ProductRecord | null> {
  const row = await getPrismaClient().product.findUnique({
    where: { id },
    include: PRODUCT_INCLUDE,
  });
  return row ? toProductRecord(row) : null;
}

export async function createProduct(input: ProductInput): Promise<ProductRecord> {
  const row = await getPrismaClient().product.create({
    data: {
      ...toProductData(input),
      images: {
        create: input.images.map((image, index) => ({
          src: image.src,
          alt: image.alt,
          sortOrder: index,
        })),
      },
      themes: { create: input.themeIds.map((themeId) => ({ themeId })) },
    },
    include: PRODUCT_INCLUDE,
  });
  return toProductRecord(row);
}

export async function updateProduct(id: string, input: ProductInput): Promise<ProductRecord> {
  const row = await getPrismaClient().$transaction(async (tx) => {
    await tx.productTheme.deleteMany({ where: { productId: id } });
    await tx.productImage.deleteMany({ where: { productId: id } });

    return tx.product.update({
      where: { id },
      data: {
        ...toProductData(input),
        updatedAt: new Date(),
        images: {
          create: input.images.map((image, index) => ({
            src: image.src,
            alt: image.alt,
            sortOrder: index,
          })),
        },
        themes: { create: input.themeIds.map((themeId) => ({ themeId })) },
      },
      include: PRODUCT_INCLUDE,
    });
  });

  return toProductRecord(row);
}

export async function deleteProduct(id: string): Promise<void> {
  await getPrismaClient().product.delete({ where: { id } });
}

export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

export async function listCategoryOptions(): Promise<CategoryOption[]> {
  return getPrismaClient().category.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
}

export interface ThemeOption {
  id: string;
  slug: string;
  name: string;
}

export async function listThemeOptions(): Promise<ThemeOption[]> {
  return getPrismaClient().theme.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
}
