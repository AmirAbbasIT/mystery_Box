"use server";

import { normaliseOrderNumber } from "@/lib/order-number";
import { findTrackedOrder, type TrackedOrder } from "@/lib/order-tracking";
import { TOO_MANY_ATTEMPTS, isRateLimited, recordFailedAttempt } from "@/lib/rate-limit";

export type TrackOrderResult =
  { ok: true; order: TrackedOrder } | { ok: false; error: string };

// Same message whether the number doesn't exist or the email doesn't match, so the form can't be
// used to find out which order numbers are real.
const NOT_FOUND =
  "We couldn't find an order with those details. Check the order number and use the email you entered at checkout.";

/** Server Action (POST), so the email never ends up in a URL, browser history or server logs. */
export async function trackOrderAction(
  rawOrderNumber: unknown,
  rawEmail: unknown,
): Promise<TrackOrderResult> {
  try {
    if (await isRateLimited("track")) return { ok: false, error: TOO_MANY_ATTEMPTS };

    const orderNumber = normaliseOrderNumber(rawOrderNumber);
    const email =
      typeof rawEmail === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(rawEmail.trim())
        ? rawEmail.trim().toLowerCase()
        : null;

    const order =
      orderNumber && email ? await findTrackedOrder(orderNumber, email) : null;
    if (!order) {
      await recordFailedAttempt("track");
      return { ok: false, error: NOT_FOUND };
    }
    return { ok: true, order };
  } catch (error) {
    console.error("Order tracking lookup failed", error);
    return { ok: false, error: "We couldn't look that up right now — please try again." };
  }
}
