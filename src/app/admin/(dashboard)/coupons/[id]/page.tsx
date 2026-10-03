import Link from "next/link";
import { notFound } from "next/navigation";
import { getCoupon } from "@/admin/services/coupons.service";
import { formatPrice } from "@/lib/utils";
import { updateCouponAction } from "../actions";
import { CouponForm } from "../CouponForm";
import styles from "../coupons.module.scss";

export default async function EditCouponPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const coupon = await getCoupon(id);

  if (!coupon) notFound();

  return (
    <div>
      <h1 className={styles.title}>
        Edit coupon <span className={styles.code}>{coupon.code}</span>
      </h1>

      <dl className={styles.stats}>
        <div>
          <dt>Times used</dt>
          <dd>
            {coupon.timesUsed}
            {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
          </dd>
        </div>
        <div>
          <dt>Total discount given</dt>
          <dd>{formatPrice(coupon.totalDiscountGivenPence / 100)}</dd>
        </div>
      </dl>

      <CouponForm
        coupon={coupon}
        action={updateCouponAction.bind(null, id)}
        submitLabel="Save changes"
      />

      <h2 className={styles.sectionTitle}>Orders using this code</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Placed</th>
            <th>Customer</th>
            <th>Status</th>
            <th>Discount</th>
            <th>Total paid</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {coupon.orders.map((order) => (
            <tr key={order.id}>
              <td>{new Date(order.createdAt).toLocaleDateString("en-GB")}</td>
              <td>{order.customerEmail}</td>
              <td>{order.status}</td>
              <td>−{formatPrice(order.discountGivenPence / 100)}</td>
              <td>{formatPrice(order.totalPence / 100)}</td>
              <td>
                <Link href={`/admin/orders/${order.id}`}>View</Link>
              </td>
            </tr>
          ))}
          {coupon.orders.length === 0 && (
            <tr>
              <td colSpan={6}>Not used yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
