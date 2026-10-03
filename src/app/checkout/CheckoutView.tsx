"use client";

import { useState, type SubmitEvent } from "react";
import { Button } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { useCart } from "@/lib/cart/CartContext";
import type { ShippingSettings } from "@/lib/shipping";
import { calculateOrderTotals, type CouponPricing } from "@/lib/coupons";
import {
  validateBillingAddress,
  validateCheckoutDetails,
  type BillingAddress,
  type BillingField,
  type CheckoutDetails,
  type CheckoutField,
} from "@/lib/checkout-details";
import { PayPalCheckout } from "./PayPalCheckout";
import { PromoCodeBox } from "./PromoCodeBox";
import styles from "./page.module.scss";

interface CheckoutViewProps {
  paypalClientId: string | null;
  shipping: ShippingSettings;
}

type FieldErrors = Partial<Record<CheckoutField | BillingField, string>>;

interface FieldProps {
  name: CheckoutField | BillingField;
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
  /** Null = same as the delivery address. */
  const [billing, setBilling] = useState<BillingAddress | null>(null);
  const [billingSameAsDelivery, setBillingSameAsDelivery] = useState(true);
  const [step, setStep] = useState<"details" | "review">("details");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [coupon, setCoupon] = useState<CouponPricing | null>(null);

  const subtotalPence = Math.round(subtotal * 100);
  const totals = calculateOrderTotals(subtotalPence, shipping, coupon);
  const totalLabel = formatPrice(totals.totalPence / 100);

  if (!isReady) return null;

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Your basket is empty.</p>
        <Button href="/shop">Browse Mystery Boxes</Button>
      </div>
    );
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formValues = Object.fromEntries(new FormData(event.currentTarget));
    const result = validateCheckoutDetails(formValues);
    const billingResult = billingSameAsDelivery
      ? null
      : validateBillingAddress(formValues);

    const nextErrors: FieldErrors = {
      ...(result.ok ? {} : result.errors),
      ...(billingResult && !billingResult.ok ? billingResult.errors : {}),
    };
    if (!result.ok || (billingResult && !billingResult.ok)) {
      setErrors(nextErrors);
      const firstInvalid = Object.keys(nextErrors)[0];
      if (firstInvalid) document.getElementById(firstInvalid)?.focus();
      return;
    }
    setErrors({});
    setDetails(result.details);
    setBilling(billingResult?.ok ? billingResult.billing : null);
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
      {totals.discountPence > 0 && coupon && (
        <div className={`${styles.summaryRow} ${styles.discountRow}`}>
          <span>Discount ({coupon.code})</span>
          <span>−{formatPrice(totals.discountPence / 100)}</span>
        </div>
      )}
      <div className={styles.summaryRow}>
        <span>UK shipping</span>
        <span>
          {totals.shippingPence - totals.shippingDiscountPence === 0
            ? "Free"
            : formatPrice(totals.shippingPence / 100)}
        </span>
      </div>
      <div className={styles.summaryRow}>
        <span>Total</span>
        <span className={styles.total}>{totalLabel}</span>
      </div>
      <PromoCodeBox
        items={items}
        email={details?.email ?? null}
        applied={coupon}
        onChange={setCoupon}
      />
      <p className={styles.linePrice}>
        Prices, stock and codes are confirmed when you pay.
      </p>
    </aside>
  );

  if (step === "review" && details) {
    const billingAddress: BillingAddress = billing ?? {
      line1: details.line1,
      line2: details.line2,
      city: details.city,
      postcode: details.postcode,
    };

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
          </section>

          <section className={styles.section}>
            <h2>Billing address</h2>
            {billing ? (
              <address className={styles.reviewBlock}>
                <span>{billing.line1}</span>
                {billing.line2 && <span>{billing.line2}</span>}
                <span>{billing.city}</span>
                <span>{billing.postcode}</span>
                <span>United Kingdom</span>
              </address>
            ) : (
              <p>Same as delivery address</p>
            )}
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
              <PayPalCheckout
                clientId={paypalClientId}
                items={items}
                details={details}
                billing={billingAddress}
                totalLabel={totalLabel}
                couponCode={coupon?.code ?? null}
              />
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

        <fieldset className={styles.section}>
          <legend>Billing address</legend>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={billingSameAsDelivery}
              onChange={(event) => setBillingSameAsDelivery(event.target.checked)}
            />
            Same as delivery address
          </label>
          {!billingSameAsDelivery && (
            <>
              <p className={styles.hint}>
                The address your card is registered to (UK only).
              </p>
              <Field
                name="billingLine1"
                label="Address line 1"
                autoComplete="billing address-line1"
                errors={errors}
                defaultValue={billing?.line1}
              />
              <Field
                name="billingLine2"
                label="Address line 2"
                autoComplete="billing address-line2"
                required={false}
                errors={errors}
                defaultValue={billing?.line2}
              />
              <div className={styles.fieldRow}>
                <Field
                  name="billingCity"
                  label="Town or city"
                  autoComplete="billing address-level2"
                  errors={errors}
                  defaultValue={billing?.city}
                />
                <Field
                  name="billingPostcode"
                  label="Postcode"
                  autoComplete="billing postal-code"
                  errors={errors}
                  defaultValue={billing?.postcode}
                />
              </div>
            </>
          )}
        </fieldset>

        <Button type="submit" size="lg">
          Continue to review
        </Button>
      </form>
      {summary}
    </div>
  );
}
