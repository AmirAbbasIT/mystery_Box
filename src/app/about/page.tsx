import type { Metadata } from "next";
import Image from "next/image";
import { TrustSignals } from "@/components/home";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "About Us",
  description: "The story behind Mystery Box UK — a small, family-run mystery gifting brand.",
};

export default function AboutPage() {
  return (
    <div>
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>About Us</h1>
        </header>

        <div className={styles.content}>
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
    </div>
  );
}
