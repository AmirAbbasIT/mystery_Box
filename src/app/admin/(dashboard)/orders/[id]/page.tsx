import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { getOrder } from "@/admin/services/orders.service";
import { OrderStatusForm } from "../OrderStatusForm";
import styles from "../orders.module.scss";

export default async function AdminOrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrder(id);

  if (!order) notFound();

  return (
    <div>
      <h1 className={styles.title}>Order</h1>

      <dl className={styles.detailGrid}>
        <div>
          <dt>Customer</dt>
          <dd>
            <Link href={`/admin/customers/${order.customerId}`}>{order.customerName}</Link>
            <br />
            {order.customerEmail}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={styles.statusBadge} data-status={order.status}>
              {order.status}
            </span>
          </dd>
        </div>
        <div>
          <dt>Total</dt>
          <dd>{formatPrice(order.total)}</dd>
        </div>
        <div>
          <dt>Shipping address</dt>
          <dd>
            {order.shippingName}
            <br />
            {order.shippingLine1}
            {order.shippingLine2 ? <>, {order.shippingLine2}</> : null}
            <br />
            {order.shippingCity}, {order.shippingPostcode}
            <br />
            {order.shippingCountry}
          </dd>
        </div>
      </dl>

      <table className={styles.itemsTable}>
        <thead>
          <tr>
            <th>Item</th>
            <th>Qty</th>
            <th>Unit price</th>
            <th>Line total</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item) => (
            <tr key={item.id}>
              <td>{item.productName}</td>
              <td>{item.quantity}</td>
              <td>{formatPrice(item.unitPrice)}</td>
              <td>{formatPrice(item.unitPrice * item.quantity)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <OrderStatusForm orderId={order.id} currentStatus={order.status} />
    </div>
  );
}
