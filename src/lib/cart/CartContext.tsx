"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, type ReactNode } from "react";
import type { CartItem } from "@/types/cart";

const STORAGE_KEY = "mystery-packed-gifts-basket";

type CartAction =
  | { type: "add"; item: Omit<CartItem, "quantity">; quantity: number }
  | { type: "remove"; productId: string }
  | { type: "setQuantity"; productId: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "hydrate":
      return action.items;
    case "add": {
      const existing = state.find((line) => line.productId === action.item.productId);
      if (existing) {
        return state.map((line) =>
          line.productId === action.item.productId
            ? { ...line, quantity: line.quantity + action.quantity }
            : line,
        );
      }
      return [...state, { ...action.item, quantity: action.quantity }];
    }
    case "remove":
      return state.filter((line) => line.productId !== action.productId);
    case "setQuantity":
      if (action.quantity <= 0) {
        return state.filter((line) => line.productId !== action.productId);
      }
      return state.map((line) =>
        line.productId === action.productId ? { ...line, quantity: action.quantity } : line,
      );
    case "clear":
      // Bail out (same reference) if already empty — keeps a `clear()` called from a mount-only
      // effect (checkout success page) from re-triggering itself via a changed function identity.
      return state.length === 0 ? state : [];
    default:
      return state;
  }
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);

  // Hydrate from localStorage once on mount — SSR has no access to it, so the
  // initial reducer state must start empty to avoid a hydration mismatch.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) dispatch({ type: "hydrate", items: JSON.parse(raw) });
    } catch {
      // Corrupt or inaccessible storage — start with an empty basket.
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0);

    return {
      items,
      itemCount,
      subtotal,
      addItem: (item, quantity = 1) => dispatch({ type: "add", item, quantity }),
      removeItem: (productId) => dispatch({ type: "remove", productId }),
      setQuantity: (productId, quantity) => dispatch({ type: "setQuantity", productId, quantity }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [items]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider.");
  return context;
}
