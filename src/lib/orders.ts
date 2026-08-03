import { getPrismaClient } from "@/lib/db/client";
import type Stripe from "stripe";

/**
 * Public write — turns a confirmed Stripe Checkout Session into a real Order/OrderItem/Customer
 * record. Only ever called from the checkout.session.completed webhook
 * (src/app/api/webhooks/stripe/route.ts), never from the checkout-creation flow, so a row existing
 * here always means Stripe actually confirmed payment. Idempotent against Stripe's at-least-once
 * webhook delivery via the unique stripeCheckoutSessionId — a duplicate delivery is a silent no-op.
 */
export async function fulfillCheckoutSession(
  session: Stripe.Checkout.Session,
  lineItems: Stripe.LineItem[],
): Promise<void> {
  const prisma = getPrismaClient();

  const existing = await prisma.order.findUnique({
    where: { stripeCheckoutSessionId: session.id },
  });
  if (existing) return;

  const email = session.customer_details?.email;
  if (!email) {
    throw new Error(`Checkout session ${session.id} completed with no customer email.`);
  }
  const name = session.customer_details?.name ?? "Guest";

  const shippingDetails = session.collected_information?.shipping_details;
  const address = shippingDetails?.address;

  const items = lineItems.map((line) => {
    const product =
      line.price && typeof line.price.product === "object" && !line.price.product.deleted
        ? line.price.product
        : null;
    const productId =
      product && typeof product.metadata?.productId === "string" ? product.metadata.productId : null;

    return {
      productId,
      productName: line.description ?? product?.name ?? "Item",
      unitPricePence: line.price?.unit_amount ?? 0,
      quantity: line.quantity ?? 1,
    };
  });

  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.upsert({
      where: { email },
      update: { name },
      create: { email, name },
    });

    await tx.order.create({
      data: {
        customerId: customer.id,
        status: "paid",
        totalPence: session.amount_total ?? 0,
        stripeCheckoutSessionId: session.id,
        shippingName: shippingDetails?.name ?? name,
        shippingLine1: address?.line1 ?? "",
        shippingLine2: address?.line2 ?? null,
        shippingCity: address?.city ?? "",
        shippingPostcode: address?.postal_code ?? "",
        shippingCountry: address?.country ?? "GB",
        items: {
          create: items.map(({ productId, productName, unitPricePence, quantity }) => ({
            productId,
            productName,
            unitPricePence,
            quantity,
          })),
        },
      },
    });

    for (const item of items) {
      if (!item.productId) continue;
      // updateMany (not update) so a since-deleted product is a silent no-op, not a thrown error —
      // stock reconciliation is best-effort, it must never block recording a confirmed payment.
      await tx.product.updateMany({
        where: { id: item.productId },
        data: { stock: { decrement: item.quantity } },
      });
    }
  });
}
