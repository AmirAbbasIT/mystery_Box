import type { SeasonalCollection } from "@/types";

// Limited-edition drops. productIds are intentionally empty for now — actual
// seasonal SKUs get added closer to each date; the pages just need to exist
// and be filterable ahead of stock being loaded.
export const seasonalCollections: SeasonalCollection[] = [
  {
    id: "season-christmas-2026",
    slug: "christmas-2026",
    name: "Christmas 2026",
    description: "Festive mystery boxes and eggs, wrapped and ready to gift.",
    startsAt: "2026-11-15",
    endsAt: "2026-12-24",
    heroImage: "/images/products/seasonal-christmas.svg",
    productIds: [],
  },
  {
    id: "season-valentines-2027",
    slug: "valentines-2027",
    name: "Valentine's Day 2027",
    description: "Romantic-themed jewellery and beauty boxes for the one you love — or yourself.",
    startsAt: "2027-01-26",
    endsAt: "2027-02-14",
    heroImage: "/images/products/seasonal-valentines.svg",
    productIds: [],
  },
  {
    id: "season-mothers-day-2027",
    slug: "mothers-day-2027",
    name: "Mother's Day 2027",
    description: "Treat-worthy boxes for Mothering Sunday.",
    startsAt: "2027-02-22",
    endsAt: "2027-03-14",
    heroImage: "/images/products/seasonal-mothers-day.svg",
    productIds: [],
  },
  {
    id: "season-easter-2027",
    slug: "easter-2027",
    name: "Easter 2027",
    description: "Our pink mystery eggs go fully seasonal, with an Easter-exclusive prize pool.",
    startsAt: "2027-03-08",
    endsAt: "2027-03-28",
    heroImage: "/images/products/seasonal-easter.svg",
    productIds: [],
  },
];
