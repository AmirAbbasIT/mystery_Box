import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/db/client";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui";
import { ClearCartOnSuccess } from "./ClearCartOnSuccess";
import styles from "../checkout.module.scss";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your Mystery Packed Gifts order is confirmed.",
  robots: { index: false, follow: false },
};

interface CheckoutSuccessPageProps {
  searchParams: Promise<{ order?: string }>;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function CheckoutSuccessPage({
  searchParams,
}: CheckoutSuccessPageProps) {
  const { order: orderId } = await searchParams;

  const order =
    orderId && UUID_PATTERN.test(orderId)
      ? await getPrismaClient().order.findUnique({
          where: { id: orderId },
          include: { items: true },
        })
      : null;

  return (
    <div className={styles.page}>
      <ClearCartOnSuccess />
      <h1>Thank you for your order!</h1>

      {order ? (
        <>
          <p className={styles.orderNumber}>
            Your order number is <strong>{order.orderNumber}</strong>
          </p>
          <p>
            Keep it safe — you can check your order&rsquo;s progress any time on our{" "}
            <Link href="/track">Track your order</Link> page with this number and your
            email.
          </p>
          <p>
            {order.status === "payment_pending"
              ? "PayPal is still processing your payment — we'll start packing as soon as it clears."
              : "Your payment is confirmed — PayPal will email you a receipt."}
          </p>
          <ul className={styles.itemList}>
            {order.items.map((item) => (
              <li key={item.id}>
                {item.quantity} × {item.productName} —{" "}
                {formatPrice((item.unitPricePence * item.quantity) / 100)}
              </li>
            ))}
          </ul>
          {order.couponCode && order.discountPence + order.shippingDiscountPence > 0 && (
            <p>
              Discount ({order.couponCode}): −
              {formatPrice((order.discountPence + order.shippingDiscountPence) / 100)}
            </p>
          )}
          {order.shippingPence > 0 && (
            <p>Shipping: {formatPrice(order.shippingPence / 100)}</p>
          )}
          <p className={styles.total}>Total: {formatPrice(order.totalPence / 100)}</p>
        </>
      ) : (
        <p>
          Thanks for your order — we&rsquo;re still confirming it with PayPal.
          You&rsquo;ll receive a receipt from PayPal by email shortly.
        </p>
      )}

      <Button href="/shop">Continue Shopping</Button>
    </div>
  );
}
