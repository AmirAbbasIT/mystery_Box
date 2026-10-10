import type { Metadata } from "next";
import {
  BUSINESS_LEGAL_NAME,
  BUSINESS_POSTAL_ADDRESS,
  CONTACT_EMAIL,
} from "@/lib/constants";
import { pageMetadata } from "@/lib/seo";
import styles from "./page.module.scss";

export const metadata: Metadata = pageMetadata({
  title: "Legal Notice",
  description:
    "Business information, returns and refunds policy, and legal notices for Mystery Picked Gifts.",
  path: "/legal-notice",
});

const emailLink = <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>;

export default function LegalNoticePage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Legal Notice</h1>
      </header>

      <div className={styles.content}>
        <section>
          <h2>Business Information</h2>
          <p>
            Mystery Picked Gifts is run by {BUSINESS_LEGAL_NAME}, a sole trader based in
            the United Kingdom.
          </p>
          <address>
            {BUSINESS_POSTAL_ADDRESS.street}
            <br />
            {BUSINESS_POSTAL_ADDRESS.town}
            <br />
            {BUSINESS_POSTAL_ADDRESS.county}
            <br />
            {BUSINESS_POSTAL_ADDRESS.postcode}
            <br />
            United Kingdom
          </address>
        </section>

        <section>
          <h2>Contact</h2>
          <p>Email: {emailLink}</p>
        </section>

        <section>
          <h2>Mystery Box Contents &amp; Odds</h2>
          <p>
            All mystery boxes, eggs and wheel spin prizes are randomised from a published
            prize pool. Odds/weightings for each prize pool are shown on the relevant
            product page. Contents shown in product photography are illustrative and are
            not guaranteed unless explicitly stated as a guaranteed item.
          </p>
        </section>

        <section id="returns">
          <h2>Returns &amp; Refunds</h2>
          <h3>Your right to cancel</h3>
          <p>
            You can cancel your order within 14 days of receiving it, without giving a
            reason — including if the surprise just isn&rsquo;t for you. To cancel, email{" "}
            {emailLink} with your order number. Please then send the items back to the
            address above within 14 days of telling us. Unless the items were faulty or
            not what you ordered, the cost of returning them is yours.
          </p>
          <p>
            We&rsquo;ll refund the price of the items and the standard delivery charge you
            paid within 14 days of receiving the items back (or proof that you&rsquo;ve
            returned them), to your original payment method. We may reduce the refund if
            items have been handled more than needed to check them.
          </p>

          <h3>Items that can&rsquo;t be returned</h3>
          <ul>
            <li>
              Sealed beauty, cosmetic and personal-care items once they&rsquo;ve been
              unsealed after delivery, for health and hygiene reasons.
            </li>
            <li>
              Sweets, chocolate and other food once opened (for health protection and
              hygiene reasons), and any perishable food that would go off before it could
              be returned.
            </li>
            <li>
              Custom-made orders (from our Custom Request service) once we&rsquo;ve
              started making them, as they&rsquo;re made to your specification.
            </li>
          </ul>

          <h3>Faulty, damaged or missing items</h3>
          <p>
            If anything arrives faulty, damaged or not as described, or your parcel
            doesn&rsquo;t arrive, contact us at {emailLink}. Your order is our
            responsibility until it&rsquo;s delivered to you. Under the Consumer Rights
            Act 2015 you&rsquo;re entitled to a full refund for faulty goods if you tell
            us within 30 days of delivery, and after that to a repair or replacement.
            These rights are in addition to your right to cancel.
          </p>
        </section>
      </div>
    </div>
  );
}
