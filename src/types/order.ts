// Phase 2c — checkout is live (guest checkout via PayPal, no accounts). Orders are only ever
// created once PayPal has captured the payment (src/lib/orders.ts), never optimistically — see
// claude/10-admin-panel.md. payment_pending = PayPal accepted the capture but hasn't settled it
// yet (flips to paid via webhook); refunded is set by the refund/chargeback webhooks.

export type OrderStatus =
  | "payment_pending"
  | "paid"
  | "packing"
  | "dispatched"
  | "delivered"
  | "cancelled"
  | "refunded";

/** Statuses staff can set by hand — the payment-driven ones only ever come from PayPal. */
export const STAFF_ORDER_STATUSES: OrderStatus[] = [
  "paid",
  "packing",
  "dispatched",
  "delivered",
  "cancelled",
];

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
  /** GBP total actually charged, including shipping. */
  total: number;
  /** GBP shipping portion of total. */
  shipping: number;
  shippingName: string;
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry: string;
  items: OrderItem[];
  createdAt: string;
}
