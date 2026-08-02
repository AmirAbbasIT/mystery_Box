import "server-only";
import { getPrismaClient } from "@/lib/db/client";

export interface CategoryInput {
  slug: string;
  name: string;
  tagline: string;
  heroImage: string;
}

export interface CategoryRecord extends CategoryInput {
  id: string;
  createdAt: string;
  productCount: number;
}

export async function listCategories(): Promise<CategoryRecord[]> {
  const rows = await getPrismaClient().category.findMany({
    include: { _count: { select: { products: true } } },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    heroImage: row.heroImage,
    createdAt: row.createdAt.toISOString(),
    productCount: row._count.products,
  }));
}

export async function getCategory(id: string): Promise<CategoryRecord | null> {
  const row = await getPrismaClient().category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    heroImage: row.heroImage,
    createdAt: row.createdAt.toISOString(),
    productCount: row._count.products,
  };
}

export async function createCategory(input: CategoryInput): Promise<void> {
  await getPrismaClient().category.create({ data: input });
}

export async function updateCategory(id: string, input: CategoryInput): Promise<void> {
  await getPrismaClient().category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: string): Promise<void> {
  await getPrismaClient().category.delete({ where: { id } });
}
