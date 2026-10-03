import "server-only";
import { createHmac } from "node:crypto";
import { headers } from "next/headers";
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

/* Guessing protection: at most MAX_FAILED_ATTEMPTS unknown codes per visitor per window. */

const MAX_FAILED_ATTEMPTS = 10;
const WINDOW_MS = 10 * 60 * 1000;
const RETENTION_MS = 24 * 60 * 60 * 1000;

async function getClientKey(): Promise<string> {
  const requestHeaders = await headers();
  const ip =
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    requestHeaders.get("x-real-ip") ||
    "unknown";
  // Store an HMAC rather than the raw IP — enough to rate limit, not a log of visitors' IPs.
  return createHmac("sha256", process.env.ADMIN_SESSION_SECRET ?? "coupon-attempts")
    .update(ip)
    .digest("hex");
}

export async function isCouponGuessingLimited(): Promise<boolean> {
  const recentFailures = await getPrismaClient().couponAttempt.count({
    where: {
      clientKey: await getClientKey(),
      createdAt: { gt: new Date(Date.now() - WINDOW_MS) },
    },
  });
  return recentFailures >= MAX_FAILED_ATTEMPTS;
}

export async function recordFailedCouponAttempt(): Promise<void> {
  const prisma = getPrismaClient();
  await prisma.couponAttempt.create({ data: { clientKey: await getClientKey() } });
  await prisma.couponAttempt.deleteMany({
    where: { createdAt: { lt: new Date(Date.now() - RETENTION_MS) } },
  });
}

export const TOO_MANY_ATTEMPTS =
  "Too many attempts — please wait a few minutes and try again.";
