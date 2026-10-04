import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { TrackOrderView } from "./TrackOrderView";
import styles from "./page.module.scss";

export const metadata: Metadata = pageMetadata({
  title: "Track your order",
  description:
    "Check the status of your Mystery Packed Gifts order and follow your parcel with your order number.",
  path: "/track",
});

export default function TrackOrderPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Track your order</h1>
        <p>Enter your order number and the email you used at checkout.</p>
      </header>
      <TrackOrderView />
    </div>
  );
}
