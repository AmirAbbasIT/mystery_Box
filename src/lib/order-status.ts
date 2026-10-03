import type { OrderStatus } from "@/types/order";

/** Customer- and staff-facing wording for each order status, shared by /track and the admin. */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  payment_pending: "Payment processing",
  paid: "Order placed",
  packing: "Being packed",
  dispatched: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

export const ORDER_STATUS_DESCRIPTIONS: Record<OrderStatus, string> = {
  payment_pending:
    "PayPal is still processing your payment — we'll start packing once it clears.",
  paid: "We've got your order and will start packing it soon.",
  packing: "We're hand-packing your order right now.",
  dispatched: "Your order is on its way.",
  delivered: "Your order has been delivered. Enjoy the reveal!",
  cancelled: "This order was cancelled. If you were charged, your refund is on its way.",
  refunded: "This order has been refunded to your original payment method.",
};

/** The happy-path timeline shown on /track; cancelled/refunded orders show a single notice instead. */
export const ORDER_TIMELINE: OrderStatus[] = [
  "paid",
  "packing",
  "dispatched",
  "delivered",
];

export function timelineIndex(status: OrderStatus): number {
  if (status === "payment_pending") return 0;
  return ORDER_TIMELINE.indexOf(status);
}
