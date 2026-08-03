export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  /** GBP, e.g. 10 = £10.00 — a snapshot taken when added, not re-fetched live. */
  price: number;
  image?: string;
  quantity: number;
}
