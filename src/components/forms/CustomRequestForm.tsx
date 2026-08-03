"use client";

import { useActionState, useId, useState } from "react";
import { Button } from "@/components/ui";
import type { CustomRequestInput, RecipientType } from "@/types";
import { submitCustomRequestAction } from "./custom-request-actions";
import styles from "./CustomRequestForm.module.scss";

function initialValues(): CustomRequestInput {
  return {
    recipientType: "kids",
    ageRange: "",
    occasion: "",
    themePreference: "",
    budget: 20,
    notes: "",
    contactName: "",
    contactEmail: "",
  };
}

export function CustomRequestForm() {
  const [state, formAction, pending] = useActionState(submitCustomRequestAction, {});
  const [values, setValues] = useState<CustomRequestInput>(initialValues);
  const formId = useId();

  const handleChange = <K extends keyof CustomRequestInput>(
    field: K,
    value: CustomRequestInput[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  if (state.success) {
    return (
      <div className={styles.confirmation} role="status">
        <h3>Request received!</h3>
        <p>
          Thanks {state.submittedName || "there"} — we&rsquo;ll email{" "}
          {state.submittedEmail || "you"} within 1–2 working days with a custom quote.
        </p>
      </div>
    );
  }

  return (
    <form className={styles.form} action={formAction}>
      <div className={styles.field}>
        <span className={styles.legend}>Who&rsquo;s it for?</span>
        <div className={styles.radioRow} role="radiogroup" aria-label="Recipient">
          {(["kids", "adult"] as RecipientType[]).map((type) => (
            <label key={type} className={styles.radioLabel}>
              <input
                type="radio"
                name="recipientType"
                value={type}
                checked={values.recipientType === type}
                onChange={() => handleChange("recipientType", type)}
              />
              {type === "kids" ? "Kid" : "Adult"}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-ageRange`}>Age</label>
        <input
          id={`${formId}-ageRange`}
          name="ageRange"
          type="text"
          required
          placeholder="e.g. 8"
          value={values.ageRange}
          onChange={(event) => handleChange("ageRange", event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-occasion`}>Occasion</label>
        <input
          id={`${formId}-occasion`}
          name="occasion"
          type="text"
          required
          placeholder="e.g. 8th birthday party"
          value={values.occasion}
          onChange={(event) => handleChange("occasion", event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-theme`}>Theme preference (optional)</label>
        <input
          id={`${formId}-theme`}
          name="themePreference"
          type="text"
          placeholder="e.g. pastel, sparkly, unicorns"
          value={values.themePreference}
          onChange={(event) => handleChange("themePreference", event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-budget`}>Budget for this box: £{values.budget}</label>
        <input
          id={`${formId}-budget`}
          name="budget"
          type="range"
          min={5}
          max={50}
          step={1}
          value={values.budget}
          onChange={(event) => handleChange("budget", Number(event.target.value))}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-notes`}>Anything else? (optional)</label>
        <textarea
          id={`${formId}-notes`}
          name="notes"
          rows={3}
          value={values.notes}
          onChange={(event) => handleChange("notes", event.target.value)}
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <label htmlFor={`${formId}-name`}>Your name</label>
          <input
            id={`${formId}-name`}
            name="contactName"
            type="text"
            required
            autoComplete="name"
            value={values.contactName}
            onChange={(event) => handleChange("contactName", event.target.value)}
          />
        </div>
        <div className={styles.field}>
          <label htmlFor={`${formId}-email`}>Your email</label>
          <input
            id={`${formId}-email`}
            name="contactEmail"
            type="email"
            required
            autoComplete="email"
            value={values.contactEmail}
            onChange={(event) => handleChange("contactEmail", event.target.value)}
          />
        </div>
      </div>

      {state.error && (
        <p className={styles.error} role="alert">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Sending…" : "Send Custom Request"}
      </Button>
    </form>
  );
}
