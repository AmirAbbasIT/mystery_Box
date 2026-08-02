import type { Metadata } from "next";
import { birthdayPackages } from "@/data";
import { Button } from "@/components/ui";
import { PackageCard } from "./PackageCard";
import styles from "./page.module.scss";

export const metadata: Metadata = {
  title: "Birthday Packages",
  description:
    "Kids party favours to adult milestone birthday boxes — or request something custom.",
};

export default function BirthdayPackagesPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Birthday Packages</h1>
        <p>Party favours for the little ones, milestone boxes for the grown-ups.</p>
        <div className={styles.audienceLinks}>
          <Button href="/birthday-packages/kids">Kids Birthdays</Button>
          <Button href="/birthday-packages/adult-party" variant="outline">
            Adult Parties
          </Button>
        </div>
      </header>

      <div className={styles.grid}>
        {birthdayPackages.map((pkg) => (
          <PackageCard key={pkg.id} pkg={pkg} />
        ))}
      </div>
    </div>
  );
}
