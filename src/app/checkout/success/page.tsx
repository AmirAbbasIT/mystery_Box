import type { Metadata } from "next";
import { getPrismaClient } from "@/lib/db/client";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Button } from "@/components/ui";
import { WheelSpinLoader } from "@/components/animations";
import type { PrizeItem, PrizeRarity } from "@/types";
import { ClearCartOnSuccess } from "./ClearCartOnSuccess";
import styles from "../checkout.module.scss";

export const metadata: Metadata = {
  title: "Order Confirmed",
  description: "Your Mystery Picked Gifts order is confirmed.",
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
          include: {
            items: {
              include: {
                prizes: { orderBy: { position: "asc" } },
                prizePool: { include: { prizeItems: { orderBy: { sortOrder: "asc" } } } },
              },
            },
          },
        })
      : null;

  // Wheel spins are revealed here (drawn server-side at payment — the wheel just lands on the
  // result). Egg prizes are deliberately not shown: they're a surprise inside the physical egg.
  const wheelReveals = (order?.items ?? [])
    .filter((item) => item.itemType === "wheel_spin" && item.prizes.length > 0)
    .map((item) => {
      const segments: PrizeItem[] = (item.prizePool?.prizeItems ?? []).map((prize) => ({
        id: prize.id,
        label: prize.label,
        rarity: prize.rarity as PrizeRarity,
        weight: prize.weight.toNumber(),
      }));
      // Match by id, falling back to label if the pool's items were re-saved since payment.
      const winners = item.prizes.map(
        (won) =>
          segments.find((segment) => segment.id === won.prizeItemId)?.id ??
          segments.find((segment) => segment.label === won.label)?.id,
      );
      return {
        item,
        segments,
        winners: winners.every(Boolean) ? (winners as string[]) : null,
      };
    });
  const hasEggs = order?.items.some((item) => item.itemType === "egg_pack") ?? false;

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
            <Link href={`/track?order=${encodeURIComponent(order.orderNumber)}`}>
              Track your order
            </Link>{" "}
            page with this number and your email.
          </p>
          <p>
            {order.status === "payment_pending"
              ? "PayPal is still processing your payment — we'll start packing as soon as it clears."
              : "Your payment is confirmed — your order confirmation is on its way by email."}
          </p>

          {wheelReveals.map(({ item, segments, winners }) => (
            <section key={item.id} className={styles.reveal}>
              <h2>Spin to reveal your prize{item.prizes.length > 1 ? "s" : ""}!</h2>
              <p>
                {item.prizes.length > 1
                  ? `You've got ${item.prizes.length} spins — `
                  : ""}
                your result was drawn securely when you paid. Press SPIN to see it.
              </p>
              {winners && <WheelSpinLoader prizes={segments} winners={winners} />}
              <details className={styles.revealList} open={!winners}>
                <summary>Just show me</summary>
                <ul>
                  {item.prizes.map((prize) => (
                    <li key={prize.id}>
                      Spin {prize.position}: <strong>{prize.label}</strong>
                    </li>
                  ))}
                </ul>
              </details>
            </section>
          ))}

          {hasEggs && (
            <p className={styles.eggNote}>
              🥚 Your mystery eggs will be hand-packed with their prizes inside — the
              surprise is yours to crack open when they arrive!
            </p>
          )}
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
