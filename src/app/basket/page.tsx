import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getShippingSettings } from "@/lib/site-settings";
import { BasketView } from "./BasketView";
import styles from "./page.module.scss";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Your Basket",
  description: "Review your mystery boxes before checkout.",
  path: "/basket",
  noIndex: true,
});

export default async function BasketPage() {
  const shipping = await getShippingSettings();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Your Basket</h1>
      <BasketView shipping={shipping} />
    </div>
  );
}
