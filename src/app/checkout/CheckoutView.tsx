"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";
import { calculateShippingPence, type ShippingSettings } from "@/lib/shipping";
import {
  validateCheckoutDetails,
  type CheckoutDetails,
  type CheckoutField,
} from "@/lib/checkout-details";
import { PayPalCheckout } from "./PayPalCheckout";
import styles from "./page.module.scss";

interface CheckoutViewProps {
  paypalClientId: string | null;
  shipping: ShippingSettings;
}

type FieldErrors = Partial<Record<CheckoutField, string>>;

interface FieldProps {
  name: CheckoutField;
  label: string;
  errors: FieldErrors;
  defaultValue?: string | null;
  autoComplete: string;
  type?: string;
  required?: boolean;
  hint?: string;
}

function Field({
  name,
  label,
  errors,
  defaultValue,
  autoComplete,
  type = "text",
  required = true,
  hint,
}: FieldProps) {
  const error = errors[name];
  const describedBy = [hint && `${name}-hint`, error && `${name}-error`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={styles.field}>
      <label htmlFor={name}>
        {label}
        {!required && " (optional)"}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        autoComplete={autoComplete}
        required={required}
        defaultValue={defaultValue ?? ""}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
      />
      {hint && (
        <span id={`${name}-hint`} className={styles.hint}>
          {hint}
        </span>
      )}
      {error && (
        <span id={`${name}-error`} className={styles.fieldError}>
          {error}
        </span>
      )}
    </div>
  );
}

export function CheckoutView({ paypalClientId, shipping }: CheckoutViewProps) {
  const { items, isReady, subtotal } = useCart();
  const [details, setDetails] = useState<CheckoutDetails | null>(null);
  const [step, setStep] = useState<"details" | "review">("details");
  const [errors, setErrors] = useState<FieldErrors>({});

  const subtotalPence = Math.round(subtotal * 100);
  const shippingPence = calculateShippingPence(subtotalPence, shipping);

  if (!isReady) return null;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Your basket is empty.</p>
        <Button href="/shop">Browse Mystery Boxes</Button>
      </div>
    );
  }

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const result = validateCheckoutDetails(
      Object.fromEntries(new FormData(event.currentTarget)),
    );
    if (!result.ok) {
      setErrors(result.errors);
      const firstInvalid = Object.keys(result.errors)[0];
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }
    setErrors({});
    setDetails(result.details);
    setStep("review");
    window.scrollTo({ top: 0 });
  };

  const summary = (
    <aside className={styles.summary} aria-label="Order summary">
      <h2>Order summary</h2>
      <ul className={styles.summaryItems}>
        {items.map((item) => (
          <li key={item.productId} className={styles.summaryRow}>
            <span>
              {item.quantity} × {item.name}
            </span>
            <span>{formatPrice(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>
      <div className={styles.summaryRow}>
        <span>Subtotal</span>
        <span>{formatPrice(subtotal)}</span>
      </div>
      <div className={styles.summaryRow}>
        <span>UK shipping</span>
        <span>{shippingPence === 0 ? "Free" : formatPrice(shippingPence / 100)}</span>
      </div>
      <div className={styles.summaryRow}>
        <span>Total</span>
        <span className={styles.total}>
          {formatPrice(subtotal + shippingPence / 100)}
        </span>
      </div>
      <p className={styles.linePrice}>Prices and stock are confirmed when you pay.</p>
    </aside>
  );

  if (step === "review" && details) {
    return (
      <div className={styles.layout}>
        <div className={styles.review}>
          <section className={styles.section}>
            <h2>Your details</h2>
            <address className={styles.reviewBlock}>
              <span>{details.fullName}</span>
              <span>{details.email}</span>
              {details.phone && <span>{details.phone}</span>}
            </address>
          </section>

          <section className={styles.section}>
            <h2>Delivering to</h2>
            <address className={styles.reviewBlock}>
              <span>{details.recipientName ?? details.fullName}</span>
              <span>{details.line1}</span>
              {details.line2 && <span>{details.line2}</span>}
              <span>{details.city}</span>
              <span>{details.postcode}</span>
              <span>United Kingdom</span>
            </address>
            <button
              type="button"
              className={styles.editButton}
              onClick={() => setStep("details")}
            >
              Edit details
            </button>
          </section>

          <section className={styles.section}>
            <h2>Payment</h2>
            <p className={styles.linePrice}>
              Pay securely with PayPal or a debit/credit card. We never see your card
              details.
            </p>
            {paypalClientId ? (
              <PayPalCheckout clientId={paypalClientId} items={items} details={details} />
            ) : (
              <p className={styles.error} role="alert">
                Checkout is temporarily unavailable — please try again later.
              </p>
            )}
          </section>
        </div>
        {summary}
      </div>
    );
  }

  return (
    <div className={styles.layout}>
      <form className={styles.form} onSubmit={handleSubmit} noValidate>
        <fieldset className={styles.section}>
          <legend>Your details</legend>
          <Field
            name="fullName"
            label="Full name"
            autoComplete="name"
            errors={errors}
            defaultValue={details?.fullName}
          />
          <div className={styles.fieldRow}>
            <Field
              name="email"
              label="Email"
              type="email"
              autoComplete="email"
              errors={errors}
              defaultValue={details?.email}
              hint="For your order confirmation."
            />
            <Field
              name="phone"
              label="Phone"
              type="tel"
              autoComplete="tel"
              required={false}
              errors={errors}
              defaultValue={details?.phone}
              hint="Only used if there's a problem with delivery."
            />
          </div>
        </fieldset>

        <fieldset className={styles.section}>
          <legend>Delivery address (UK only)</legend>
          <Field
            name="recipientName"
            label="Recipient name"
            autoComplete="shipping name"
            required={false}
            errors={errors}
            defaultValue={details?.recipientName}
            hint="Sending a gift? Enter who it's for. Leave blank to use your name."
          />
          <Field
            name="line1"
            label="Address line 1"
            autoComplete="shipping address-line1"
            errors={errors}
            defaultValue={details?.line1}
          />
          <Field
            name="line2"
            label="Address line 2"
            autoComplete="shipping address-line2"
            required={false}
            errors={errors}
            defaultValue={details?.line2}
          />
          <div className={styles.fieldRow}>
            <Field
              name="city"
              label="Town or city"
              autoComplete="shipping address-level2"
              errors={errors}
              defaultValue={details?.city}
            />
            <Field
              name="postcode"
              label="Postcode"
              autoComplete="shipping postal-code"
              errors={errors}
              defaultValue={details?.postcode}
            />
          </div>
        </fieldset>

        <Button type="submit" size="lg">
          Continue to review
        </Button>
      </form>
      {summary}
    </div>
  );
}
