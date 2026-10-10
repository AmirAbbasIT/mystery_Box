"use client";

import { motion } from "framer-motion";
import type { PublicReview } from "@/lib/reviews";
import styles from "./Testimonials.module.scss";

interface TestimonialsProps {
  /** Published + featured reviews from Admin → Reviews. Nothing renders until there's one. */
  reviews: PublicReview[];
}

export function Testimonials({ reviews }: TestimonialsProps) {
  if (reviews.length === 0) return null;

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Loved by our customers</h2>
      <div className={styles.grid}>
        {reviews.map((review, index) => (
          <motion.blockquote
            key={review.id}
            className={styles.card}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
          >
            <p
              className={styles.stars}
              role="img"
              aria-label={`${review.rating} out of 5 stars`}
            >
              {"★".repeat(review.rating)}
              {"☆".repeat(5 - review.rating)}
            </p>
            <p className={styles.quote}>&ldquo;{review.body}&rdquo;</p>
            <footer className={styles.author}>
              {review.authorName}
              {review.location ? `, ${review.location}` : ""}
              {review.verifiedPurchase && (
                <span className={styles.verified}> · Verified purchase</span>
              )}
            </footer>
          </motion.blockquote>
        ))}
      </div>
    </section>
  );
}
