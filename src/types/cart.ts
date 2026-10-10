/**
 * "product" = a Shop product (id = Product.id). "prize_pool" = a Mystery Egg pack or a Wheel Spin
 * (id = PrizePool.id); its prizes are drawn server-side when payment is recorded.
 */
export type CartItemKind = "product" | "prize_pool";

export interface CartItem {
  kind: CartItemKind;
  id: string;
  name: string;
  /** GBP, e.g. 10 = £10.00 — a snapshot taken when added, not re-fetched live. */
  price: number;
  image?: string;
  quantity: number;
}

/** Stable identity of a basket line — product and prize-pool ids live in different tables. */
export function cartKey(item: Pick<CartItem, "kind" | "id">): string {
  return `${item.kind}:${item.id}`;
}

/** The only basket data sent to the server: what and how many. Prices are always re-read there. */
export function toBasketRequest(
  items: CartItem[],
): Array<Pick<CartItem, "kind" | "id" | "quantity">> {
  return items.map(({ kind, id, quantity }) => ({ kind, id, quantity }));
}
