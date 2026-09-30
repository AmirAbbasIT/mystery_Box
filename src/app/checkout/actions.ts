"use server";

import { validateCheckoutDetails } from "@/lib/checkout-details";
import {
  completePayPalCheckout,
  parseBasketRequest,
  startPayPalCheckout,
  type CheckoutResult,
} from "@/lib/orders";

/**
 * Called by the PayPal button's createOrder. The cart itself is client-only (localStorage — see
 * CartContext), so this is where basket contents and the /checkout form cross to the server. Only
 * productId and quantity are read from the basket — prices, stock and shipping are re-read from
 * the DB in startPayPalCheckout — and the customer/delivery details are re-validated here, since
 * the client's copies are just UI state that could be stale or tampered with.
 */
export async function createPayPalOrderAction(
  basket: unknown,
  customerDetails: unknown,
): Promise<CheckoutResult<{ paypalOrderId: string }>> {
  const quantities = parseBasketRequest(basket);
  if (!quantities) {
    return {
      ok: false,
      error: "Could not read your basket — please refresh and try again.",
    };
  }

  const validated = validateCheckoutDetails(customerDetails);
  if (!validated.ok) {
    return {
      ok: false,
      error: "Please check your details and delivery address, then try again.",
    };
  }

  try {
    return await startPayPalCheckout(quantities, validated.details);
  } catch (error) {
    console.error("PayPal order creation failed", error);
    return { ok: false, error: "We couldn't start PayPal checkout — please try again." };
  }
}

/** Called by the PayPal button's onApprove — captures the payment and records the Order. */
export async function capturePayPalOrderAction(
  paypalOrderId: unknown,
): Promise<CheckoutResult<{ orderId: string }>> {
  if (typeof paypalOrderId !== "string")
    return { ok: false, error: "Invalid payment reference." };

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
