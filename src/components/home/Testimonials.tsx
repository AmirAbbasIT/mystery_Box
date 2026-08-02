"use client";

import { motion } from "framer-motion";
import styles from "./Testimonials.module.scss";

// Placeholder copy — replace with real, consented customer reviews before
// launch. Publishing fabricated testimonials as genuine would breach UK
// consumer protection / ASA rules on fake reviews.
const TESTIMONIALS = [
  {
    name: "Chloe, Manchester",
    quote: "The egg reveal genuinely made my little sister's birthday — she screamed at the golden egg!",
    rating: 5,
  },
  {
    name: "Priya, London",
    quote: "Ordered the Y2K jewellery box for myself as a treat and it did not disappoint.",
    rating: 5,
  },
  {
    name: "Amelia, Leeds",
    quote: "Booked the hen party box for six of us — such a fun way to kick off the night.",
    rating: 5,
  },
];

export function Testimonials() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Loved by our customers</h2>
      <div className={styles.grid}>
        {TESTIMONIALS.map((testimonial, index) => (
          <motion.blockquote
            key={testimonial.name}
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
          >
            <p className={styles.stars} aria-hidden="true">
              {"★".repeat(testimonial.rating)}
            </p>
            <p className={styles.quote}>&ldquo;{testimonial.quote}&rdquo;</p>
            <footer className={styles.author}>{testimonial.name}</footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
