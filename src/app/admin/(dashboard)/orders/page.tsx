import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { listOrders } from "@/admin/services/orders.service";
import styles from "./orders.module.scss";

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <div>
      <h1 className={styles.title}>Orders</h1>

      <table className={styles.table}>
        <thead>
          <tr>
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
              <td>
                <span className={styles.statusBadge} data-status={order.status}>
                  {order.status}
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
              <td colSpan={5}>No orders yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
