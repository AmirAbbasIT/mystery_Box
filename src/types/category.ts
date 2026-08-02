export type CategorySlug = "jewellery" | "makeup-beauty" | "stationery";

export interface Category {
  id: string;
  slug: CategorySlug;
  name: string;
  tagline: string;
  heroImage: string;
  priceFrom: number;
}
