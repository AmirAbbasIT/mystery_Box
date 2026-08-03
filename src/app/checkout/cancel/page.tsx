import type { Metadata } from "next";
import { Button } from "@/components/ui";
import styles from "../checkout.module.scss";

export const metadata: Metadata = {
  title: "Checkout Cancelled",
  description: "Your checkout was cancelled — your basket is still here.",
};

export default function CheckoutCancelPage() {
  return (
    <div className={styles.page}>
      <h1>Checkout cancelled</h1>
      <p>No payment was taken — your basket is still waiting for you.</p>
      <Button href="/basket">Back to Basket</Button>
    </div>
  );
}
