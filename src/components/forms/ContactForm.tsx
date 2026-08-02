"use client";

import { useId, useState, type FormEvent } from "react";
import { Button } from "@/components/ui";
import styles from "./ContactForm.module.scss";

interface ContactFormValues {
  name: string;
  email: string;
  message: string;
}

const initialValues: ContactFormValues = { name: "", email: "", message: "" };

// No backend yet — Phase 2 wires this to a real inbox/API. For now it
// validates client-side and shows a static confirmation.
export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(initialValues);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const formId = useId();

  const handleChange = <K extends keyof ContactFormValues>(
    field: K,
    value: ContactFormValues[K],
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
        <h3>Message sent!</h3>
        <p>Thanks {values.name || "there"} — we usually reply within 1–2 working days.</p>
        <Button
          variant="outline"
          onClick={() => {
            setIsSubmitted(false);
            setValues(initialValues);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <div className={styles.field}>
        <label htmlFor={`${formId}-name`}>Name</label>
        <input
          id={`${formId}-name`}
          type="text"
          required
          autoComplete="name"
          value={values.name}
          onChange={(event) => handleChange("name", event.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${formId}-email`}>Email</label>
        <input
          id={`${formId}-email`}
          type="email"
          required
          autoComplete="email"
          value={values.email}
          onChange={(event) => handleChange("email", event.target.value)}
        />
      </div>
      <div className={styles.field}>
        <label htmlFor={`${formId}-message`}>Message</label>
        <textarea
          id={`${formId}-message`}
          rows={5}
          required
          value={values.message}
          onChange={(event) => handleChange("message", event.target.value)}
        />
      </div>
      <Button type="submit" size="lg">
        Send Message
      </Button>
    </form>
  );
}
