import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getEggPrizePools } from "@/lib/catalogue";
import { EggTierSelector } from "./EggTierSelector";
import styles from "./page.module.scss";

export const revalidate = 60;

export const metadata: Metadata = pageMetadata({
  title: "Mystery Pink Eggs",
  description:
    "Crack open mystery pink eggs — choose a pack size, see every possible prize, and try a free preview.",
  path: "/mystery-eggs",
});

export default async function MysteryEggsPage() {
  const eggTiers = await getEggPrizePools();

  if (eggTiers.length === 0) {
    return (
      <div className={styles.page}>
        <header className={styles.header}>
          <h1>Mystery Pink Eggs</h1>
          <p>Fresh eggs are being prepared — check back soon.</p>
        </header>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Mystery Pink Eggs</h1>
        <p>
          Choose a pack and add it to your basket. Every egg holds a real prize,
          hand-packed for you — and you&rsquo;ll only find out what when you crack it open
          at home.
        </p>
      </header>

      <EggTierSelector tiers={eggTiers} />
    </div>
  );
}
