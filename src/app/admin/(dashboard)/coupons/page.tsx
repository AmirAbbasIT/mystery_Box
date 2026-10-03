import Link from "next/link";
import { listCoupons, type CouponRecord } from "@/admin/services/coupons.service";
import { describeCoupon } from "@/lib/coupons";
import { addDays, toLondonDate } from "@/lib/london-time";
import { deleteCouponAction } from "./actions";
import styles from "./coupons.module.scss";

const STATUS_LABELS: Record<CouponRecord["status"], string> = {
  active: "Active",
  scheduled: "Scheduled",
  expired: "Expired",
  "used-up": "Used up",
  off: "Off",
};

function dateRange(coupon: CouponRecord): string {
  const start = coupon.startsAt ? toLondonDate(new Date(coupon.startsAt)) : null;
  const end = coupon.endsAt ? addDays(toLondonDate(new Date(coupon.endsAt)), -1) : null;
  if (!start && !end) return "Always";
  return `${start ?? "Now"} → ${end ?? "No end"}`;
}

export default async function AdminCouponsPage() {
  const coupons = await listCoupons();

  return (
    <div>
      <div className={styles.header}>
        <h1 className={styles.title}>Coupons</h1>
        <Link href="/admin/coupons/new" className={styles.newLink}>
          + New coupon
        </Link>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Code</th>
            <th>Discount</th>
            <th>Status</th>
            <th>Used</th>
            <th>Dates</th>
            <th aria-label="Actions"></th>
          </tr>
        </thead>
        <tbody>
          {coupons.map((coupon) => (
            <tr key={coupon.id}>
              <td>
                <span className={styles.code}>{coupon.code}</span>
                {coupon.note && <div className={styles.muted}>{coupon.note}</div>}
              </td>
              <td>{describeCoupon(coupon)}</td>
              <td>
                <span className={styles.statusBadge} data-status={coupon.status}>
                  {STATUS_LABELS[coupon.status]}
                </span>
              </td>
              <td>
                {coupon.timesUsed}
                {coupon.usageLimit !== null && ` / ${coupon.usageLimit}`}
              </td>
              <td className={styles.muted}>{dateRange(coupon)}</td>
              <td className={styles.actions}>
                <Link href={`/admin/coupons/${coupon.id}`}>Edit</Link>
                {coupon.orderCount === 0 && (
                  <form action={deleteCouponAction.bind(null, coupon.id)}>
                    <button type="submit" className={styles.deleteButton}>
                      Delete
                    </button>
                  </form>
                )}
              </td>
            </tr>
          ))}
          {coupons.length === 0 && (
            <tr>
              <td colSpan={6}>No coupons yet.</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
