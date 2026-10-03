"use client";

import { useActionState, useState } from "react";
import type { CouponRecord } from "@/admin/services/coupons.service";
import { describeCoupon, type CouponDiscountType } from "@/lib/coupons";
import { addDays, toLondonDate } from "@/lib/london-time";
import type { CouponFormState } from "./actions";
import styles from "./coupons.module.scss";

interface CouponFormProps {
  coupon?: CouponRecord;
  action: (state: CouponFormState, formData: FormData) => Promise<CouponFormState>;
  submitLabel: string;
}

const pounds = (pence: number | null | undefined) =>
  pence === null || pence === undefined ? "" : (pence / 100).toFixed(2);

const TYPE_LABELS: Record<CouponDiscountType, string> = {
  percentage: "Percentage off",
  fixed: "Fixed amount off",
  free_shipping: "Free shipping",
};

export function CouponForm({ coupon, action, submitLabel }: CouponFormProps) {
  const [state, formAction, pending] = useActionState(action, {});
  const [code, setCode] = useState(coupon?.code ?? "");
  const [discountType, setDiscountType] = useState<CouponDiscountType>(
    coupon?.discountType ?? "percentage",
  );
  const [percentOff, setPercentOff] = useState(coupon?.percentOff?.toString() ?? "");
  const [amountOff, setAmountOff] = useState(pounds(coupon?.amountOffPence));
  const [maxDiscount, setMaxDiscount] = useState(pounds(coupon?.maxDiscountPence));

  const codeLocked = (coupon?.timesUsed ?? 0) > 0;
  const toPence = (value: string) => (value ? Math.round(Number(value) * 100) : null);
  const preview = describeCoupon({
    code,
    discountType,
    percentOff: Number(percentOff) || 0,
    amountOffPence: toPence(amountOff),
    maxDiscountPence: toPence(maxDiscount),
  });

  return (
    <div className={styles.formLayout}>
      <form action={formAction} className={styles.form}>
        <div className={styles.field}>
          <label htmlFor="code">Code</label>
          <input
            id="code"
            name="code"
            value={code}
            onChange={(event) => setCode(event.target.value.toUpperCase())}
            readOnly={codeLocked}
            required
            maxLength={40}
            autoComplete="off"
          />
          <p className={styles.hint}>
            {codeLocked
              ? "Locked — this code has already been used on orders."
              : "Letters, numbers, - and _. Customers can type it in any case. Use long random codes for high-value offers."}
          </p>
        </div>

        <fieldset className={styles.fieldset}>
          <legend>Discount type</legend>
          {(Object.keys(TYPE_LABELS) as CouponDiscountType[]).map((type) => (
            <label key={type} className={styles.radioLabel}>
              <input
                type="radio"
                name="discountType"
                value={type}
                checked={discountType === type}
                onChange={() => setDiscountType(type)}
              />
              {TYPE_LABELS[type]}
            </label>
          ))}
        </fieldset>

        {discountType === "percentage" && (
          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label htmlFor="percentOff">Percent off</label>
              <input
                id="percentOff"
                name="percentOff"
                inputMode="numeric"
                value={percentOff}
                onChange={(event) => setPercentOff(event.target.value)}
                placeholder="10"
                required
              />
            </div>
            <div className={styles.field}>
              <label htmlFor="maxDiscount">Maximum discount (£) — optional</label>
              <input
                id="maxDiscount"
                name="maxDiscount"
                inputMode="decimal"
                value={maxDiscount}
                onChange={(event) => setMaxDiscount(event.target.value)}
                placeholder="No cap"
              />
            </div>
          </div>
        )}

        {discountType === "fixed" && (
          <div className={styles.field}>
            <label htmlFor="amountOff">Amount off (£)</label>
            <input
              id="amountOff"
              name="amountOff"
              inputMode="decimal"
              value={amountOff}
              onChange={(event) => setAmountOff(event.target.value)}
              placeholder="5.00"
              required
            />
          </div>
        )}

        <div className={styles.field}>
          <label htmlFor="minSubtotal">Minimum order (£) — optional</label>
          <input
            id="minSubtotal"
            name="minSubtotal"
            inputMode="decimal"
            defaultValue={pounds(coupon?.minSubtotalPence)}
            placeholder="No minimum"
          />
          <p className={styles.hint}>Basket subtotal (before discount and shipping).</p>
        </div>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="usageLimit">Total uses — optional</label>
            <input
              id="usageLimit"
              name="usageLimit"
              inputMode="numeric"
              defaultValue={coupon?.usageLimit ?? ""}
              placeholder="Unlimited"
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="perCustomerLimit">Uses per customer — optional</label>
            <input
              id="perCustomerLimit"
              name="perCustomerLimit"
              inputMode="numeric"
              defaultValue={coupon?.perCustomerLimit ?? ""}
              placeholder="Unlimited"
            />
          </div>
        </div>
        <p className={styles.hint}>
          A use only counts once an order is paid. Per-customer limits are matched by
          email.
        </p>

        <div className={styles.fieldRow}>
          <div className={styles.field}>
            <label htmlFor="startsOn">Starts on — optional</label>
            <input
              id="startsOn"
              name="startsOn"
              type="date"
              defaultValue={
                coupon?.startsAt ? toLondonDate(new Date(coupon.startsAt)) : ""
              }
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="endsOn">Ends on — optional</label>
            <input
              id="endsOn"
              name="endsOn"
              type="date"
              defaultValue={
                coupon?.endsAt ? addDays(toLondonDate(new Date(coupon.endsAt)), -1) : ""
              }
            />
          </div>
        </div>
        <p className={styles.hint}>
          UK time. The code works for the whole of the end date.
        </p>

        <div className={styles.field}>
          <label htmlFor="note">Internal note — optional</label>
          <input
            id="note"
            name="note"
            defaultValue={coupon?.note ?? ""}
            maxLength={200}
            placeholder="e.g. Instagram giveaway, Oct 2026"
          />
        </div>

        <label className={styles.radioLabel}>
          <input type="checkbox" name="active" defaultChecked={coupon?.active ?? true} />
          Active (untick to switch this code off immediately)
        </label>

        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <button type="submit" disabled={pending} className={styles.submit}>
          {pending ? "Saving…" : submitLabel}
        </button>
      </form>

      <aside className={styles.previewPanel}>
        <p className={styles.previewHeading}>Customer sees at checkout</p>
        <p className={styles.previewText}>
          <strong>{code || "CODE"}</strong> applied — {preview}
        </p>
      </aside>
    </div>
  );
}
