"use client";

import { useEffect } from "react";
import { useCart } from "@/lib/cart/CartContext";

/** Renders nothing — just empties the basket once we've genuinely reached the success page. */
export function ClearCartOnSuccess() {
  const { clear } = useCart();

  useEffect(() => {
    clear();
  }, [clear]);

  return null;
}
