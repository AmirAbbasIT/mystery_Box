"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button/Button";
import { formatPrice } from "@/lib/utils";
import styles from "./StickyAddToBasket.module.scss";

interface StickyAddToBasketProps {
  productName: string;
  price: number;
  onAdd?: () => void;
}

// Presentational only for Phase 1 — there's no basket/checkout backend yet,
// so "Add" just gives local confirmation feedback. Wire up to a real cart
// once the Phase 2 API layer exists.
export function StickyAddToBasket({ productName, price, onAdd }: StickyAddToBasketProps) {
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!added) return;
    const timeout = window.setTimeout(() => setAdded(false), 1800);
    return () => window.clearTimeout(timeout);
  }, [added]);

  return (
    <div className={styles.bar} role="region" aria-label={`Add ${productName} to basket`}>
      <div className={styles.info}>
        <span className={styles.name}>{productName}</span>
        <span className={styles.price}>{formatPrice(price)}</span>
      </div>
      <Button
        onClick={() => {
          onAdd?.();
          setAdded(true);
        }}
        aria-live="polite"
      >
        {added ? "Added ✓" : "Add to Basket"}
      </Button>
    </div>
  );
}
