import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/generated/prisma/client";

export interface SeasonalCollectionInput {
  slug: string;
  name: string;
  description: string;
  /** ISO date strings (yyyy-mm-dd). */
  startsAt: string;
  endsAt: string;
  heroImage: string;
  productIds: string[];
}

export interface SeasonalCollectionRecord extends SeasonalCollectionInput {
  id: string;
  createdAt: string;
}

const SEASONAL_COLLECTION_INCLUDE = {
  products: true,
} satisfies Prisma.SeasonalCollectionInclude;

type SeasonalCollectionWithRelations = Prisma.SeasonalCollectionGetPayload<{
  include: typeof SEASONAL_COLLECTION_INCLUDE;
}>;

function toRecord(row: SeasonalCollectionWithRelations): SeasonalCollectionRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    startsAt: row.startsAt.toISOString().slice(0, 10),
    endsAt: row.endsAt.toISOString().slice(0, 10),
    heroImage: row.heroImage,
    productIds: row.products.map((product) => product.productId),
    createdAt: row.createdAt.toISOString(),
  };
}

function toData(input: SeasonalCollectionInput) {
  return {
    slug: input.slug,
    name: input.name,
    description: input.description,
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    heroImage: input.heroImage,
  };
}

export async function listSeasonalCollections(): Promise<SeasonalCollectionRecord[]> {
  const rows = await getPrismaClient().seasonalCollection.findMany({
    include: SEASONAL_COLLECTION_INCLUDE,
    orderBy: { startsAt: "asc" },
  });
  return rows.map(toRecord);
}

export async function getSeasonalCollection(id: string): Promise<SeasonalCollectionRecord | null> {
  const row = await getPrismaClient().seasonalCollection.findUnique({
    where: { id },
    include: SEASONAL_COLLECTION_INCLUDE,
  });
  return row ? toRecord(row) : null;
}

export async function createSeasonalCollection(
  input: SeasonalCollectionInput,
): Promise<SeasonalCollectionRecord> {
  const row = await getPrismaClient().seasonalCollection.create({
    data: {
      ...toData(input),
      products: { create: input.productIds.map((productId) => ({ productId })) },
    },
    include: SEASONAL_COLLECTION_INCLUDE,
  });
  return toRecord(row);
}

export async function updateSeasonalCollection(
  id: string,
  input: SeasonalCollectionInput,
): Promise<SeasonalCollectionRecord> {
  const row = await getPrismaClient().$transaction(async (tx) => {
    await tx.seasonalCollectionProduct.deleteMany({ where: { seasonalCollectionId: id } });

    return tx.seasonalCollection.update({
      where: { id },
      data: {
        ...toData(input),
        products: { create: input.productIds.map((productId) => ({ productId })) },
      },
      include: SEASONAL_COLLECTION_INCLUDE,
    });
  });

  return toRecord(row);
}

export async function deleteSeasonalCollection(id: string): Promise<void> {
  await getPrismaClient().seasonalCollection.delete({ where: { id } });
}

export interface ProductOption {
  id: string;
  slug: string;
  name: string;
}

export async function listProductOptions(): Promise<ProductOption[]> {
  return getPrismaClient().product.findMany({
    select: { id: true, slug: true, name: true },
    orderBy: { name: "asc" },
  });
}
