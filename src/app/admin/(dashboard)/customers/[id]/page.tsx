import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { getCustomer } from "@/admin/services/customers.service";
import styles from "../customers.module.scss";

export default async function AdminCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const customer = await getCustomer(id);

  if (!customer) notFound();

  return (
    <div>
      <h1 className={styles.title}>{customer.name}</h1>

      <dl className={styles.detailGrid}>
        <div>
          <dt>Email</dt>
          <dd>{customer.email}</dd>
        </div>
        <div>
          <dt>Customer since</dt>
          <dd>{new Date(customer.createdAt).toLocaleDateString("en-GB")}</dd>
        </div>
        <div>
          <dt>Total orders</dt>
          <dd>{customer.orderCount}</dd>
        </div>
      </dl>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Status</th>
            <th>Total</th>
            <th>Placed</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {customer.orders.map((order) => (
            <tr key={order.id}>
              <td>{order.status}</td>
              <td>{formatPrice(order.total)}</td>
              <td>{new Date(order.createdAt).toLocaleDateString("en-GB")}</td>
              <td>
                <Link href={`/admin/orders/${order.id}`}>View</Link>
              </td>
            </tr>
          ))}
          {customer.orders.length === 0 && (
            <tr>
              <td colSpan={4}>No orders yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
