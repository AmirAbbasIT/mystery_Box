import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/generated/prisma/client";

export type BirthdayAudience = "kids" | "adult-party";

export interface BirthdayPackageInput {
  slug: string;
  audience: BirthdayAudience;
  name: string;
  description: string;
  priceFromPence: number;
  ageRange: string | null;
  image: string;
  includes: string[];
  themeIds: string[];
}

export interface BirthdayPackageRecord extends BirthdayPackageInput {
  id: string;
  createdAt: string;
  updatedAt: string;
}

const BIRTHDAY_PACKAGE_INCLUDE = {
  includes: { orderBy: { sortOrder: "asc" } },
  themes: true,
} satisfies Prisma.BirthdayPackageInclude;

type BirthdayPackageWithRelations = Prisma.BirthdayPackageGetPayload<{
  include: typeof BIRTHDAY_PACKAGE_INCLUDE;
}>;

function toRecord(row: BirthdayPackageWithRelations): BirthdayPackageRecord {
  return {
    id: row.id,
    slug: row.slug,
    audience: row.audience as BirthdayAudience,
    name: row.name,
    description: row.description,
    priceFromPence: row.priceFromPence,
    ageRange: row.ageRange,
    image: row.image,
    includes: row.includes.map((item) => item.label),
    themeIds: row.themes.map((theme) => theme.themeId),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toData(input: BirthdayPackageInput) {
  return {
    slug: input.slug,
    audience: input.audience,
    name: input.name,
    description: input.description,
    priceFromPence: input.priceFromPence,
    ageRange: input.ageRange,
    image: input.image,
  };
}

export async function listBirthdayPackages(): Promise<BirthdayPackageRecord[]> {
  const rows = await getPrismaClient().birthdayPackage.findMany({
    include: BIRTHDAY_PACKAGE_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function getBirthdayPackage(id: string): Promise<BirthdayPackageRecord | null> {
  const row = await getPrismaClient().birthdayPackage.findUnique({
    where: { id },
    include: BIRTHDAY_PACKAGE_INCLUDE,
  });
  return row ? toRecord(row) : null;
}

export async function createBirthdayPackage(
  input: BirthdayPackageInput,
): Promise<BirthdayPackageRecord> {
  const row = await getPrismaClient().birthdayPackage.create({
    data: {
      ...toData(input),
      includes: {
        create: input.includes.map((label, index) => ({ label, sortOrder: index })),
      },
      themes: { create: input.themeIds.map((themeId) => ({ themeId })) },
    },
    include: BIRTHDAY_PACKAGE_INCLUDE,
  });
  return toRecord(row);
}

export async function updateBirthdayPackage(
  id: string,
  input: BirthdayPackageInput,
): Promise<BirthdayPackageRecord> {
  const row = await getPrismaClient().$transaction(async (tx) => {
    await tx.birthdayPackageInclude.deleteMany({ where: { birthdayPackageId: id } });
    await tx.birthdayPackageTheme.deleteMany({ where: { birthdayPackageId: id } });

    return tx.birthdayPackage.update({
      where: { id },
      data: {
        ...toData(input),
        updatedAt: new Date(),
        includes: {
          create: input.includes.map((label, index) => ({ label, sortOrder: index })),
        },
        themes: { create: input.themeIds.map((themeId) => ({ themeId })) },
      },
      include: BIRTHDAY_PACKAGE_INCLUDE,
    });
  });

  return toRecord(row);
}

export async function deleteBirthdayPackage(id: string): Promise<void> {
  await getPrismaClient().birthdayPackage.delete({ where: { id } });
}
