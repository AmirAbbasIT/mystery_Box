import type { Metadata } from "next";
import { getBirthdayPackages } from "@/lib/catalogue";
import { Button } from "@/components/ui";
import { PackageCard } from "../PackageCard";
import styles from "../page.module.scss";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Kids Birthday Packages",
  description: "Party favours and milestone birthday boxes for kids.",
};

export default async function KidsBirthdayPage() {
  const birthdayPackages = await getBirthdayPackages();
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
        <p>Tell us the occasion, age and budget — we&rsquo;ll put together a quote for a mystery box packed just for them.</p>
        <Button href="/custom-request">Make a Custom Request</Button>
      </section>
    </div>
  );
}
