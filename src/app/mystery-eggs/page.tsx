import type { Metadata } from "next";
import { pageMetadata } from "@/lib/seo";
import { getEggPrizePools } from "@/lib/catalogue";
import { Accordion, AccordionItem } from "@/components/ui";
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

  const allPrizeLabels = Array.from(
    new Set(eggTiers.flatMap((tier) => tier.prizes.map((prize) => prize.label))),
  );

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1>Mystery Pink Eggs</h1>
        <p>
          Pick a pack and try a free preview crack below — it&rsquo;s just for fun and
          uses the prize list shown underneath.
        </p>
      </header>

      <EggTierSelector tiers={eggTiers} />

      <section className={styles.odds}>
        <Accordion>
          <AccordionItem title="What could be inside?">
            <ul role="list" className={styles.oddsList}>
              {allPrizeLabels.map((label) => (
                <li key={label}>{label}</li>
              ))}
            </ul>
          </AccordionItem>
        </Accordion>
      </section>
    </div>
  );
}
