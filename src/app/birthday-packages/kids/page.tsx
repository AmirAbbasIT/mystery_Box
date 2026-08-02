import type { Metadata } from "next";
import { birthdayPackages } from "@/data";
import { CustomRequestForm } from "@/components/forms";
import { PackageCard } from "../PackageCard";
import styles from "../page.module.scss";

export const metadata: Metadata = {
  title: "Kids Birthday Packages",
  description: "Party favours and milestone birthday boxes for kids.",
};

export default function KidsBirthdayPage() {
  const kidsPackages = birthdayPackages.filter((pkg) => pkg.audience === "kids");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Kids Birthday Packages</h1>
        <p>Party bag fillers and milestone birthday boxes, themed to what they love.</p>
      </header>

      <div className={styles.grid}>
        {kidsPackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      <section className={styles.customSection}>
        <h2>Want something custom?</h2>
        <p>Tell us the occasion, age and budget — we&rsquo;ll put together a quote.</p>
        <CustomRequestForm defaultRecipientType="kids" />
      </section>
    </div>
  );
}
