import type { Metadata } from "next";
import { birthdayPackages } from "@/data";
import { Button } from "@/components/ui";
import { PackageCard } from "../PackageCard";
import styles from "../page.module.scss";

export const metadata: Metadata = {
  title: "Adult Party Packages",
  description: "Hen dos, milestone birthdays and build-your-own adult party boxes.",
};

export default function AdultPartyPage() {
  const adultPackages = birthdayPackages.filter((pkg) => pkg.audience === "adult-party");

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Adult Party Packages</h1>
        <p>Hen dos, milestone birthdays and girls&rsquo; nights — build the box together.</p>
      </header>

      <div className={styles.grid}>
        {adultPackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>

      <section className={styles.customSection}>
        <h2>Want something custom?</h2>
        <p>Tell us the occasion and budget — we&rsquo;ll put together a quote for a mystery box packed just for them.</p>
        <Button href="/custom-request">Make a Custom Request</Button>
      </section>
    </div>
  );
}
