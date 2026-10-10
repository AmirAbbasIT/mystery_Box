"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";
import type { CartItem } from "@/types/cart";
import styles from "./AddToBasketButton.module.scss";

interface AddToBasketButtonProps {
  item: Omit<CartItem, "quantity">;
  /** Defaults to "Add to Basket — £X". */
  label?: string;
}

/** Add-to-basket for anything that isn't a Shop product card (egg packs, wheel spins). */
export function AddToBasketButton({ item, label }: AddToBasketButtonProps) {
  const { addItem } = useCart();
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timeout = window.setTimeout(() => setAdded(false), 4000);
    return () => window.clearTimeout(timeout);
  }, [added]);

  return (
    <div className={styles.wrapper}>
      <Button
        size="lg"
        onClick={() => {
          addItem(item);
          setAdded(true);
        }}
      >
        {label ?? `Add to Basket — ${formatPrice(item.price)}`}
      </Button>
      <p className={styles.status} role="status" aria-live="polite">
        {added && (
          <>
            Added ✓ <Link href="/basket">View basket</Link>
          </>
        )}
      </p>
    </div>
  );
}
