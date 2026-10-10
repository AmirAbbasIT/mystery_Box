"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import { cartKey, type CartItem } from "@/types/cart";

const STORAGE_KEY = "mystery-picked-gifts-basket";
/** Key used before the "Mystery Picked Gifts" rename — read once so existing baskets survive. */
const LEGACY_STORAGE_KEY = "mystery-packed-gifts-basket";

type CartAction =
  | { type: "add"; item: Omit<CartItem, "quantity">; quantity: number }
  | { type: "remove"; key: string }
  | { type: "setQuantity"; key: string; quantity: number }
  | { type: "clear" }
  | { type: "hydrate"; items: CartItem[] };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case "hydrate":
      return action.items;
    case "add": {
      const key = cartKey(action.item);
      const existing = state.find((line) => cartKey(line) === key);
      if (existing) {
        return state.map((line) =>
          cartKey(line) === key
            ? { ...line, quantity: line.quantity + action.quantity }
            : line,
        );
      }
      return [...state, { ...action.item, quantity: action.quantity }];
    }
    case "remove":
      return state.filter((line) => cartKey(line) !== action.key);
    case "setQuantity":
      if (action.quantity <= 0) {
        return state.filter((line) => cartKey(line) !== action.key);
      }
      return state.map((line) =>
        cartKey(line) === action.key ? { ...line, quantity: action.quantity } : line,
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
  /** False until the saved basket has been read from localStorage (first client render). */
  isReady: boolean;
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  /** `key` is cartKey(item). */
  removeItem: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
}

interface CartState {
  items: CartItem[];
  isReady: boolean;
}

/** Tracks whether localStorage has been read yet alongside the lines themselves. */
function cartStateReducer(state: CartState, action: CartAction): CartState {
  if (action.type === "hydrate") return { items: action.items, isReady: true };
  const items = cartReducer(state.items, action);
  return items === state.items ? state : { ...state, items };
}

/**
 * Saved baskets from before egg packs/wheel spins existed have { productId } lines — convert them
 * so nobody's basket is lost; drop anything unrecognisable.
 */
function normaliseSavedLines(raw: unknown[]): CartItem[] {
  const lines: CartItem[] = [];
  for (const entry of raw) {
    if (typeof entry !== "object" || entry === null) continue;
    const line = entry as Record<string, unknown>;
    const kind = line.kind === "prize_pool" ? "prize_pool" : "product";
    const id = typeof line.id === "string" ? line.id : line.productId;
    if (typeof id !== "string" || typeof line.name !== "string") continue;
    if (typeof line.price !== "number" || typeof line.quantity !== "number") continue;
    lines.push({
      kind,
      id,
      name: line.name,
      price: line.price,
      image: typeof line.image === "string" ? line.image : undefined,
      quantity: line.quantity,
    });
  }
  return lines;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [{ items, isReady }, dispatch] = useReducer(cartStateReducer, {
    items: [],
    isReady: false,
  });

  // Hydrate from localStorage once on mount — SSR has no access to it, so the
  // initial reducer state must start empty to avoid a hydration mismatch.
  useEffect(() => {
    let saved: CartItem[] = [];
    try {
      const raw =
        window.localStorage.getItem(STORAGE_KEY) ??
        window.localStorage.getItem(LEGACY_STORAGE_KEY);
      window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      if (Array.isArray(parsed)) saved = normaliseSavedLines(parsed);
    } catch {
      // Corrupt or inaccessible storage — start with an empty basket.
    }
    dispatch({ type: "hydrate", items: saved });
  }, []);

  useEffect(() => {
    // Not before hydration — that would overwrite the saved basket with the empty initial state.
    if (!isReady) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Storage full or blocked — the basket still works for this visit.
    }
  }, [items, isReady]);

  const value = useMemo<CartContextValue>(() => {
    const itemCount = items.reduce((sum, line) => sum + line.quantity, 0);
    const subtotal = items.reduce((sum, line) => sum + line.price * line.quantity, 0);

    return {
      items,
      isReady,
      itemCount,
      subtotal,
      addItem: (item, quantity = 1) => dispatch({ type: "add", item, quantity }),
      removeItem: (key) => dispatch({ type: "remove", key }),
      setQuantity: (key, quantity) => dispatch({ type: "setQuantity", key, quantity }),
      clear: () => dispatch({ type: "clear" }),
    };
  }, [items, isReady]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider.");
  return context;
}
