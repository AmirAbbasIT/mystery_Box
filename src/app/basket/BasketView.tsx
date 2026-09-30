"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";
import { calculateShippingPence, type ShippingSettings } from "@/lib/shipping";
import styles from "./page.module.scss";

interface BasketViewProps {
  shipping: ShippingSettings;
}

export function BasketView({ shipping }: BasketViewProps) {
  const { items, subtotal, setQuantity, removeItem } = useCart();

  const subtotalPence = Math.round(subtotal * 100);
  const shippingPence = calculateShippingPence(subtotalPence, shipping);

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
                <Image
                  src={item.image}
                  alt=""
                  fill
                  sizes="72px"
                  className={styles.image}
                />
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
              <span className={styles.lineTotal}>
                {formatPrice(item.price * item.quantity)}
              </span>
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

      <div className={styles.summary}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span className={styles.subtotal}>{formatPrice(subtotal)}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>UK shipping</span>
          <span>{shippingPence === 0 ? "Free" : formatPrice(shippingPence / 100)}</span>
        </div>
        {shipping.freeThresholdPence !== null && shippingPence > 0 && (
          <p className={styles.linePrice}>
            Free shipping on orders over {formatPrice(shipping.freeThresholdPence / 100)}.
          </p>
        )}
        <div className={styles.summaryRow}>
          <span>Total</span>
          <span className={styles.subtotal}>
            {formatPrice(subtotal + shippingPence / 100)}
          </span>
        </div>
        <p className={styles.linePrice}>
          Next, enter your delivery details — then pay with PayPal or a debit/credit card.
        </p>

        <Button href="/checkout" size="lg" className={styles.checkoutButton}>
          Proceed to Checkout
        </Button>
        <Link href="/shop">Continue shopping</Link>
      </div>
    </div>
  );
}
