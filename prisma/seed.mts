// Dev seed data — matches src/data/{categories,themes,prize-pools}.ts so the storefront doesn't
// go blank when a page switches from mock data to the database. Run via `npx prisma db seed`.
// Safe to re-run — upserts on slug.
//
// TypeScript, not .mjs: the generated Prisma client (src/generated/prisma/) is TS source, not
// compiled JS, so a plain Node ESM script can't import it directly — run via tsx instead
// (configured in prisma.config.ts's migrations.seed).
import { config as loadEnv } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

loadEnv({ path: ".env.local" });

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const categories = [
  {
    slug: "jewellery",
    name: "Jewellery Mystery Box",
    tagline: "Rings, earrings & necklaces picked to a theme you love.",
    heroImage: "/images/products/jewellery.svg",
  },
  {
    slug: "makeup-beauty",
    name: "Makeup & Beauty Mystery Box",
    tagline: "A surprise beauty edit — makeup, skincare and self-care extras.",
    heroImage: "/images/products/beauty.svg",
  },
  {
    slug: "stationery",
    name: "Stationery & Accessories Mystery Box",
    tagline: "Cute stationery, hair accessories and desk treats.",
    heroImage: "/images/products/stationery.svg",
  },
];

const themes = [
  {
    slug: "kawaii-pastels",
    name: "Kawaii Pastels",
    colorSwatch: "#ffc2dd",
    description: "Soft pastel, cute-core pieces — for the girls who love all things adorable.",
  },
  {
    slug: "y2k-sparkle",
    name: "Y2K Sparkle",
    colorSwatch: "#c6a6f2",
    description: "Butterfly clips, glitter and 2000s nostalgia.",
  },
  {
    slug: "cottagecore-florals",
    name: "Cottagecore Florals",
    colorSwatch: "#ffd166",
    description: "Pressed flowers, gingham and soft romantic details.",
  },
  {
    slug: "celestial-stars",
    name: "Celestial & Stars",
    colorSwatch: "#7a3dc2",
    description: "Moons, stars and celestial charms for dreamers.",
  },
  {
    slug: "retro-cartoon",
    name: "Retro Cartoon",
    colorSwatch: "#ff6fa5",
    description: "Bold, playful cartoon-inspired colours and shapes.",
  },
  {
    slug: "unicorn-dreams",
    name: "Unicorn Dreams",
    colorSwatch: "#e14d82",
    description: "Rainbow brights and unicorn magic — a firm kids' favourite.",
  },
];

for (const category of categories) {
  await prisma.category.upsert({
    where: { slug: category.slug },
    update: category,
    create: category,
  });
}

for (const theme of themes) {
  await prisma.theme.upsert({
    where: { slug: theme.slug },
    update: theme,
    create: theme,
  });
}

interface PrizeItemSeed {
  label: string;
  rarity: string;
  weight: number;
}

interface PrizePoolSeed {
  slug: string;
  name: string;
  kind: string;
  quantity: number | null;
  pricePence: number;
  image: string;
  prizeItems: PrizeItemSeed[];
}

// Matches src/data/prize-pools.ts — kept in sync manually since PrizePool has no admin-managed
// mock counterpart the way categories/themes barrel-export one. PrizeItems are always
// delete+recreate on re-run (same pattern as prize-pools.service.ts) since upsert doesn't cleanly
// handle nested to-many relations.
async function upsertPrizePool(pool: PrizePoolSeed) {
  const existing = await prisma.prizePool.findUnique({ where: { slug: pool.slug } });
  const data = {
    name: pool.name,
    kind: pool.kind,
    quantity: pool.quantity,
    pricePence: pool.pricePence,
    image: pool.image,
    prizeItems: {
      create: pool.prizeItems.map((item, index) => ({ ...item, sortOrder: index })),
    },
  };

  if (existing) {
    await prisma.prizeItem.deleteMany({ where: { prizePoolId: existing.id } });
    await prisma.prizePool.update({ where: { id: existing.id }, data });
  } else {
    await prisma.prizePool.create({ data: { slug: pool.slug, ...data } });
  }
}

const prizePools: PrizePoolSeed[] = [
  {
    slug: "luxury-wheel-spin",
    name: "Luxury Wheel Spin",
    kind: "wheel",
    quantity: null,
    pricePence: 1500,
    image: "/images/products/wheel.svg",
    prizeItems: [
      { label: "Enamel Charm", rarity: "common", weight: 34 },
      { label: "Collectable Pin", rarity: "common", weight: 30 },
      { label: "Mini Jewellery Set", rarity: "uncommon", weight: 16 },
      { label: "Beauty Bundle", rarity: "uncommon", weight: 12 },
      { label: "Full-Size Beauty Hero Product", rarity: "rare", weight: 6 },
      { label: "£50 Gift Card", rarity: "jackpot", weight: 2 },
    ],
  },
  {
    slug: "pink-egg-single",
    name: "Mystery Pink Egg",
    kind: "egg",
    quantity: 1,
    pricePence: 500,
    image: "/images/products/egg.svg",
    prizeItems: [
      { label: "Jewellery Charm", rarity: "common", weight: 45 },
      { label: "Hair Clip", rarity: "common", weight: 30 },
      { label: "Mini Beauty Item", rarity: "uncommon", weight: 18 },
      { label: "Ring", rarity: "rare", weight: 7 },
    ],
  },
  {
    slug: "pink-egg-5-pack",
    name: "Mystery Pink Eggs — 5 Pack",
    kind: "egg",
    quantity: 5,
    pricePence: 1000,
    image: "/images/products/egg.svg",
    prizeItems: [
      { label: "Jewellery Charm", rarity: "common", weight: 40 },
      { label: "Hair Clip", rarity: "common", weight: 28 },
      { label: "Mini Beauty Item", rarity: "uncommon", weight: 18 },
      { label: "Ring", rarity: "rare", weight: 10 },
      { label: "Golden Egg — Bonus Prize", rarity: "jackpot", weight: 4 },
    ],
  },
  {
    slug: "pink-egg-10-pack",
    name: "Mystery Pink Eggs — 10 Pack",
    kind: "egg",
    quantity: 10,
    pricePence: 2000,
    image: "/images/products/egg.svg",
    prizeItems: [
      { label: "Jewellery Charm", rarity: "common", weight: 38 },
      { label: "Hair Clip", rarity: "common", weight: 26 },
      { label: "Mini Beauty Item", rarity: "uncommon", weight: 19 },
      { label: "Ring", rarity: "rare", weight: 12 },
      { label: "Golden Egg — Bonus Prize", rarity: "jackpot", weight: 5 },
    ],
  },
  {
    slug: "pink-egg-15-pack",
    name: "Mystery Pink Eggs — 15 Pack",
    kind: "egg",
    quantity: 15,
    pricePence: 3000,
    image: "/images/products/egg.svg",
    prizeItems: [
      { label: "Jewellery Charm", rarity: "common", weight: 36 },
      { label: "Hair Clip", rarity: "common", weight: 24 },
      { label: "Mini Beauty Item", rarity: "uncommon", weight: 20 },
      { label: "Ring", rarity: "rare", weight: 14 },
      { label: "Golden Egg — Bonus Prize", rarity: "jackpot", weight: 6 },
    ],
  },
];

for (const pool of prizePools) {
  await upsertPrizePool(pool);
}

console.log(
  `Seeded ${categories.length} categories, ${themes.length} themes, and ${prizePools.length} prize pools (1 wheel, 4 egg tiers).`,
);
await prisma.$disconnect();
