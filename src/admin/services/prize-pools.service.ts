import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/generated/prisma/client";

/**
 * Business logic for PrizePool/PrizeItem — backs both Wheel Spin (kind: "wheel") and Mystery Eggs
 * (kind: "egg"), same as the mock data always modeled them. Only Wheel Spin is wired up on the
 * storefront so far (src/lib/catalogue.ts's getWheelPrizePool()) — Mystery Eggs can reuse this
 * exact service/admin UI later, just by adding its own storefront read function.
 */

export type PrizePoolKind = "wheel" | "egg";
export type PrizeRarity = "common" | "uncommon" | "rare" | "jackpot";

export interface PrizeItemInput {
  label: string;
  rarity: PrizeRarity;
  weight: number;
}

export interface PrizePoolInput {
  slug: string;
  name: string;
  kind: PrizePoolKind;
  quantity: number | null;
  pricePence: number;
  image: string;
  prizeItems: PrizeItemInput[];
}

export interface PrizePoolRecord extends PrizePoolInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

const PRIZE_POOL_INCLUDE = {
  prizeItems: { orderBy: { sortOrder: "asc" } },
} satisfies Prisma.PrizePoolInclude;

type PrizePoolWithItems = Prisma.PrizePoolGetPayload<{ include: typeof PRIZE_POOL_INCLUDE }>;

function toPrizePoolRecord(row: PrizePoolWithItems): PrizePoolRecord {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    kind: row.kind as PrizePoolKind,
    quantity: row.quantity,
    pricePence: row.pricePence,
    image: row.image,
    prizeItems: row.prizeItems.map((item) => ({
      label: item.label,
      rarity: item.rarity as PrizeRarity,
      weight: item.weight.toNumber(),
    })),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toPrizePoolData(input: PrizePoolInput) {
  return {
    slug: input.slug,
    name: input.name,
    kind: input.kind,
    quantity: input.quantity,
    pricePence: input.pricePence,
    image: input.image,
  };
}

export async function listPrizePools(): Promise<PrizePoolRecord[]> {
  const rows = await getPrismaClient().prizePool.findMany({
    include: PRIZE_POOL_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toPrizePoolRecord);
}

export async function getPrizePool(id: string): Promise<PrizePoolRecord | null> {
  const row = await getPrismaClient().prizePool.findUnique({
    where: { id },
    include: PRIZE_POOL_INCLUDE,
  });
  return row ? toPrizePoolRecord(row) : null;
}

export async function createPrizePool(input: PrizePoolInput): Promise<PrizePoolRecord> {
  const row = await getPrismaClient().prizePool.create({
    data: {
      ...toPrizePoolData(input),
      prizeItems: {
        create: input.prizeItems.map((item, index) => ({
          label: item.label,
          rarity: item.rarity,
          weight: item.weight,
          sortOrder: index,
        })),
      },
    },
    include: PRIZE_POOL_INCLUDE,
  });
  return toPrizePoolRecord(row);
}

export async function updatePrizePool(id: string, input: PrizePoolInput): Promise<PrizePoolRecord> {
  const row = await getPrismaClient().$transaction(async (tx) => {
    await tx.prizeItem.deleteMany({ where: { prizePoolId: id } });

    return tx.prizePool.update({
      where: { id },
      data: {
        ...toPrizePoolData(input),
        updatedAt: new Date(),
        prizeItems: {
          create: input.prizeItems.map((item, index) => ({
            label: item.label,
            rarity: item.rarity,
            weight: item.weight,
            sortOrder: index,
          })),
        },
      },
      include: PRIZE_POOL_INCLUDE,
    });
  });

  return toPrizePoolRecord(row);
}

export async function deletePrizePool(id: string): Promise<void> {
  await getPrismaClient().prizePool.delete({ where: { id } });
}
