import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { listOrders } from "@/admin/services/orders.service";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
import type { OrderStatus } from "@/types/order";
import styles from "./orders.module.scss";

const FILTERS: OrderStatus[] = [
  "paid",
  "packing",
  "dispatched",
  "delivered",
  "payment_pending",
  "cancelled",
  "refunded",
];

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status: rawStatus } = await searchParams;
  const status = FILTERS.find((option) => option === rawStatus);
  const orders = await listOrders(status);

  return (
    <div>
      <h1 className={styles.title}>Orders</h1>

      <nav className={styles.filters} aria-label="Filter by status">
        <Link href="/admin/orders" aria-current={!status ? "page" : undefined}>
          All
        </Link>
        {FILTERS.map((option) => (
          <Link
            key={option}
            href={`/admin/orders?status=${option}`}
            aria-current={status === option ? "page" : undefined}
          >
            {option === "paid" ? "To pack" : ORDER_STATUS_LABELS[option]}
          </Link>
        ))}
      </nav>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Order</th>
            <th>Status</th>
            <th>Customer</th>
            <th>Total</th>
            <th>Placed</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td className={styles.orderNumber}>{order.orderNumber}</td>
              <td>
                <span className={styles.statusBadge} data-status={order.status}>
                  {ORDER_STATUS_LABELS[order.status]}
                </span>
              </td>
              <td>
                {order.customerName}
                <br />
                <span>{order.customerEmail}</span>
              </td>
              <td>{formatPrice(order.total)}</td>
              <td>{new Date(order.createdAt).toLocaleDateString("en-GB")}</td>
              <td>
                <Link href={`/admin/orders/${order.id}`}>View</Link>
              </td>
            </tr>
          ))}
          {orders.length === 0 && (
            <tr>
              <td colSpan={6}>
                {status ? "No orders with this status." : "No orders yet."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
