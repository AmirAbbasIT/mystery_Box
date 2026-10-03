import { calculateShippingPence, type ShippingSettings } from "@/lib/shipping";

/**
 * Promo-code pricing — pure, so the checkout summary previews exactly what the server charges.
 * The server (src/lib/orders.ts) always recomputes this itself from DB prices and the DB coupon;
 * the browser's copy is display-only.
 */

export type CouponDiscountType = "percentage" | "fixed" | "free_shipping";

export const COUPON_DISCOUNT_TYPES: CouponDiscountType[] = [
  "percentage",
  "fixed",
  "free_shipping",
];

/** The parts of a coupon that affect price — safe to send to the browser after a valid Apply. */
export interface CouponPricing {
  code: string;
  discountType: CouponDiscountType;
  percentOff: number | null;
  amountOffPence: number | null;
  maxDiscountPence: number | null;
}

export interface OrderTotals {
  subtotalPence: number;
  /** Off the items. */
  discountPence: number;
  /** Shipping before any free-shipping coupon (after the free-over threshold rule). */
  shippingPence: number;
  /** Shipping waived by a free-shipping coupon. */
  shippingDiscountPence: number;
  totalPence: number;
}

/** Codes are case-insensitive: stored and compared uppercase. */
export function normaliseCouponCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z0-9_-]{2,40}$/.test(code) ? code : null;
}

/**
 * One coupon per order. Item discounts never exceed the item subtotal (percentages round down to
 * the penny). Free-shipping eligibility ("free over £X") is judged on the subtotal *after* the
 * item discount.
 */
export function calculateOrderTotals(
  subtotalPence: number,
  shipping: ShippingSettings,
  coupon: CouponPricing | null,
): OrderTotals {
  let discountPence = 0;
  if (coupon?.discountType === "percentage" && coupon.percentOff) {
    discountPence = Math.floor((subtotalPence * coupon.percentOff) / 100);
    if (coupon.maxDiscountPence !== null) {
      discountPence = Math.min(discountPence, coupon.maxDiscountPence);
    }
  } else if (coupon?.discountType === "fixed" && coupon.amountOffPence) {
    discountPence = coupon.amountOffPence;
  }
  discountPence = Math.max(0, Math.min(discountPence, subtotalPence));

  const shippingPence = calculateShippingPence(subtotalPence - discountPence, shipping);
  const shippingDiscountPence =
    coupon?.discountType === "free_shipping" ? shippingPence : 0;

  return {
    subtotalPence,
    discountPence,
    shippingPence,
    shippingDiscountPence,
    totalPence: subtotalPence - discountPence + shippingPence - shippingDiscountPence,
  };
}

export function describeCoupon(coupon: CouponPricing): string {
  if (coupon.discountType === "free_shipping") return "Free shipping";
  if (coupon.discountType === "percentage") {
    const cap =
      coupon.maxDiscountPence !== null
        ? ` (up to £${(coupon.maxDiscountPence / 100).toFixed(2)})`
        : "";
    return `${coupon.percentOff}% off${cap}`;
  }
  return `£${((coupon.amountOffPence ?? 0) / 100).toFixed(2)} off`;
}
