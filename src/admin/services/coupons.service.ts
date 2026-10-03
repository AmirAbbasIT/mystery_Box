import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import type { CouponDiscountType } from "@/lib/coupons";

/**
 * Admin CRUD for promo codes. Usage (timesUsed) is never written here — only src/lib/orders.ts
 * increments it, when a paid order is recorded. A coupon with orders can't be deleted (FK
 * Restrict); switch it off instead so order history keeps pointing at it.
 */

export interface CouponInput {
  code: string;
  note: string | null;
  discountType: CouponDiscountType;
  percentOff: number | null;
  amountOffPence: number | null;
  maxDiscountPence: number | null;
  minSubtotalPence: number | null;
  usageLimit: number | null;
  perCustomerLimit: number | null;
  startsAt: Date | null;
  endsAt: Date | null;
  active: boolean;
}

export type CouponStatus = "active" | "scheduled" | "expired" | "used-up" | "off";

export interface CouponRecord extends Omit<CouponInput, "startsAt" | "endsAt"> {
  id: string;
  startsAt: string | null;
  endsAt: string | null;
  timesUsed: number;
  orderCount: number;
  status: CouponStatus;
  createdAt: string;
}

export interface CouponOrderSummary {
  id: string;
  createdAt: string;
  status: string;
  customerEmail: string;
  totalPence: number;
  discountGivenPence: number;
}

export interface CouponDetailRecord extends CouponRecord {
  totalDiscountGivenPence: number;
  orders: CouponOrderSummary[];
}

type CouponRow = NonNullable<Awaited<ReturnType<typeof findCouponWithCount>>>;

function findCouponWithCount(id: string) {
  return getPrismaClient().coupon.findUnique({
    where: { id },
    include: { _count: { select: { orders: true } } },
  });
}

function statusOf(row: CouponRow, now = new Date()): CouponStatus {
  if (!row.active) return "off";
  if (row.endsAt && row.endsAt <= now) return "expired";
  if (row.usageLimit !== null && row.timesUsed >= row.usageLimit) return "used-up";
  if (row.startsAt && row.startsAt > now) return "scheduled";
  return "active";
}

function toRecord(row: CouponRow): CouponRecord {
  return {
    id: row.id,
    code: row.code,
    note: row.note,
    discountType: row.discountType as CouponDiscountType,
    percentOff: row.percentOff,
    amountOffPence: row.amountOffPence,
    maxDiscountPence: row.maxDiscountPence,
    minSubtotalPence: row.minSubtotalPence,
    usageLimit: row.usageLimit,
    perCustomerLimit: row.perCustomerLimit,
    startsAt: row.startsAt?.toISOString() ?? null,
    endsAt: row.endsAt?.toISOString() ?? null,
    active: row.active,
    timesUsed: row.timesUsed,
    orderCount: row._count.orders,
    status: statusOf(row),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listCoupons(): Promise<CouponRecord[]> {
  const rows = await getPrismaClient().coupon.findMany({
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function getCoupon(id: string): Promise<CouponDetailRecord | null> {
  const row = await findCouponWithCount(id);
  if (!row) return null;

  const orders = await getPrismaClient().order.findMany({
    where: { couponId: id },
    include: { customer: { select: { email: true } } },
    orderBy: { createdAt: "desc" },
  });

  const summaries = orders.map((order) => ({
    id: order.id,
    createdAt: order.createdAt.toISOString(),
    status: order.status,
    customerEmail: order.customer.email,
    totalPence: order.totalPence,
    discountGivenPence: order.discountPence + order.shippingDiscountPence,
  }));

  return {
    ...toRecord(row),
    orders: summaries,
    totalDiscountGivenPence: summaries.reduce(
      (sum, order) => sum + order.discountGivenPence,
      0,
    ),
  };
}

export async function createCoupon(input: CouponInput): Promise<void> {
  await getPrismaClient().coupon.create({ data: input });
}

/** The code itself is locked once the coupon has been used, so order history stays consistent. */
export async function updateCoupon(id: string, input: CouponInput): Promise<void> {
  const prisma = getPrismaClient();
  const existing = await prisma.coupon.findUnique({ where: { id } });
  if (!existing) throw new Error("Coupon not found.");
  if (existing.timesUsed > 0 && existing.code !== input.code) {
    throw new Error("This code has already been used, so it can't be renamed.");
  }
  await prisma.coupon.update({ where: { id }, data: input });
}

export async function deleteCoupon(id: string): Promise<void> {
  const prisma = getPrismaClient();
  const used = await prisma.order.count({ where: { couponId: id } });
  if (used > 0) {
    throw new Error(
      "This code has been used on orders, so it can't be deleted — switch it off.",
    );
  }
  await prisma.coupon.delete({ where: { id } });
}
