"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import type { CartItem } from "@/types/cart";
import type { CheckoutDetails } from "@/lib/checkout-details";
import { capturePayPalOrderAction, createPayPalOrderAction } from "./actions";
import styles from "./page.module.scss";

interface PayPalButtonsInstance {
  render: (container: HTMLElement) => Promise<void>;
  close: () => Promise<void>;
}

interface PayPalNamespace {
  Buttons: (options: {
    style?: Record<string, string | number>;
    createOrder: () => Promise<string>;
    onApprove: (
      data: { orderID: string },
      actions: { restart: () => Promise<void> },
    ) => Promise<void>;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
  }) => PayPalButtonsInstance;
}

declare global {
  interface Window {
    paypal?: PayPalNamespace;
  }
}

interface PayPalCheckoutProps {
  clientId: string;
  items: CartItem[];
  details: CheckoutDetails;
}

export function PayPalCheckout({ clientId, items, details }: PayPalCheckoutProps) {
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef(items);
  const detailsRef = useRef(details);
  const [sdkReady, setSdkReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    itemsRef.current = items;
    detailsRef.current = details;
  }, [items, details]);

  useEffect(() => {
    if (!sdkReady || !window.paypal || !containerRef.current) return;

    const buttons = window.paypal.Buttons({
      style: { layout: "vertical", shape: "pill", label: "pay" },
      createOrder: async () => {
        setError(null);
        const result = await createPayPalOrderAction(
          itemsRef.current.map(({ productId, quantity }) => ({ productId, quantity })),
          detailsRef.current,
        );
        if (!result.ok) {
          setError(result.error);
          throw new Error(result.error);
        }
        return result.paypalOrderId;
      },
      onApprove: async (data, actions) => {
        setConfirming(true);
        const result = await capturePayPalOrderAction(data.orderID);
        if (result.ok) {
          router.push(`/checkout/success?order=${result.orderId}`);
          return;
        }
        setConfirming(false);
        if (result.retry) {
          setError(`${result.error} Please choose another way to pay.`);
          return actions.restart();
        }
        setError(result.error);
      },
      onCancel: () => setError("Payment cancelled — your basket is still here."),
      onError: () => {
        setConfirming(false);
        setError((current) => current ?? "PayPal ran into a problem — please try again.");
      },
    });

    buttons.render(containerRef.current).catch(() => {
      // Render rejects if the container unmounted first (e.g. basket emptied) — nothing to do.
    });

    return () => {
      buttons.close().catch(() => {});
    };
  }, [sdkReady, router]);

  const sdkUrl = `https://www.paypal.com/sdk/js?${new URLSearchParams({
    "client-id": clientId,
    currency: "GBP",
    intent: "capture",
    components: "buttons",
  })}`;

  return (
    <div className={styles.paypal}>
      <Script
        src={sdkUrl}
        strategy="afterInteractive"
        onReady={() => setSdkReady(true)}
      />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {confirming && <p role="status">Confirming your payment…</p>}

      <div ref={containerRef} aria-busy={!sdkReady || confirming} hidden={confirming} />
      {!sdkReady && <p className={styles.linePrice}>Loading secure PayPal checkout…</p>}
    </div>
  );
}
