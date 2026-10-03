import { createCouponAction } from "../actions";
import { CouponForm } from "../CouponForm";
import styles from "../coupons.module.scss";

export default function NewCouponPage() {
  return (
    <div>
      <h1 className={styles.title}>New coupon</h1>
      <CouponForm action={createCouponAction} submitLabel="Create coupon" />
    </div>
  );
}
