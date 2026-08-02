"use client";

import { motion } from "framer-motion";
import styles from "./HowItWorks.module.scss";

const STEPS = [
  {
    number: "01",
    title: "Pick your thrill",
    description: "Choose a mystery box, egg tier, wheel spin or birthday package.",
  },
  {
    number: "02",
    title: "We hand-pack it",
    description: "Every box is packed by our small UK team, not a warehouse robot.",
  },
  {
    number: "03",
    title: "Your reveal moment",
    description: "Crack, spin or unbox — the surprise is the whole point.",
  },
  {
    number: "04",
    title: "Show us!",
    description: "Tag us in your unboxing — we love a good reaction.",
  },
];

export function HowItWorks() {
  return (
    <section className={styles.section}>
      <h2 className={styles.title}>How it works</h2>
      <div className={styles.steps}>
        {STEPS.map((step, index) => (
          <motion.div
            key={step.number}
            className={styles.step}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: index * 0.08, ease: [0.4, 0, 0.2, 1] }}
          >
            <span className={styles.number} aria-hidden="true">
              {step.number}
            </span>
            <h3 className={styles.stepTitle}>{step.title}</h3>
            <p className={styles.stepDescription}>{step.description}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
