// Dev seed data — matches src/data/categories.ts and src/data/themes.ts so the admin panel has
// something to work with. Run via `npx prisma db seed`. Safe to re-run — upserts on slug.
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

// Matches src/data/prize-pools.ts's "pool-wheel-luxury" entry — kept in sync manually since
// PrizePool has no admin-managed mock counterpart the way categories/themes barrel-export one.
const wheelPrizePool = {
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
};

const existingWheelPool = await prisma.prizePool.findUnique({ where: { slug: wheelPrizePool.slug } });
if (existingWheelPool) {
  await prisma.prizeItem.deleteMany({ where: { prizePoolId: existingWheelPool.id } });
  await prisma.prizePool.update({
    where: { id: existingWheelPool.id },
    data: {
      name: wheelPrizePool.name,
      kind: wheelPrizePool.kind,
      quantity: wheelPrizePool.quantity,
      pricePence: wheelPrizePool.pricePence,
      image: wheelPrizePool.image,
      prizeItems: {
        create: wheelPrizePool.prizeItems.map((item, index) => ({ ...item, sortOrder: index })),
      },
    },
  });
} else {
  await prisma.prizePool.create({
    data: {
      slug: wheelPrizePool.slug,
      name: wheelPrizePool.name,
      kind: wheelPrizePool.kind,
      quantity: wheelPrizePool.quantity,
      pricePence: wheelPrizePool.pricePence,
      image: wheelPrizePool.image,
      prizeItems: {
        create: wheelPrizePool.prizeItems.map((item, index) => ({ ...item, sortOrder: index })),
      },
    },
  });
}

console.log(
  `Seeded ${categories.length} categories, ${themes.length} themes, and the Luxury Wheel Spin prize pool.`,
);
await prisma.$disconnect();
