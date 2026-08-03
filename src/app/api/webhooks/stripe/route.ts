import type Stripe from "stripe";
import { getStripeClient } from "@/lib/stripe";
import { fulfillCheckoutSession } from "@/lib/orders";

/**
 * Stripe webhook — the only place an Order is ever created (see src/lib/orders.ts). Route Handlers
 * don't parse the request body, which is required here: signature verification needs the exact
 * raw bytes Stripe signed, not a re-serialized JSON.parse/stringify round-trip.
 */
export async function POST(request: Request): Promise<Response> {
  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !webhookSecret) {
    return Response.json({ error: "Webhook not configured." }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Invalid signature.";
    return Response.json({ error: message }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
        expand: ["data.price.product"],
      });
      await fulfillCheckoutSession(session, lineItems.data);
    } catch (error) {
      // Non-2xx tells Stripe to retry delivery — correct here, since this is either a transient
      // DB/network error or a bug, neither of which should be silently swallowed.
      const message = error instanceof Error ? error.message : "Failed to fulfil checkout session.";
      return Response.json({ error: message }, { status: 500 });
    }
  }

  return Response.json({ received: true });
}
