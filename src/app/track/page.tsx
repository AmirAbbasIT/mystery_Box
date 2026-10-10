import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { TrackOrderView } from "./TrackOrderView";
import styles from "./page.module.scss";

export const metadata: Metadata = pageMetadata({
  title: "Track your order",
  description:
    "Check the status of your Mystery Picked Gifts order and follow your parcel with your order number.",
  path: "/track",
});

interface TrackOrderPageProps {
  searchParams: Promise<{ order?: string }>;
}

/** /track?order=MPG-XXXXXX (from order emails / the success page) pre-fills the order number. */
export default async function TrackOrderPage({ searchParams }: TrackOrderPageProps) {
  const { order } = await searchParams;
  const initialOrderNumber =
    typeof order === "string" ? order.trim().toUpperCase().slice(0, 20) : "";

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Track your order</h1>
        <p>Enter your order number and the email you used at checkout.</p>
      </header>
      <TrackOrderView initialOrderNumber={initialOrderNumber} />
    </div>
  );
}
