import "server-only";
import Stripe from "stripe";

const globalForStripe = globalThis as unknown as { stripe?: Stripe };

/**
 * Server-only Stripe client singleton — same globalThis-cache reasoning as
 * src/lib/db/client.ts's Prisma singleton (cheap to construct, but there's no reason to rebuild it
 * per request on a warm serverless instance).
 */
export function getStripeClient(): Stripe {
  if (globalForStripe.stripe) return globalForStripe.stripe;

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error("STRIPE_SECRET_KEY is missing — set it in .env.local (see .env.local.example).");
  }

  const client = new Stripe(secretKey);
  globalForStripe.stripe = client;
  return client;
}
