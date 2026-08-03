import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/db/client";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui";
import { ClearCartOnSuccess } from "./ClearCartOnSuccess";
import styles from "../checkout.module.scss";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your Mystery Packed Gifts order is confirmed.",
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CheckoutSuccessPage({ searchParams }: CheckoutSuccessPageProps) {
  const { session_id: sessionId } = await searchParams;

  const order = sessionId
    ? await getPrismaClient().order.findUnique({
        where: { stripeCheckoutSessionId: sessionId },
        include: { items: true },
      })
    : null;

  return (
    <div className={styles.page}>
      <ClearCartOnSuccess />
      <h1>Thank you for your order!</h1>

      {order ? (
        <>
          <p>Your payment is confirmed — a receipt is on its way to your email.</p>
          <ul className={styles.itemList}>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity} × {item.productName} —{" "}
                {formatPrice((item.unitPricePence * item.quantity) / 100)}
              </li>
            ))}
          </ul>
          <p className={styles.total}>Total: {formatPrice(order.totalPence / 100)}</p>
          <p>
            Shipping to: {order.shippingLine1}
            {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}, {order.shippingCity},{" "}
            {order.shippingPostcode}
          </p>
        </>
      ) : (
        <p>
          Thanks for your order — we&rsquo;re still confirming it with our payment provider. You&rsquo;ll
          receive a confirmation email shortly.
        </p>
      )}

      <Button href="/shop">Continue Shopping</Button>
    </div>
  );
}
