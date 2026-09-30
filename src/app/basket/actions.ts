"use server";

import {
  completePayPalCheckout,
  parseBasketRequest,
  startPayPalCheckout,
  type CheckoutResult,
} from "@/lib/orders";

/**
 * Called by the PayPal button's createOrder. The cart itself is client-only (localStorage — see
 * CartContext), so this is where basket contents cross to the server — and only productId and
 * quantity are read from it. Prices, stock and shipping are re-read from the DB in
 * startPayPalCheckout, since the client's cart is just a UI copy that could be stale or tampered.
 */
export async function createPayPalOrderAction(
  basket: unknown,
): Promise<CheckoutResult<{ paypalOrderId: string }>> {
  const quantities = parseBasketRequest(basket);
  if (!quantities) {
    return { ok: false, error: "Could not read your basket — please refresh and try again." };
  }

  try {
    return await startPayPalCheckout(quantities);
  } catch (error) {
    console.error("PayPal order creation failed", error);
    return { ok: false, error: "We couldn't start PayPal checkout — please try again." };
  }
}

/** Called by the PayPal button's onApprove — captures the payment and records the Order. */
export async function capturePayPalOrderAction(
  paypalOrderId: unknown,
): Promise<CheckoutResult<{ orderId: string }>> {
  if (typeof paypalOrderId !== "string") return { ok: false, error: "Invalid payment reference." };

  try {
    return await completePayPalCheckout(paypalOrderId);
  } catch (error) {
    console.error(`PayPal capture failed for ${paypalOrderId}`, error);
    return {
      ok: false,
      error:
        "We couldn't confirm your payment. If you were charged, we'll still receive your order — contact us if you don't get a confirmation.",
    };
  }
}
