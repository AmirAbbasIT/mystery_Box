import type { Metadata } from "next";
import { CustomRequestForm } from "@/components/forms";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Custom Request",
  description: "Request a custom-packed mystery gift box — tell us who it's for, the occasion, and your budget.",
};

export default function CustomRequestPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Custom Request</h1>
        <p>
          Want a mystery box packed just for someone? Tell us who it&rsquo;s for, the occasion, any
          theme preference and your budget — we&rsquo;ll put together a quote.
        </p>
      </header>

      <div className={styles.formWrapper}>
        <CustomRequestForm />
      </div>
    </div>
  );
}
