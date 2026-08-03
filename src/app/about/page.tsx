import type { Metadata } from "next";
import Image from "next/image";
import { TrustSignals } from "@/components/home";
import { ContactForm } from "@/components/forms";
import { CONTACT_EMAIL } from "@/lib/constants";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "About & Contact",
  description:
    "The story behind Mystery Box UK — a small, family-run mystery gifting brand — plus how to get in touch.",
};

export default function AboutPage() {
  return (
    <div>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>About Us</h1>
        </header>

        <div className={styles.storyContent}>
          <div className={styles.imageWrapper}>
            <Image
              src="/images/brand/hero-gift.svg"
              alt="A wrapped mystery gift box"
              width={320}
              height={320}
              className={styles.image}
            />
          </div>
          <div className={styles.story}>
            <p>
              We started Mystery Box UK because we love the reveal moment as much as our
              customers do — that split-second where you don&rsquo;t know what you&rsquo;re
              getting, and then you do.
            </p>
            <p>
              We&rsquo;re a small, family-run team based in the UK. Every box, egg and wheel spin
              prize is hand-picked and packed by us — not a warehouse algorithm.
            </p>
            <p>
              Whether you&rsquo;re treating yourself, filling party bags, or building a custom box
              for someone&rsquo;s big day, we want every order to feel like a little bit of
              theatre.
            </p>
          </div>
        </div>
      </div>

      <TrustSignals />

      <div className={styles.page}>
        <header className={styles.header}>
          <h2>Get in Touch</h2>
          <p>
            Questions about an order, a custom request, or just want to say hi? We&rsquo;d love to
            hear from you.
          </p>
        </header>

        <div className={styles.contactContent}>
          <ContactForm />
          <aside className={styles.info}>
            <h3>Prefer email?</h3>
            <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>
            <p>We usually reply within 1–2 working days.</p>
          </aside>
        </div>
      </div>
    </div>
  );
}
