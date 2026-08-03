"use client";

import { useActionState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";
import { createCheckoutSessionAction } from "./actions";
import styles from "./page.module.scss";

export function BasketView() {
  const { items, subtotal, setQuantity, removeItem } = useCart();
  const [state, formAction, pending] = useActionState(createCheckoutSessionAction, {});

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Your basket is empty.</p>
        <Button href="/shop">Browse Mystery Boxes</Button>
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <div className={styles.lines}>
        {items.map((item) => (
          <div key={item.productId} className={styles.line}>
            <div className={styles.imageWrapper}>
              {item.image ? (
                <Image src={item.image} alt="" fill sizes="72px" className={styles.image} />
              ) : null}
            </div>

            <div className={styles.lineBody}>
              <span className={styles.lineName}>{item.name}</span>
              <span className={styles.linePrice}>{formatPrice(item.price)} each</span>
              <div className={styles.quantityRow}>
                <button
                  type="button"
                  className={styles.quantityButton}
                  aria-label={`Decrease quantity of ${item.name}`}
                  onClick={() => setQuantity(item.productId, item.quantity - 1)}
                >
                  −
                </button>
                <span className={styles.quantityValue}>{item.quantity}</span>
                <button
                  type="button"
                  className={styles.quantityButton}
                  aria-label={`Increase quantity of ${item.name}`}
                  onClick={() => setQuantity(item.productId, item.quantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <div className={styles.lineActions}>
              <span className={styles.lineTotal}>{formatPrice(item.price * item.quantity)}</span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => removeItem(item.productId)}
              >
                Remove
              </button>
            </div>
          </div>
        ))}
      </div>

      <form action={formAction} className={styles.summary}>
        <input type="hidden" name="items" value={JSON.stringify(items)} readOnly />

        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span className={styles.subtotal}>{formatPrice(subtotal)}</span>
        </div>
        <p className={styles.linePrice}>Shipping and any taxes are calculated at checkout.</p>

        {state.error && (
          <p className={styles.error} role="alert">
            {state.error}
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending} className={styles.checkoutButton}>
          {pending ? "Redirecting…" : "Proceed to Checkout"}
        </Button>
        <Link href="/shop">Continue shopping</Link>
      </form>
    </div>
  );
}
