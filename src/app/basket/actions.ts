"use server";

import { redirect } from "next/navigation";
import { getPrismaClient } from "@/lib/db/client";
import { getStripeClient } from "@/lib/stripe";
import type { CartItem } from "@/types/cart";

export interface CheckoutFormState {
  error?: string;
}

/**
 * Creates a Stripe Checkout Session and redirects to Stripe's hosted payment page.
 *
 * The cart itself is client-only (localStorage — see CartContext), so this is the one point
 * where basket contents cross to the server; prices/stock/active are always re-read from the DB
 * here, never trusted from the client's cart snapshot, since that's just a UI convenience copy
 * that could be stale or tampered with. The actual Order row isn't created here — that only
 * happens once Stripe confirms payment via the checkout.session.completed webhook (see
 * src/app/api/webhooks/stripe/route.ts) so a real DB order always means real confirmed payment.
 */
export async function createCheckoutSessionAction(
  _prevState: CheckoutFormState,
  formData: FormData,
): Promise<CheckoutFormState> {
  let items: CartItem[];
  try {
    const raw = JSON.parse(String(formData.get("items") ?? "[]"));
    items = Array.isArray(raw) ? raw : [];
  } catch {
    return { error: "Could not read your basket — please refresh and try again." };
  }

  if (items.length === 0) {
    return { error: "Your basket is empty." };
  }

  const prisma = getPrismaClient();
  const products = await prisma.product.findMany({
    where: { id: { in: items.map((item) => item.productId) } },
  });
  const productById = new Map(products.map((product) => [product.id, product]));

  const lineItems = [];
  for (const item of items) {
    const product = productById.get(item.productId);
    if (!product || !product.active) {
      return { error: `"${item.name}" is no longer available — please remove it from your basket.` };
    }
    if (item.quantity > product.stock) {
      return {
        error: `Only ${product.stock} of "${product.name}" left in stock — please adjust the quantity.`,
      };
    }

    lineItems.push({
      quantity: item.quantity,
      price_data: {
        currency: "gbp",
        unit_amount: product.pricePence,
        product_data: {
          name: product.name,
          metadata: { productId: product.id },
        },
      },
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  let sessionUrl: string | null;
  try {
    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      shipping_address_collection: { allowed_countries: ["GB"] },
      success_url: `${siteUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/checkout/cancel`,
    });
    sessionUrl = session.url;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Failed to start checkout." };
  }

  if (!sessionUrl) {
    return { error: "Failed to start checkout — please try again." };
  }

  redirect(sessionUrl);
}
