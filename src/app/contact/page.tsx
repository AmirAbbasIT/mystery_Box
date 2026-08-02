import type { Metadata } from "next";
import { CONTACT_EMAIL } from "@/lib/constants";
import { ContactForm } from "@/components/forms";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Contact Us",
  description: "Get in touch with the Mystery Box UK team.",
};

export default function ContactPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Contact Us</h1>
        <p>
          Questions about an order, a custom request, or just want to say hi? We&rsquo;d love to
          hear from you.
        </p>
      </header>

      <div className={styles.content}>
        <ContactForm />
        <aside className={styles.info}>
          <h2>Prefer email?</h2>
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
          <p>We usually reply within 1–2 working days.</p>
        </aside>
      </div>
    </div>
  );
}
