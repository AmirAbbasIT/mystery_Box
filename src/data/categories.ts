import type { Category } from "@/types";

export const categories: Category[] = [
  {
    id: "cat-jewellery",
    slug: "jewellery",
    name: "Jewellery Mystery Box",
    tagline: "Rings, earrings & necklaces picked to a theme you love.",
    heroImage: "/images/products/jewellery.svg",
    priceFrom: 10,
  },
  {
    id: "cat-makeup-beauty",
    slug: "makeup-beauty",
    name: "Makeup & Beauty Mystery Box",
    tagline: "A surprise beauty edit — makeup, skincare and self-care extras.",
    heroImage: "/images/products/beauty.svg",
    priceFrom: 10,
  },
  {
    id: "cat-stationery",
    slug: "stationery",
    name: "Stationery & Accessories Mystery Box",
    tagline: "Cute stationery, hair accessories and desk treats.",
    heroImage: "/images/products/stationery.svg",
    priceFrom: 10,
  },
];
