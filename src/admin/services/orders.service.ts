import "server-only";
import { getPrismaClient } from "@/lib/db/client";
import type { Prisma } from "@/generated/prisma/client";
import type { OrderStatus } from "@/types/order";

/**
 * Read/status-update only — there is no createOrder/deleteOrder here on purpose. Orders are only
 * ever created by src/lib/orders.ts (the Stripe webhook), matching claude/10-admin-panel.md's
 * Phase 2c scope: "no new business logic beyond what checkout already needs to write."
 */

export interface OrderItemRecord {
  id: string;
  productId: string | null;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export interface OrderRecord {
  id: string;
  status: OrderStatus;
  total: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  shippingName: string;
  shippingLine1: string;
  shippingLine2: string | null;
  shippingCity: string;
  shippingPostcode: string;
  shippingCountry: string;
  items: OrderItemRecord[];
  createdAt: string;
}

const ORDER_INCLUDE = {
  customer: true,
  items: true,
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof ORDER_INCLUDE }>;

function toRecord(row: OrderWithRelations): OrderRecord {
  return {
    id: row.id,
    status: row.status as OrderStatus,
    total: row.totalPence / 100,
    customerId: row.customerId,
    customerName: row.customer.name,
    customerEmail: row.customer.email,
    shippingName: row.shippingName,
    shippingLine1: row.shippingLine1,
    shippingLine2: row.shippingLine2,
    shippingCity: row.shippingCity,
    shippingPostcode: row.shippingPostcode,
    shippingCountry: row.shippingCountry,
    items: row.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.productName,
      unitPrice: item.unitPricePence / 100,
      quantity: item.quantity,
    })),
    createdAt: row.createdAt.toISOString(),
  };
}

export async function listOrders(): Promise<OrderRecord[]> {
  const rows = await getPrismaClient().order.findMany({
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

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<void> {
  await getPrismaClient().order.update({
    where: { id },
    data: { status, updatedAt: new Date() },
  });
}
