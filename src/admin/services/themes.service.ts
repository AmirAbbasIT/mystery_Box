import "server-only";
import { getPrismaClient } from "@/lib/db/client";

export interface ThemeInput {
  slug: string;
  name: string;
  colorSwatch: string;
  description: string;
}

export interface ThemeRecord extends ThemeInput {
  id: string;
  createdAt: string;
  productCount: number;
}

export async function listThemes(): Promise<ThemeRecord[]> {
  const rows = await getPrismaClient().theme.findMany({
    include: { _count: { select: { productThemes: true } } },
    orderBy: { name: "asc" },
  });

  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    colorSwatch: row.colorSwatch,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    productCount: row._count.productThemes,
  }));
}

export async function getTheme(id: string): Promise<ThemeRecord | null> {
  const row = await getPrismaClient().theme.findUnique({
    where: { id },
    include: { _count: { select: { productThemes: true } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    colorSwatch: row.colorSwatch,
    description: row.description,
    createdAt: row.createdAt.toISOString(),
    productCount: row._count.productThemes,
  };
}

export async function createTheme(input: ThemeInput): Promise<void> {
  await getPrismaClient().theme.create({ data: input });
}

export async function updateTheme(id: string, input: ThemeInput): Promise<void> {
  await getPrismaClient().theme.update({ where: { id }, data: input });
}

export async function deleteTheme(id: string): Promise<void> {
  await getPrismaClient().theme.delete({ where: { id } });
}
