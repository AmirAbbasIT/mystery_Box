export interface Category {
  id: string;
  /** Admin-defined (auto-generated from the name) — any slug routes via /shop/[slug]. */
  slug: string;
  name: string;
  tagline: string;
  heroImage: string;
  /** Cheapest active product's price; null when the category has nothing on sale right now. */
  priceFrom: number | null;
}
