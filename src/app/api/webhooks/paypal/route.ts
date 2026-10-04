import { verifyPayPalWebhook } from "@/lib/paypal";
import { completePayPalCheckout, updateOrderByCaptureId } from "@/lib/orders";
import { queueOrderEmail } from "@/lib/order-emails";

interface PayPalWebhookEvent {
  event_type: string;
  resource: {
    id: string;
    links?: Array<{ rel: string; href: string }>;
    supplementary_data?: { related_ids?: { order_id?: string } };
  };
}

/** Refund/reversal resources are refund objects; their "up" link points at the capture. */
function captureIdFromRefund(resource: PayPalWebhookEvent["resource"]): string | null {
  const up = resource.links?.find((link) => link.rel === "up")?.href;
  return up?.match(/\/captures\/([A-Z0-9]+)/)?.[1] ?? null;
}

/**
 * PayPal webhook. The browser's onApprove normally captures and records the order; this is the
 * safety net for when it never runs (tab closed right after approving) plus the only source of
 * later lifecycle changes: pending captures settling, denials, refunds and chargebacks.
 * Every event is signature-verified with PayPal before anything is read from it. Non-2xx makes
 * PayPal retry, so that's reserved for thrown (transient) errors — a checkout we deliberately
 * refused (e.g. non-UK address) returns 200 so it isn't retried forever.
 */
export async function POST(request: Request): Promise<Response> {
  const rawBody = await request.text();

  let verified = false;
  try {
    verified = await verifyPayPalWebhook(request.headers, rawBody);
  } catch (error) {
    console.error("PayPal webhook verification call failed", error);
    return Response.json({ error: "Verification unavailable." }, { status: 500 });
  }
  if (!verified) {
    return Response.json({ error: "Invalid signature." }, { status: 400 });
  }

  const event = JSON.parse(rawBody) as PayPalWebhookEvent;

  try {
    switch (event.event_type) {
      case "CHECKOUT.ORDER.APPROVED": {
        const result = await completePayPalCheckout(event.resource.id);
        if (result.ok && result.newlyPaid)
          queueOrderEmail(result.orderId, "confirmation");
        if (!result.ok)
          console.warn(
            `Webhook could not complete ${event.resource.id}: ${result.error}`,
          );
        break;
      }
      case "PAYMENT.CAPTURE.COMPLETED": {
        const orderId = event.resource.supplementary_data?.related_ids?.order_id;
        if (orderId) await completePayPalCheckout(orderId);
        // Covers captures that were pending and have now settled; already-confirmed orders are
        // skipped by sendOrderEmail.
        const settledOrderId = await updateOrderByCaptureId(event.resource.id, "paid");
        if (settledOrderId) queueOrderEmail(settledOrderId, "confirmation");
        break;
      }
      case "PAYMENT.CAPTURE.DENIED":
        await updateOrderByCaptureId(event.resource.id, "cancelled");
        break;
      case "PAYMENT.CAPTURE.REFUNDED":
      case "PAYMENT.CAPTURE.REVERSED": {
        const captureId = captureIdFromRefund(event.resource);
        if (captureId) await updateOrderByCaptureId(captureId, "refunded");
        break;
      }
    }
  } catch (error) {
    console.error(`PayPal webhook ${event.event_type} handling failed`, error);
    return Response.json({ error: "Handler failed." }, { status: 500 });
  }

  return Response.json({ received: true });
}
