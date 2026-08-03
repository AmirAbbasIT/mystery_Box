// Phase 2c — checkout is live (guest checkout via Stripe Checkout, no accounts). Orders are only
// ever created from the checkout.session.completed webhook (src/lib/orders.ts), never
// optimistically at "proceed to checkout" time — see claude/10-admin-panel.md.

export type OrderStatus = "paid" | "fulfilled" | "cancelled";

export interface OrderItem {
  id: string;
  /** Null if the Product was later deleted — productName/unitPrice are a snapshot either way. */
  productId: string | null;
  productName: string;
  /** GBP, e.g. 10 = £10.00 */
  unitPrice: number;
  quantity: number;
}

export interface Order {
  id: string;
  customerId: string;
  status: OrderStatus;
  /** GBP total actually charged. */
  total: number;
  shippingName: string;
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry: string;
  items: OrderItem[];
  createdAt: string;
}
