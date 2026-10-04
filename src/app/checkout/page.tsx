import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getShippingSettings } from "@/lib/site-settings";
import { CheckoutView } from "./CheckoutView";
import styles from "./page.module.scss";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Checkout",
  description: "Enter your details and delivery address, then pay securely with PayPal.",
  path: "/checkout",
  noIndex: true,
});

export default async function CheckoutPage() {
  const shipping = await getShippingSettings();

  return (
    <div className={styles.page}>
      <h1 className={styles.title}>Checkout</h1>
      <CheckoutView
        paypalClientId={process.env.PAYPAL_CLIENT_ID ?? null}
        shipping={shipping}
      />
    </div>
  );
}
