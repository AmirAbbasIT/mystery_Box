import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import { formatPrice } from "@/lib/utils";
import {
  COUPON_DISCOUNT_TYPES,
  type CouponDiscountType,
  type CouponPricing,
} from "@/lib/coupons";
import type { Coupon } from "@/generated/prisma/client";

/**
 * Whether a coupon can be used right now. Called on Apply (preview), when the PayPal order is
 * created, and again just before capture — the last check is what actually protects against a
 * code expiring, being switched off or running out while someone is paying.
 */

export type CouponCheck =
  | { ok: true; coupon: Coupon; pricing: CouponPricing }
  | { ok: false; error: string; unknownCode?: boolean };

const NOT_VALID = "This code isn't valid.";

export function toCouponPricing(coupon: Coupon): CouponPricing {
  return {
    code: coupon.code,
    discountType: coupon.discountType as CouponDiscountType,
    percentOff: coupon.percentOff,
    amountOffPence: coupon.amountOffPence,
    maxDiscountPence: coupon.maxDiscountPence,
  };
}

export async function checkCoupon(
  coupon: Coupon | null,
  context: { subtotalPence: number; email: string | null; now?: Date },
): Promise<CouponCheck> {
  const now = context.now ?? new Date();

  // Not found, switched off and not-started-yet all look identical, so the response can't be used
  // to discover codes that exist (e.g. an upcoming promo).
  if (!coupon || !coupon.active || (coupon.startsAt && coupon.startsAt > now)) {
    return { ok: false, error: NOT_VALID, unknownCode: !coupon };
  }
  if (!COUPON_DISCOUNT_TYPES.includes(coupon.discountType as CouponDiscountType)) {
    return { ok: false, error: NOT_VALID };
  }
  if (coupon.endsAt && coupon.endsAt <= now) {
    return { ok: false, error: "This code has expired." };
  }
  if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
    return { ok: false, error: "This code has reached its usage limit." };
  }
  if (
    coupon.minSubtotalPence !== null &&
    context.subtotalPence < coupon.minSubtotalPence
  ) {
    return {
      ok: false,
      error: `Spend ${formatPrice(coupon.minSubtotalPence / 100)} or more to use this code.`,
    };
  }
  if (coupon.perCustomerLimit !== null && context.email) {
    const previousUses = await getPrismaClient().order.count({
      where: {
        couponId: coupon.id,
        status: { not: "cancelled" },
        customer: { email: context.email },
      },
    });
    if (previousUses >= coupon.perCustomerLimit) {
      return { ok: false, error: "You've already used this code." };
    }
  }

  return { ok: true, coupon, pricing: toCouponPricing(coupon) };
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  return getPrismaClient().coupon.findUnique({ where: { code } });
}

export async function findCouponById(id: string): Promise<Coupon | null> {
  return getPrismaClient().coupon.findUnique({ where: { id } });
}
