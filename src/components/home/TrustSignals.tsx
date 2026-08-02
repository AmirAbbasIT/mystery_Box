import styles from "./TrustSignals.module.scss";

const SIGNALS = [
  { title: "Dispatched within 24–48h", description: "Fast UK dispatch on every order." },
  { title: "Family-run", description: "A small UK team, not a faceless warehouse." },
  { title: "Randomised, not rigged", description: "Every prize pool's odds are published up front." },
  { title: "Secure checkout", description: "Payments are processed securely at checkout." },
];

export function TrustSignals() {
  return (
    <section className={styles.section}>
      <ul role="list" className={styles.grid}>
        {SIGNALS.map((signal) => (
          <li key={signal.title} className={styles.item}>
            <h3 className={styles.itemTitle}>{signal.title}</h3>
            <p className={styles.itemDescription}>{signal.description}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
