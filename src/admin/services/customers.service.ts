import "server-only";
import { getPrismaClient } from "@/lib/db/client";

/** Read-only — Customer rows are only ever created by src/lib/orders.ts (the Stripe webhook). */

export interface CustomerRecord {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  orderCount: number;
}

export async function listCustomers(emailSearch?: string): Promise<CustomerRecord[]> {
  const rows = await getPrismaClient().customer.findMany({
    where: emailSearch ? { email: { contains: emailSearch, mode: "insensitive" } } : undefined,
    include: { _count: { select: { orders: true } } },
    orderBy: { createdAt: "desc" },
  });

  return rows.map((row) => ({
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    orderCount: row._count.orders,
  }));
}

export interface CustomerOrderSummary {
  id: string;
  status: string;
  total: number;
  createdAt: string;
}

export interface CustomerDetailRecord extends CustomerRecord {
  orders: CustomerOrderSummary[];
}

export async function getCustomer(id: string): Promise<CustomerDetailRecord | null> {
  const row = await getPrismaClient().customer.findUnique({
    where: { id },
    include: { orders: { orderBy: { createdAt: "desc" } } },
  });
  if (!row) return null;

  return {
    id: row.id,
    email: row.email,
    name: row.name,
    createdAt: row.createdAt.toISOString(),
    orderCount: row.orders.length,
    orders: row.orders.map((order) => ({
      id: order.id,
      status: order.status,
      total: order.totalPence / 100,
      createdAt: order.createdAt.toISOString(),
    })),
  };
}
