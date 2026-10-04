"use server";

import { validateCheckoutDetails } from "@/lib/checkout-details";
import { normaliseCouponCode, type CouponPricing } from "@/lib/coupons";
import { TOO_MANY_ATTEMPTS, isRateLimited, recordFailedAttempt } from "@/lib/rate-limit";
import {
  completePayPalCheckout,
  parseBasketRequest,
  previewCoupon,
  startPayPalCheckout,
  type CheckoutResult,
} from "@/lib/orders";
import { queueOrderEmail } from "@/lib/order-emails";

const NOT_VALID = "This code isn't valid.";

/**
 * Apply button. Checks the code against the DB-priced basket (and the email, once step 1 is done)
 * and returns the coupon's pricing so the summary can preview the discount. Nothing is saved —
 * a coupon is only used up when a paid order is recorded.
 */
export async function applyCouponAction(
  basket: unknown,
  rawCode: unknown,
  rawEmail: unknown,
): Promise<CheckoutResult<{ pricing: CouponPricing }>> {
  const quantities = parseBasketRequest(basket);
  if (!quantities) {
    return {
      ok: false,
      error: "Could not read your basket — please refresh and try again.",
    };
  }

  try {
    if (await isRateLimited("coupon")) return { ok: false, error: TOO_MANY_ATTEMPTS };

    const code = normaliseCouponCode(rawCode);
    if (!code) {
      await recordFailedAttempt("coupon");
      return { ok: false, error: NOT_VALID, couponRejected: true };
    }

    // Only known once step 1 is done; per-customer limits are always enforced at payment anyway.
    const email =
      typeof rawEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())
        ? rawEmail.trim().toLowerCase()
        : null;

    const result = await previewCoupon(quantities, code, email);
    if (!result.ok && result.unknownCoupon) await recordFailedAttempt("coupon");
    return result;
  } catch (error) {
    console.error("Coupon preview failed", error);
    return { ok: false, error: "We couldn't check that code — please try again." };
  }
}

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
  paymentSource: unknown,
  rawCouponCode: unknown,
): Promise<CheckoutResult<{ paypalOrderId: string }>> {
  if (paymentSource !== "paypal" && paymentSource !== "card") {
    return { ok: false, error: "Unsupported payment method." };
  }

  const couponCode = rawCouponCode == null ? null : normaliseCouponCode(rawCouponCode);
  if (rawCouponCode != null && !couponCode) {
    return { ok: false, error: NOT_VALID, couponRejected: true };
  }

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
    if (couponCode && (await isRateLimited("coupon"))) {
      return { ok: false, error: TOO_MANY_ATTEMPTS, couponRejected: true };
    }
    const result = await startPayPalCheckout(
      quantities,
      validated.details,
      paymentSource,
      couponCode,
    );
    if (!result.ok && result.unknownCoupon) await recordFailedAttempt("coupon");
    return result;
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
    const result = await completePayPalCheckout(paypalOrderId);
    if (result.ok && result.newlyPaid) queueOrderEmail(result.orderId, "confirmation");
    return result;
  } catch (error) {
    console.error(`PayPal capture failed for ${paypalOrderId}`, error);
    return {
      ok: false,
      error:
        "We couldn't confirm your payment. If you were charged, we'll still receive your order — contact us if you don't get a confirmation.",
    };
  }
}
