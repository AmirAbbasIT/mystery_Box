"use client";

import { useEffect, useRef, useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui";
import type { CartItem } from "@/types/cart";
import type { BillingAddress, CheckoutDetails } from "@/lib/checkout-details";
import { capturePayPalOrderAction, createPayPalOrderAction } from "./actions";
import styles from "./page.module.scss";

type PaymentSource = "paypal" | "card";

interface PayPalButtonsInstance {
  render: (container: HTMLElement) => Promise<void>;
  close: () => Promise<void>;
  isEligible: () => boolean;
}

interface PayPalCardField {
  render: (container: HTMLElement) => Promise<void>;
  close?: () => Promise<void>;
}

interface PayPalCardFieldsInstance {
  isEligible: () => boolean;
  NumberField: () => PayPalCardField;
  ExpiryField: () => PayPalCardField;
  CVVField: () => PayPalCardField;
  submit: (options: {
    billingAddress: {
      addressLine1: string;
      addressLine2?: string;
      adminArea2: string;
      postalCode: string;
      countryCode: string;
    };
  }) => Promise<void>;
}

interface PayPalNamespace {
  FUNDING: { PAYPAL: string; PAYLATER: string };
  Buttons: (options: {
    fundingSource?: string;
    style?: Record<string, string | number>;
    createOrder: () => Promise<string>;
    onApprove: (
      data: { orderID: string },
      actions: { restart: () => Promise<void> },
    ) => Promise<void>;
    onCancel?: () => void;
    onError?: (error: unknown) => void;
  }) => PayPalButtonsInstance;
  CardFields: (options: {
    createOrder: () => Promise<string>;
    onApprove: (data: { orderID: string }) => Promise<void>;
    onError?: (error: unknown) => void;
    style?: Record<string, Record<string, string>>;
  }) => PayPalCardFieldsInstance;
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
  billing: BillingAddress;
  /** e.g. "£22.00" — shown on the card Pay button. */
  totalLabel: string;
  /** Applied promo code, re-validated server-side when the order is created and before capture. */
  couponCode: string | null;
}

/**
 * Payment step. With Advanced card payments enabled on the PayPal account, cards go through Card
 * Fields (number/expiry/CVV only — billing comes from our own form) and a PayPal-only button sits
 * alongside. Otherwise it falls back to PayPal's standard buttons, whose card option collects its
 * own billing details.
 */
export function PayPalCheckout({
  clientId,
  items,
  details,
  billing,
  totalLabel,
  couponCode,
}: PayPalCheckoutProps) {
  const router = useRouter();
  const buttonsRef = useRef<HTMLDivElement>(null);
  const numberRef = useRef<HTMLDivElement>(null);
  const expiryRef = useRef<HTMLDivElement>(null);
  const cvvRef = useRef<HTMLDivElement>(null);
  const cardFieldsRef = useRef<PayPalCardFieldsInstance | null>(null);
  const itemsRef = useRef(items);
  const detailsRef = useRef(details);
  const couponCodeRef = useRef(couponCode);
  const [mode, setMode] = useState<"loading" | "card-fields" | "buttons-only">("loading");
  const [error, setError] = useState<string | null>(null);
  const [cardPaying, setCardPaying] = useState(false);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    itemsRef.current = items;
    detailsRef.current = details;
    couponCodeRef.current = couponCode;
  }, [items, details, couponCode]);

  const createOrderFor = (source: PaymentSource) => async () => {
    setError(null);
    const result = await createPayPalOrderAction(
      itemsRef.current.map(({ productId, quantity }) => ({ productId, quantity })),
      detailsRef.current,
      source,
      couponCodeRef.current,
    );
    if (!result.ok) {
      setError(result.error);
      throw new Error(result.error);
    }
    return result.paypalOrderId;
  };

  const captureAndFinish = async (orderId: string) => {
    setConfirming(true);
    const result = await capturePayPalOrderAction(orderId);
    if (result.ok) {
      router.push(`/checkout/success?order=${result.orderId}`);
      return null;
    }
    setConfirming(false);
    setCardPaying(false);
    setError(result.error);
    return result;
  };

  const handleSdkReady = () => {
    const paypal = window.paypal;
    if (!paypal) return;

    const cardFields = paypal.CardFields({
      createOrder: createOrderFor("card"),
      onApprove: async (data) => {
        await captureAndFinish(data.orderID);
      },
      onError: () => {
        setCardPaying(false);
        setError(
          (current) =>
            current ??
            "Your card payment didn't go through — please check your card details and try again.",
        );
      },
      style: {
        input: { "font-size": "16px", padding: "12px" },
      },
    });

    cardFieldsRef.current = cardFields.isEligible() ? cardFields : null;
    setMode(cardFieldsRef.current ? "card-fields" : "buttons-only");
  };

  useEffect(() => {
    const paypal = window.paypal;
    const buttonsContainer = buttonsRef.current;
    if (mode === "loading" || !paypal || !buttonsContainer) return;

    const closers: Array<() => Promise<void> | undefined> = [];

    const makeButtons = (fundingSource?: string) =>
      paypal.Buttons({
        fundingSource,
        style: { layout: "vertical", shape: "pill", label: "pay" },
        createOrder: createOrderFor("paypal"),
        onApprove: async (data, actions) => {
          const failure = await captureAndFinish(data.orderID);
          if (failure?.retry) {
            setError(`${failure.error} Please choose another way to pay.`);
            return actions.restart();
          }
        },
        onCancel: () => setError("Payment cancelled — nothing was charged."),
        onError: () => {
          setConfirming(false);
          setError(
            (current) => current ?? "PayPal ran into a problem — please try again.",
          );
        },
      });

    const renderInto = (buttons: PayPalButtonsInstance) => {
      if (!buttons.isEligible()) return;
      const slot = document.createElement("div");
      buttonsContainer.appendChild(slot);
      buttons.render(slot).catch(() => {});
      closers.push(() => buttons.close());
    };

    if (mode === "card-fields") {
      const cardFields = cardFieldsRef.current;
      const fields: Array<[PayPalCardField, HTMLDivElement | null]> = cardFields
        ? [
            [cardFields.NumberField(), numberRef.current],
            [cardFields.ExpiryField(), expiryRef.current],
            [cardFields.CVVField(), cvvRef.current],
          ]
        : [];
      for (const [field, container] of fields) {
        if (!container) continue;
        field.render(container).catch(() => {});
        closers.push(() => field.close?.());
      }
      renderInto(makeButtons(paypal.FUNDING.PAYPAL));
      renderInto(makeButtons(paypal.FUNDING.PAYLATER));
    } else {
      renderInto(makeButtons());
    }

    return () => {
      for (const close of closers) close()?.catch(() => {});
      buttonsContainer.replaceChildren();
      for (const ref of [numberRef, expiryRef, cvvRef]) ref.current?.replaceChildren();
    };
    // createOrderFor/captureAndFinish only read refs and stable setters — re-rendering PayPal's
    // iframes on every render would reset what the buyer typed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const payByCard = () => {
    const cardFields = cardFieldsRef.current;
    if (!cardFields) return;
    setError(null);
    setCardPaying(true);
    cardFields
      .submit({
        billingAddress: {
          addressLine1: billing.line1,
          ...(billing.line2 ? { addressLine2: billing.line2 } : {}),
          adminArea2: billing.city,
          postalCode: billing.postcode,
          countryCode: "GB",
        },
      })
      .catch(() => {
        setCardPaying(false);
        setError(
          (current) => current ?? "Please check your card number, expiry date and CVV.",
        );
      });
  };

  const sdkUrl = `https://www.paypal.com/sdk/js?${new URLSearchParams({
    "client-id": clientId,
    currency: "GBP",
    intent: "capture",
    components: "buttons,card-fields",
  })}`;

  return (
    <div className={styles.paypal}>
      <Script src={sdkUrl} strategy="afterInteractive" onReady={handleSdkReady} />

      {error && (
        <p className={styles.error} role="alert">
          {error}
        </p>
      )}
      {confirming && <p role="status">Confirming your payment…</p>}

      <div
        hidden={confirming}
        aria-busy={mode === "loading"}
        className={styles.paymentMethods}
      >
        {mode === "loading" && (
          <p className={styles.linePrice}>Loading secure payment options…</p>
        )}

        {mode === "card-fields" && (
          <div className={styles.cardForm}>
            <h3>Pay by debit or credit card</h3>
            <div className={styles.cardField}>
              <span>Card number</span>
              <div ref={numberRef} />
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.cardField}>
                <span>Expiry date</span>
                <div ref={expiryRef} />
              </div>
              <div className={styles.cardField}>
                <span>Security code (CVV)</span>
                <div ref={cvvRef} />
              </div>
            </div>
            <Button size="lg" onClick={payByCard} disabled={cardPaying || confirming}>
              {cardPaying ? "Processing…" : `Pay ${totalLabel}`}
            </Button>
            <p className={styles.orDivider}>or</p>
          </div>
        )}

        <div ref={buttonsRef} />
      </div>
    </div>
  );
}
