"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import type { CustomRequestInput, RecipientType } from "@/types";
import styles from "./CustomRequestForm.module.scss";

interface CustomRequestFormProps {
  defaultRecipientType?: RecipientType;
}

function initialState(recipientType: RecipientType): CustomRequestInput {
  return {
    recipientType,
    ageRange: "",
    occasion: "",
    themePreference: "",
    budget: 20,
    notes: "",
    contactName: "",
    contactEmail: "",
  };
}

// No backend yet — Phase 2 wires this to the CustomRequest API. For now it
// validates client-side and shows a static confirmation.
export function CustomRequestForm({ defaultRecipientType = "kids" }: CustomRequestFormProps) {
  const [values, setValues] = useState<CustomRequestInput>(() => initialState(defaultRecipientType));
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formId = useId();

  const handleChange = <K extends keyof CustomRequestInput>(
    field: K,
    value: CustomRequestInput[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <div className={styles.confirmation} role="status">
        <h3>Request received!</h3>
        <p>
          Thanks {values.contactName || "there"} — we&rsquo;ll email{" "}
          {values.contactEmail || "you"} within 1–2 working days with a custom quote.
        </p>
        <Button
          variant="outline"
          onClick={() => {
            setIsSubmitted(false);
            setValues(initialState(defaultRecipientType));
          }}
        >
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <span className={styles.legend}>Who&rsquo;s it for?</span>
        <div className={styles.radioRow} role="radiogroup" aria-label="Recipient">
          {(["kids", "adult"] as RecipientType[]).map((type) => (
            <label key={type} className={styles.radioLabel}>
              <input
                type="radio"
                name={`${formId}-recipientType`}
                value={type}
                checked={values.recipientType === type}
                onChange={() => handleChange("recipientType", type)}
              />
              {type === "kids" ? "Kids" : "Adult"}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-ageRange`}>Age range</label>
        <input
          id={`${formId}-ageRange`}
          type="text"
          required
          placeholder="e.g. 7-9"
          value={values.ageRange}
          onChange={(event) => handleChange("ageRange", event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-occasion`}>Occasion</label>
        <input
          id={`${formId}-occasion`}
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
          type="text"
          placeholder="e.g. pastel, sparkly, unicorns"
          value={values.themePreference}
          onChange={(event) => handleChange("themePreference", event.target.value)}
        />
      </div>

      <div className={styles.field}>
        <label htmlFor={`${formId}-budget`}>Budget per person: £{values.budget}</label>
        <input
          id={`${formId}-budget`}
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
            type="email"
            required
            autoComplete="email"
            value={values.contactEmail}
            onChange={(event) => handleChange("contactEmail", event.target.value)}
          />
        </div>
      </div>

      <Button type="submit" size="lg">
        Send Custom Request
      </Button>
    </form>
  );
}
