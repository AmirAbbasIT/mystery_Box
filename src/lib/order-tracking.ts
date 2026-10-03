import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import { findCarrier } from "@/lib/carriers";
import type { OrderStatus } from "@/types/order";

/**
 * Customer order lookup for /track. Requires the order number AND the checkout email to match —
 * the number alone must never reveal anything (UK GDPR security principle). Returns only what the
 * customer needs to follow their parcel: no full address, email or phone.
 */

export interface TrackedOrder {
  orderNumber: string;
  status: OrderStatus;
  placedAt: string;
  items: Array<{ name: string; quantity: number }>;
  totalPence: number;
  recipientFirstName: string;
  /** Outward code only, e.g. "LS1 •••". */
  postcodeHint: string;
  carrierName: string | null;
  trackingNumber: string | null;
  trackingUrl: string | null;
  dispatchedAt: string | null;
  deliveredAt: string | null;
}

export async function findTrackedOrder(
  orderNumber: string,
  email: string,
): Promise<TrackedOrder | null> {
  const order = await getPrismaClient().order.findUnique({
    where: { orderNumber },
    include: { customer: { select: { email: true } }, items: true },
  });
  if (!order || order.customer.email.toLowerCase() !== email) return null;

  return {
    orderNumber: order.orderNumber,
    status: order.status as OrderStatus,
    placedAt: order.createdAt.toISOString(),
    items: order.items.map((item) => ({
      name: item.productName,
      quantity: item.quantity,
    })),
    totalPence: order.totalPence,
    recipientFirstName: order.shippingName.split(" ")[0] ?? "",
    postcodeHint: `${order.shippingPostcode.split(" ")[0]} •••`,
    carrierName: order.carrier
      ? (findCarrier(order.carrier)?.name ?? order.carrier)
      : null,
    trackingNumber: order.trackingNumber,
    trackingUrl: order.trackingUrl,
    dispatchedAt: order.dispatchedAt?.toISOString() ?? null,
    deliveredAt: order.deliveredAt?.toISOString() ?? null,
  };
}
