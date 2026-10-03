"use client";

import { useState, type SubmitEvent } from "react";
import type { CartItem } from "@/types/cart";
import { describeCoupon, type CouponPricing } from "@/lib/coupons";
import { applyCouponAction } from "./actions";
import styles from "./page.module.scss";

interface PromoCodeBoxProps {
  items: CartItem[];
  /** Known once step 1 is filled in — lets Apply check "once per customer" limits early. */
  email: string | null;
  applied: CouponPricing | null;
  onChange: (coupon: CouponPricing | null) => void;
}

export function PromoCodeBox({ items, email, applied, onChange }: PromoCodeBoxProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  if (applied) {
    return (
      <div className={styles.promoApplied}>
        <span>
          <strong>{applied.code}</strong> applied — {describeCoupon(applied)}
        </span>
        <button
          type="button"
          className={styles.editButton}
          onClick={() => onChange(null)}
        >
          Remove
        </button>
      </div>
    );
  }

  const handleApply = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!code.trim() || checking) return;
    setChecking(true);
    setError(null);

    const result = await applyCouponAction(
      items.map(({ productId, quantity }) => ({ productId, quantity })),
      code,
      email,
    );

    setChecking(false);
    if (result.ok) {
      setCode("");
      onChange(result.pricing);
    } else {
      setError(result.error);
    }
  };

  return (
    <form className={styles.promoForm} onSubmit={handleApply}>
      <label htmlFor="promoCode">Have a promo code?</label>
      <div className={styles.promoRow}>
        <input
          id="promoCode"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          autoComplete="off"
          autoCapitalize="characters"
          maxLength={40}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "promoCode-error" : undefined}
        />
        <button
          type="submit"
          className={styles.promoButton}
          disabled={checking || !code.trim()}
        >
          {checking ? "Checking…" : "Apply"}
        </button>
      </div>
      {error && (
        <span id="promoCode-error" className={styles.fieldError} role="alert">
          {error}
        </span>
      )}
    </form>
  );
}
