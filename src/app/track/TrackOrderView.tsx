"use client";

import { useState, type SubmitEvent } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { cx, formatPrice } from "@/lib/utils";
import {
  ORDER_STATUS_DESCRIPTIONS,
  ORDER_STATUS_LABELS,
  ORDER_TIMELINE,
  timelineIndex,
} from "@/lib/order-status";
import type { TrackedOrder } from "@/lib/order-tracking";
import { trackOrderAction } from "./actions";
import styles from "./page.module.scss";

const dateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "Europe/London",
});

function TrackedOrderCard({
  order,
  onReset,
}: {
  order: TrackedOrder;
  onReset: () => void;
}) {
  const currentStep = timelineIndex(order.status);
  const isClosed = order.status === "cancelled" || order.status === "refunded";

  return (
    <section className={styles.card} aria-live="polite">
      <div className={styles.cardHeader}>
        <p className={styles.orderNumber}>{order.orderNumber}</p>
        <p className={styles.muted}>
          Placed {dateFormatter.format(new Date(order.placedAt))}
        </p>
      </div>

      <h2>{ORDER_STATUS_LABELS[order.status]}</h2>
      <p>{ORDER_STATUS_DESCRIPTIONS[order.status]}</p>

      {!isClosed && (
        <ol className={styles.timeline}>
          {ORDER_TIMELINE.map((step, index) => (
            <li
              key={step}
              className={cx(
                styles.step,
                index <= currentStep && styles.stepDone,
                index === currentStep && styles.stepCurrent,
              )}
              aria-current={index === currentStep ? "step" : undefined}
            >
              <span className={styles.dot} aria-hidden="true" />
              <span>{ORDER_STATUS_LABELS[step]}</span>
              {step === "dispatched" && order.dispatchedAt && (
                <span className={styles.muted}>
                  {dateFormatter.format(new Date(order.dispatchedAt))}
                </span>
              )}
              {step === "delivered" && order.deliveredAt && (
                <span className={styles.muted}>
                  {dateFormatter.format(new Date(order.deliveredAt))}
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {order.carrierName &&
        (order.status === "dispatched" || order.status === "delivered") && (
          <div className={styles.tracking}>
            <p>
              Sent with <strong>{order.carrierName}</strong>
              {order.trackingNumber ? (
                <>
                  {" "}
                  — tracking number{" "}
                  <strong className={styles.code}>{order.trackingNumber}</strong>
                </>
              ) : (
                " (untracked service)"
              )}
            </p>
            {order.trackingUrl && (
              <Button href={order.trackingUrl} external>
                Track with {order.carrierName}
              </Button>
            )}
          </div>
        )}

      <div className={styles.details}>
        <p>
          Delivering to {order.recipientFirstName}, {order.postcodeHint}
        </p>
        <ul>
          {order.items.map((item, index) => (
            <li key={`${item.name}-${index}`}>
              {item.quantity} × {item.name}
            </li>
          ))}
        </ul>
        <p>Total paid: {formatPrice(order.totalPence / 100)}</p>
      </div>

      <button type="button" className={styles.linkButton} onClick={onReset}>
        Look up another order
      </button>
    </section>
  );
}

export function TrackOrderView() {
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const handleSubmit = async (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setChecking(true);
    setError(null);

    const result = await trackOrderAction(form.get("orderNumber"), form.get("email"));
    setChecking(false);
    if (result.ok) setOrder(result.order);
    else setError(result.error);
  };

  if (order) return <TrackedOrderCard order={order} onReset={() => setOrder(null)} />;

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor="orderNumber">Order number</label>
        <input
          id="orderNumber"
          name="orderNumber"
          placeholder="e.g. MPG-7K3Q9X"
          autoComplete="off"
          autoCapitalize="characters"
          required
        />
      </div>
      <div className={styles.field}>
        <label htmlFor="email">Email used at checkout</label>
        <input id="email" name="email" type="email" autoComplete="email" required />
      </div>

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={checking}>
        {checking ? "Checking…" : "Track order"}
      </Button>

      <p className={styles.muted}>
        Your order number is shown on the order confirmation page after you pay.
        Can&rsquo;t find it? <Link href="/about">Get in touch</Link> and we&rsquo;ll help.
      </p>
    </form>
  );
}
