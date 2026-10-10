import type { PublicReview } from "@/lib/reviews";
export type AgeSuitability = "kids" | "teens" | "adults" | "all-ages";

export interface ProductImage {
  src: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  /** GBP, e.g. 10 = £10.00 */
  price: number;
  /** Category slug. */
  category: string;
  themeIds: string[];
  images: ProductImage[];
  ageSuitability: AgeSuitability[];
  stock: number;
  active: boolean;
  /** Odds/contents transparency panel — what could realistically be inside. */
  whatCouldBeInside: string[];
  featured?: boolean;
  seasonal?: boolean;
  /** Published reviews about this product (newest first, up to 5). */
  reviews?: PublicReview[];
}
