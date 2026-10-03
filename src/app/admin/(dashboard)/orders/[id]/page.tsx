import { notFound } from "next/navigation";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { getOrder } from "@/admin/services/orders.service";
import { findCarrier } from "@/lib/carriers";
import { ORDER_STATUS_LABELS } from "@/lib/order-status";
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
      <h1 className={styles.title}>
        Order <span className={styles.orderNumber}>{order.orderNumber}</span>
      </h1>

      <dl className={styles.detailGrid}>
        <div>
          <dt>Customer</dt>
          <dd>
            <Link href={`/admin/customers/${order.customerId}`}>
              {order.customerName}
            </Link>
            <br />
            {order.customerEmail}
            {order.contactPhone && (
              <>
                <br />
                {order.contactPhone}
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>Status</dt>
          <dd>
            <span className={styles.statusBadge} data-status={order.status}>
              {ORDER_STATUS_LABELS[order.status]}
            </span>
            {order.dispatchedAt && (
              <>
                <br />
                Dispatched {new Date(order.dispatchedAt).toLocaleDateString("en-GB")}
              </>
            )}
            {order.deliveredAt && (
              <>
                <br />
                Delivered {new Date(order.deliveredAt).toLocaleDateString("en-GB")}
              </>
            )}
          </dd>
        </div>
        {order.carrier && (
          <div>
            <dt>Tracking</dt>
            <dd>
              {findCarrier(order.carrier)?.name ?? order.carrier}
              <br />
              {order.trackingNumber ?? "No tracking number"}
              {order.trackingUrl && (
                <>
                  <br />
                  <a href={order.trackingUrl} target="_blank" rel="noopener noreferrer">
                    Open tracking page
                  </a>
                </>
              )}
            </dd>
          </div>
        )}
        <div>
          <dt>Total</dt>
          <dd>
            {formatPrice(order.total)}
            {order.shipping > 0 && <> (incl. {formatPrice(order.shipping)} shipping)</>}
            {order.couponCode && (
              <>
                <br />
                Coupon{" "}
                {order.couponId ? (
                  <Link href={`/admin/coupons/${order.couponId}`}>
                    {order.couponCode}
                  </Link>
                ) : (
                  order.couponCode
                )}
                : −{formatPrice(order.discount)}
              </>
            )}
          </dd>
        </div>
        <div>
          <dt>PayPal</dt>
          <dd>
            Order {order.paypalOrderId}
            <br />
            Capture {order.paypalCaptureId ?? "—"}
          </dd>
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

      <OrderStatusForm
        orderId={order.id}
        currentStatus={order.status}
        carrier={order.carrier}
        trackingNumber={order.trackingNumber}
        trackingUrl={order.trackingUrl}
      />
    </div>
  );
}
