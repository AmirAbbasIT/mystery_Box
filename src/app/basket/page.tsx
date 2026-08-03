import type { Metadata } from "next";
import { BasketView } from "./BasketView";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Your Basket",
  description: "Review your mystery boxes before checkout.",
};

export default function BasketPage() {
  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your Basket</h1>
      <BasketView />
    </div>
  );
}
