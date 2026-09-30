"use client";

import { useActionState } from "react";
import type { ShippingSettings } from "@/lib/shipping";
import type { SettingsFormState } from "./actions";
import styles from "./settings.module.scss";

interface ShippingFormProps {
  current: ShippingSettings;
  action: (state: SettingsFormState, formData: FormData) => Promise<SettingsFormState>;
}

const toPounds = (pence: number) => (pence / 100).toFixed(2);

export function ShippingForm({ current, action }: ShippingFormProps) {
  const [state, formAction, pending] = useActionState(action, {});

  return (
    <form action={formAction} className={styles.form}>
      <h2 className={styles.sectionTitle}>Shipping</h2>
      <p className={styles.sectionDescription}>
        One flat UK shipping fee per order, added at PayPal checkout. Optionally waive it once the
        basket reaches a set subtotal. Set the fee to 0 for free shipping on everything.
      </p>

      <div className={styles.field}>
        <label htmlFor="flatRate">Flat shipping fee (£)</label>
        <input
          id="flatRate"
          name="flatRate"
          inputMode="decimal"
          required
          defaultValue={toPounds(current.flatPence)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor="freeThreshold">Free shipping when subtotal reaches (£) — optional</label>
        <input
          id="freeThreshold"
          name="freeThreshold"
          inputMode="decimal"
          placeholder="Leave blank to never waive"
          defaultValue={current.freeThresholdPence === null ? "" : toPounds(current.freeThresholdPence)}
        />
      </div>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}
      {state.success && <p role="status">{state.success}</p>}

      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? "Saving…" : "Save shipping"}
      </button>
    </form>
  );
}
