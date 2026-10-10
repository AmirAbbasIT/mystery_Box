import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/types/order";

/**
 * Read/status-update only — there is no createOrder/deleteOrder here on purpose. Orders are only
 * ever created by src/lib/orders.ts (PayPal checkout), matching .claude/docs/10-admin-panel.md's
 * Phase 2c scope: "no new business logic beyond what checkout already needs to write."
 */

export interface OrderPrizeRecord {
  position: number;
  label: string;
  rarity: string;
  /** Odds it was drawn at, e.g. 6 = 6%. */
  oddsPercent: number;
}

export interface OrderItemRecord {
  id: string;
  /** "product" | "egg_pack" | "wheel_spin" */
  itemType: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
  /** Drawn prizes (egg packs / wheel spins) — what to pack. */
  prizes: OrderPrizeRecord[];
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  total: number;
  shipping: number;
  /** GBP — item discount plus any shipping waived by a free-shipping coupon. */
  discount: number;
  couponId: string | null;
  couponCode: string | null;
  paypalOrderId: string;
  paypalCaptureId: string | null;
  contactPhone: string | null;
  customerId: string;
  customerName: string;
  customerEmail: string;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry: string;
  carrier: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
  items: OrderItemRecord[];
  createdAt: string;
}

const ORDER_INCLUDE = {
  customer: true,
  items: { include: { prizes: { orderBy: { position: "asc" } } } },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

function toRecord(row: OrderWithRelations): OrderRecord {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status as OrderStatus,
    total: row.totalPence / 100,
    shipping: row.shippingPence / 100,
    discount: (row.discountPence + row.shippingDiscountPence) / 100,
    couponId: row.couponId,
    couponCode: row.couponCode,
    paypalOrderId: row.paypalOrderId,
    paypalCaptureId: row.paypalCaptureId,
    contactPhone: row.contactPhone,
    customerId: row.customerId,
    customerName: row.customer.name,
    customerEmail: row.customer.email,
    shippingName: row.shippingName,
    shippingLine1: row.shippingLine1,
    shippingLine2: row.shippingLine2,
    shippingCity: row.shippingCity,
    shippingPostcode: row.shippingPostcode,
    shippingCountry: row.shippingCountry,
    carrier: row.carrier,
    trackingNumber: row.trackingNumber,
    trackingUrl: row.trackingUrl,
    dispatchedAt: row.dispatchedAt?.toISOString() ?? null,
    deliveredAt: row.deliveredAt?.toISOString() ?? null,
    items: row.items.map((item) => ({
      id: item.id,
      itemType: item.itemType,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPricePence / 100,
      quantity: item.quantity,
      prizes: item.prizes.map((prize) => ({
        position: prize.position,
        label: prize.label,
        rarity: prize.rarity,
        oddsPercent:
          prize.totalWeight.toNumber() > 0
            ? (prize.weight.toNumber() / prize.totalWeight.toNumber()) * 100
            : 0,
      })),
    })),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listOrders(status?: OrderStatus): Promise<OrderRecord[]> {
  const rows = await getPrismaClient().order.findMany({
    where: status ? { status } : undefined,
    include: ORDER_INCLUDE,
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toRecord);
}

export async function getOrder(id: string): Promise<OrderRecord | null> {
  const row = await getPrismaClient().order.findUnique({
    where: { id },
    include: ORDER_INCLUDE,
  });
  return row ? toRecord(row) : null;
}

export interface OrderStatusUpdate {
  status: OrderStatus;
  /** Required when status is "dispatched"; ignored otherwise (existing details are kept). */
  dispatch?: {
    carrier: string;
    trackingNumber: string | null;
    trackingUrl: string | null;
  };
}

/**
 * Staff status change. Dispatch details are stored when marking dispatched; the first dispatch /
 * delivery time is kept if staff later correct the status back and forth, so the customer's
 * timeline doesn't jump around.
 */
export async function updateOrderStatus(
  id: string,
  update: OrderStatusUpdate,
): Promise<{ previousStatus: OrderStatus }> {
  const prisma = getPrismaClient();
  const existing = await prisma.order.findUnique({
    where: { id },
    select: { status: true, dispatchedAt: true, deliveredAt: true },
  });
  if (!existing) throw new Error("Order not found.");

  const now = new Date();
  const reachedDispatch = update.status === "dispatched" || update.status === "delivered";

  await prisma.order.update({
    where: { id },
    data: {
      status: update.status,
      updatedAt: now,
      ...(update.dispatch ?? {}),
      ...(reachedDispatch && !existing.dispatchedAt ? { dispatchedAt: now } : {}),
      ...(update.status === "delivered" && !existing.deliveredAt
        ? { deliveredAt: now }
        : {}),
    },
  });
  return { previousStatus: existing.status as OrderStatus };
}

export interface OrderEmailRecord {
  id: string;
  kind: string;
  status: string;
  provider: string;
  error: string | null;
  createdAt: string;
}

export async function listOrderEmails(orderId: string): Promise<OrderEmailRecord[]> {
  const rows = await getPrismaClient().orderEmail.findMany({
    where: { orderId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    status: row.status,
    provider: row.provider,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
  }));
}
