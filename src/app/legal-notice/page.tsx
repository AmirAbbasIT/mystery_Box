import type { Metadata } from "next";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Legal Notice",
  description: "Company information and legal notices for Mystery Packed Gifts.",
};

export default function LegalNoticePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Legal Notice</h1>
      </header>

      <div className={styles.content}>
        <p className={styles.placeholderNotice}>
          This page is a placeholder template. Replace the bracketed details below with your real
          company information — ideally reviewed by a solicitor — before this site goes live.
        </p>

        <section>
          <h2>Company Information</h2>
          <p>
            [Company Legal Name]
            <br />
            [Registered Address]
            <br />
            Company Registration Number: [Number]
            <br />
            VAT Number (if applicable): [Number]
          </p>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Email: [contact email]</p>
        </section>

        <section>
          <h2>Mystery Box Contents &amp; Odds</h2>
          <p>
            All mystery boxes, eggs and wheel spin prizes are randomised from a published prize
            pool. Odds/weightings for each prize pool are shown on the relevant product page.
            Contents shown in product photography are illustrative and are not guaranteed unless
            explicitly stated as a guaranteed item.
          </p>
        </section>

        <section>
          <h2>Consumer Rights</h2>
          <p>[Insert your returns, refunds and Consumer Contracts Regulations 2013 policy here.]</p>
        </section>
      </div>
    </div>
  );
}
