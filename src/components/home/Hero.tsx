"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Button } from "@/components/ui";
import styles from "./Hero.module.scss";

export function Hero() {
  return (
    <section className={styles.hero}>
      <div className={styles.inner}>
        <motion.div
          className={styles.copy}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <span className={styles.eyebrow}>UK mystery gifting, made for the reveal</span>
          <h1 className={styles.title}>Every box is a moment worth unboxing.</h1>
          <p className={styles.subtitle}>
            Jewellery, beauty and stationery mystery boxes, pink eggs and a genuine wheel spin —
            pick your theme, pick your thrill.
          </p>
          <div className={styles.ctas}>
            <Button href="/shop" size="lg">
              Shop Mystery Boxes
            </Button>
            <Button href="/wheel-spin" size="lg" variant="outline">
              Try the Wheel
            </Button>
          </div>
        </motion.div>

        <motion.div
          className={styles.visual}
          initial={{ opacity: 0, scale: 0.9, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
        >
          <Image
            src="/images/brand/hero-gift.svg"
            alt="A wrapped mystery gift box"
            width={420}
            height={420}
            priority
            className={styles.visualImage}
          />
        </motion.div>
      </div>
    </section>
  );
}
